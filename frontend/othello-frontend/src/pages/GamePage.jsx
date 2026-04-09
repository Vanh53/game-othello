import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { decodeToken, getToken } from '../utils/auth'
import {
  initBoard, applyMove, getValidMoves, countPieces,
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

  const token = getToken()
  const me = token ? decodeToken(token) : {}
  const myUsername = me?.sub || me?.username

  const [board, setBoard]         = useState(initBoard)
  const [currentTurn, setTurn]    = useState(BLACK)
  const [player1]                 = useState(MOCK_PLAYER1)
  const [player2]                 = useState(MOCK_PLAYER2)
  const [gameOver, setGameOver]   = useState(false)
  const [result, setResult]       = useState(null)
  const [eloDelta]                = useState(null)
  const [drawOffer, setDrawOffer] = useState(false)
  const [lastFlips, setLastFlips] = useState([])
  const [lastMove, setLastMove]   = useState(null)

  const myColor  = player1.username === myUsername ? BLACK : WHITE
  const isMyTurn = currentTurn === myColor

  const validMoves = getValidMoves(board, currentTurn)
  const counts     = countPieces(board)

  const checkEnd = useCallback((b, turn) => {
    const cur = getValidMoves(b, turn)
    const opp = getValidMoves(b, turn === BLACK ? WHITE : BLACK)
    return cur.length === 0 && opp.length === 0
  }, [])

  const resolveResult = useCallback((b) => {
    const c = countPieces(b)
    const mine = myColor === BLACK ? c.black : c.white
    const opp  = myColor === BLACK ? c.white : c.black
    return mine > opp ? 'win' : mine < opp ? 'lose' : 'draw'
  }, [myColor])

  const handleCellClick = (row, col) => {
    if (gameOver || !isMyTurn) return
    const next = applyMove(board, row, col, currentTurn)
    if (!next) return

    const flips = []
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c] !== next[r][c] && next[r][c] === currentTurn)
          flips.push(`${r}-${c}`)

    setLastFlips(flips)
    setLastMove(`${row}-${col}`)
    setBoard(next)

    const nextTurn = currentTurn === BLACK ? WHITE : BLACK
    const oppMoves = getValidMoves(next, nextTurn)

    if (checkEnd(next, nextTurn)) {
      setGameOver(true)
      setResult(resolveResult(next))
      return
    }
    setTurn(oppMoves.length === 0 ? currentTurn : nextTurn)
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
