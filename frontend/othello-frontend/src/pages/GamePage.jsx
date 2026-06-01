import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { decodeToken, getToken } from '../utils/auth'
import { getMatch, getGameState } from '../api/gameService'
import {
  initBoard, getValidMoves, countPieces,
  BLACK, WHITE, EMPTY,
} from '../utils/othello'
import styles from './GamePage.module.css'

const MOCK_PLAYER1 = { username: 'user123', name: 'Nguyen Van A', avatar: null, elo: 2150 }
const MOCK_PLAYER2 = { username: 'shadow_x', name: 'Le Van C',    avatar: null, elo: 1990 }

function AvatarCircle({ player, size = 44, highlight }) {
  return (
    <div
      className={`${styles.avatar} ${highlight ? styles.avatarActive : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {player.avatar
        ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        : <span>{player.username[0].toUpperCase()}</span>}
    </div>
  )
}

function PlayerInfo({ player, pieces, isActive, colorLabel, reverse }) {
  return (
    <div className={`${styles.playerInfo} ${reverse ? styles.playerInfoReverse : ''}`}>
      <AvatarCircle player={player} size={44} highlight={isActive} />
      <div className={styles.playerMeta}>
        <span className={styles.playerName}>{player.username}</span>
        <span className={styles.playerElo}>⚡ {player.elo}</span>
      </div>
      <div className={styles.piecesCount}>
        <span className={styles.colorDot}>{colorLabel}</span>
        <span className={styles.piecesNum}>{pieces}</span>
      </div>
    </div>
  )
}

function EndgameOverlay({ result, player1, player2, counts, eloDelta, onRematch, onHome }) {
  const icon  = result === 'win' ? '🏆' : result === 'lose' ? '💀' : '🤝'
  const title = result === 'win' ? 'Chien thang!' : result === 'lose' ? 'That bai!' : 'Hoa co!'
  const color = result === 'win' ? '#86efac' : result === 'lose' ? '#fca5a5' : '#fde68a'

  return (
    <div className={styles.overlay}>
      <div className={styles.endCard}>
        <span className={styles.endIcon}>{icon}</span>
        <h2 className={styles.endTitle} style={{ color }}>{title}</h2>

        <div className={styles.endScores}>
          <div className={styles.endPlayer}>
            <AvatarCircle player={player1} size={48} />
            <span className={styles.endPName}>{player1.username}</span>
            <span className={styles.endPieces}>{counts.black} quan</span>
          </div>
          <span className={styles.endVs}>vs</span>
          <div className={styles.endPlayer}>
            <AvatarCircle player={player2} size={48} />
            <span className={styles.endPName}>{player2.username}</span>
            <span className={styles.endPieces}>{counts.white} quan</span>
          </div>
        </div>

        {eloDelta !== null && (
          <p className={styles.eloDelta} style={{ color }}>
            {eloDelta > 0 ? `+${eloDelta}` : eloDelta} ELO
          </p>
        )}

        <div className={styles.endActions}>
          <button className={styles.btnRematch} onClick={onRematch}>🔄 Choi lai</button>
          <button className={styles.btnHome} onClick={onHome}>🏠 Trang chu</button>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  const navigate = useNavigate()
  const { gameId } = useParams()

  const token = getToken()
  const me = token ? decodeToken(token) : {}
  const myUsername = me?.sub || me?.username

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [board, setBoard]         = useState(initBoard)
  const [currentTurn, setTurn]    = useState(BLACK)
  const [player1, setPlayer1]     = useState(MOCK_PLAYER1)
  const [player2, setPlayer2]     = useState(MOCK_PLAYER2)
  const [gameOver, setGameOver]   = useState(false)
  const [result, setResult]       = useState(null)
  const [eloDelta]                = useState(null)
  const [drawOffer, setDrawOffer] = useState(false)
  const [lastFlips, setLastFlips] = useState([])
  const [lastMove, setLastMove]   = useState(null)
  const [moveError, setMoveError] = useState('')
  
  const clientRef = useRef(null)
  const gameSubscriptionRef = useRef(null)
  const errorSubscriptionRef = useRef(null)
  const boardRef = useRef(board)
  const liveStateReceivedRef = useRef(false)

  useEffect(() => {
    boardRef.current = board
  }, [board])

  // Fetch match info and game state from backend
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true)
        const match = await getMatch(gameId)
        const gameState = await getGameState(gameId)
        
        // Set player info from match
        if (match.player1) setPlayer1(match.player1)
        if (match.player2) setPlayer2(match.player2)
        
        // Reconstruct board from gameState
        if (gameState.board && !liveStateReceivedRef.current) {
          setBoard(gameState.board)
        }
        if (gameState.currentTurn && !liveStateReceivedRef.current) {
          setTurn(gameState.currentTurn === 'BLACK' ? BLACK : WHITE)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch game data:', err)
        setError('Không thể tải dữ liệu trận đấu')
        setLoading(false)
      }
    }
    
    if (gameId) {
      fetchGameData()
    }
  }, [gameId])

  // Subscribe to game updates via WebSocket
  useEffect(() => {
    if (!gameId) return
    
    const token = getToken()
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(token ? `/ws?token=${token}` : '/ws'),
      // connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {},
      heartbeatOutgoing: 30000,  // Send heartbeat every 30s
      heartbeatIncoming: 30000,  // Expect heartbeat every 30s
      reconnectDelay: 1000,      // Reconnect after 1s if disconnect
      maxWebSocketChunkSize: 8 * 1024,
      onConnect: () => {
        console.log('[GamePage] 🟢 WebSocket CONNECTED, subscribing to /user/queue/game')
        console.log('[GamePage] 👤 MyUsername from token:', myUsername)
        console.log('[GamePage] 🎮 GameId:', gameId)
        
        // Fetch fresh game state after reconnect
        getGameState(gameId).then(gameState => {
          console.log('[GamePage] 📥 Fetched game state after reconnect:', { currentTurn: gameState.currentTurn, status: gameState.status })
          if (gameState.board) {
            setBoard(gameState.board)
          }
          if (gameState.currentTurn) {
            setTurn(gameState.currentTurn === 'BLACK' ? BLACK : WHITE)
          }
        }).catch(err => {
          console.error('[GamePage] ❌ Failed to fetch game state after reconnect:', err)
        })
        
        // Subscribe to game updates for this match
        console.log('[GamePage] 🔔 About to subscribe to /user/queue/game')
        const subDestination = `/user/queue/game`
        console.log('[GamePage] 📌 Subscription destination:', subDestination)
        gameSubscriptionRef.current = stompClient.subscribe(subDestination, (msg) => {
          console.log('[GamePage] 🚨🚨🚨 MESSAGE ARRIVED AT SUBSCRIPTION HANDLER 🚨🚨🚨')
          console.log('[GamePage] Message ID:', msg.id)
          console.log('[GamePage] Message headers:', msg.headers)
          console.log('[GamePage] Message body length:', msg.body?.length)
          console.log('[GamePage] Message body:', msg.body)
          
          try {
            console.log('[GamePage] 📩 Received game update message:', msg.body.substring(0, 100))
            const gameState = JSON.parse(msg.body)
            console.log('[GamePage] ✅ Parsed game state:', { matchId: gameState.matchId, currentTurn: gameState.currentTurn, status: gameState.status })
            if (gameState.matchId && gameState.matchId !== gameId) {
              console.log('[GamePage] ⚠️ Ignoring message for different match:', gameState.matchId, '!==', gameId)
              return
            }

            if (gameState.board) {
              liveStateReceivedRef.current = true
              const prevBoard = boardRef.current
              let detectedMove = null
              const flipped = []
              for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                  if (prevBoard[r][c] !== gameState.board[r][c] && gameState.board[r][c] !== EMPTY) {
                    detectedMove = `${r}-${c}`
                    flipped.push(`${r}-${c}`)
                  }
                }
              }
              if (detectedMove) {
                console.log('[GamePage] 🎯 Detected move at:', detectedMove)
                setLastMove(detectedMove)
                setLastFlips(flipped)
              }
              console.log('[GamePage] 🎮 Updating board state')
              setBoard(gameState.board)
            }
            if (gameState.currentTurn) {
              console.log('[GamePage] 🔄 Updating turn from', gameState.currentTurn)
              setTurn(gameState.currentTurn === 'BLACK' ? BLACK : WHITE)
            }
            setMoveError('')
            if (gameState.status === 'FINISHED' || gameState.status === 'DRAW' || gameState.status === 'FORFEIT') {
              setGameOver(true)
              // TODO: Set result based on gameState.winner
            }
          } catch (e) {
            console.error('Failed to parse game update:', e)
          }
        })

        errorSubscriptionRef.current = stompClient.subscribe('/user/queue/error', (msg) => {
          console.log('[GamePage] ❌ Received error message:', msg.body)
          try {
            const payload = JSON.parse(msg.body)
            setMoveError(payload?.message || 'Nước đi không hợp lệ')
          } catch (e) {
            console.error('[GamePage] 💥 Error parsing error message:', e)
            setMoveError('Nước đi không hợp lệ')
          }
        })
        console.log('[GamePage] ✅ Subscriptions active (game + error queues)')
        console.log('[GamePage] 📍 Subscription IDs - game:', gameSubscriptionRef.current?.id, ', error:', errorSubscriptionRef.current?.id)
      },
      onStompError: (frame) => {
        console.error('[GamePage] 🔴 WebSocket STOMP error:', frame)
      },
      onDisconnect: (frame) => {
        console.warn('[GamePage] 🔌 WebSocket disconnected:', frame)
        console.log('[GamePage] 🔄 Auto-reconnecting in 1 second...')
      },
      onWebSocketError: (error) => {
        console.error('[GamePage] 🔴 WebSocket network error:', error)
      },
    })
    
    clientRef.current = stompClient
    console.log('[GamePage] 🔗 Activating WebSocket connection...')
    stompClient.activate()
    
    // Log connection status after 1 second
    setTimeout(() => {
      console.log('[GamePage] Connection check - connected:', stompClient.connected, ', active:', stompClient.active)
    }, 1000)
    
    return () => {
      if (gameSubscriptionRef.current && gameSubscriptionRef.current.unsubscribe) {
        try { gameSubscriptionRef.current.unsubscribe() } catch (e) { }
      }
      if (errorSubscriptionRef.current && errorSubscriptionRef.current.unsubscribe) {
        try { errorSubscriptionRef.current.unsubscribe() } catch (e) { }
      }
      if (clientRef.current) {
        try { clientRef.current.deactivate() } catch (e) { }
      }
    }
  }, [gameId])

  const myColor  = player1.username === myUsername ? BLACK : WHITE
  const isMyTurn = currentTurn === myColor

  const validMoves = getValidMoves(board, currentTurn)
  const counts     = countPieces(board)

  const handleCellClick = (row, col) => {
    if (gameOver || !isMyTurn) return
    if (!validSet.has(`${row}-${col}`)) return

    console.log('[GamePage] Pre-move check - client:', !!clientRef.current, ', connected:', clientRef.current?.connected, ', active:', clientRef.current?.active)
    console.log('[GamePage] Subscription status - game:', !!gameSubscriptionRef.current, ', error:', !!errorSubscriptionRef.current)
    
    if (!clientRef.current || !clientRef.current.connected) {
      const msg = 'Kết nối realtime chưa sẵn sàng'
      console.warn('[GamePage] ⚠️', msg)
      setMoveError(msg)
      return
    }

    if (!gameSubscriptionRef.current) {
      const msg = 'Subscription chưa sẵn sàng, vui lòng đợi...'
      console.warn('[GamePage] ⚠️', msg)
      setMoveError(msg)
      return
    }

    setMoveError('')

    console.log('[GamePage] 📤 Publishing move:', { matchId: gameId, row, col })
    try {
      clientRef.current.publish({
        destination: '/app/game.move',
        body: JSON.stringify({ matchId: gameId, row, col }),
      })
      console.log('[GamePage] ✉️ Move published successfully')
    } catch (e) {
      console.error('[GamePage] 💥 Publish failed:', e)
      setMoveError('Lỗi gửi nước đi: ' + e.message)
    }
  }

  const handleResign = () => { setGameOver(true); setResult('lose') }
  const handleDrawOffer = () => setDrawOffer(true)
  const handleDrawAccept = () => { setGameOver(true); setResult('draw') }
  const handleDrawDecline = () => setDrawOffer(false)

  const handleRematch = () => {
    setBoard(initBoard())
    setTurn(BLACK)
    setGameOver(false)
    setResult(null)
    setLastFlips([])
    setLastMove(null)
    setDrawOffer(false)
  }

  const validSet = new Set(validMoves.map(([r, c]) => `${r}-${c}`))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Thoat</button>
        <span className={styles.logo}>Othello</span>
        <div />
      </header>

      <main className={styles.main}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: '18px' }}>
            <div style={{ marginBottom: '20px' }}>Đang tải trận đấu...</div>
          </div>
        )}
        
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ff6b6b', fontSize: '18px' }}>
            <div style={{ marginBottom: '20px' }}>{error}</div>
            <button onClick={() => navigate('/')}>← Quay lại</button>
          </div>
        )}
        
        {!loading && !error && (
          <>
            <div className={styles.playersBar}>
              <PlayerInfo player={player1} pieces={counts.black} isActive={currentTurn === BLACK && !gameOver} colorLabel="⚫" />
              <div className={styles.turnIndicator}>
                {gameOver ? '🏁 Ket thuc' : isMyTurn ? '🟢 Luot ban' : '⏳ Cho doi thu'}
              </div>
              <PlayerInfo player={player2} pieces={counts.white} isActive={currentTurn === WHITE && !gameOver} colorLabel="⚪" reverse />
            </div>

            <div className={styles.boardWrapper}>
              <div className={styles.board}>
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const key       = `${r}-${c}`
                    const isValid   = isMyTurn && validSet.has(key) && !gameOver
                    const isLast    = lastMove === key
                    const isFlipped = lastFlips.includes(key)
                    return (
                      <div
                        key={key}
                        className={`${styles.cell} ${isValid ? styles.cellValid : ''} ${isLast ? styles.cellLast : ''}`}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {cell !== EMPTY && (
                          <div className={`${styles.piece} ${cell === BLACK ? styles.pieceBlack : styles.pieceWhite} ${isFlipped ? styles.pieceFlip : ''}`} />
                        )}
                        {isValid && cell === EMPTY && <div className={styles.hint} />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {!gameOver && (
              <div className={styles.actions}>
                {moveError && (
                  <div style={{ color: '#ff8a8a', marginBottom: '10px', fontSize: '14px' }}>
                    {moveError}
                  </div>
                )}
                {drawOffer ? (
                  <div className={styles.drawOfferBox}>
                    <span>Doi thu cau hoa. Chap nhan?</span>
                    <button className={styles.btnAccept} onClick={handleDrawAccept}>✅ Chap nhan</button>
                    <button className={styles.btnDecline} onClick={handleDrawDecline}>❌ Tu choi</button>
                  </div>
                ) : (
                  <>
                    <button className={styles.btnResign} onClick={handleResign}>🏳️ Xin thua</button>
                    <button className={styles.btnDraw} onClick={handleDrawOffer}>🤝 Cau hoa</button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {gameOver && (
        <EndgameOverlay
          result={result}
          player1={player1}
          player2={player2}
          counts={counts}
          eloDelta={eloDelta}
          onRematch={handleRematch}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  )
}
