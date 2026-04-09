import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRoom, getRoom, startRoom } from '../api/gameService'
import { decodeToken, getToken } from '../utils/auth'
import { MOCK_ROOM } from '../mock/mockData'
import styles from './RoomPage.module.css'

const POLL_INTERVAL = 2500

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef(null)

  const token = getToken()
  const me = token ? decodeToken(token) : {}
  const myUsername = me?.sub || me?.username

  useEffect(() => {
    const init = async () => {
      try {
        if (roomId === 'new') {
          const res = await createRoom()
          setRoom(res.data?.data || res.data)
        } else {
          const res = await getRoom(roomId)
          setRoom(res.data?.data || res.data)
        }
      } catch {
        // TODO: remove mock
        setRoom({ ...MOCK_ROOM, id: roomId === 'new' ? 'ROOM-4829' : roomId })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [roomId])

  useEffect(() => {
    if (!room || room.player2) return
    pollingRef.current = setInterval(async () => {
      try {
        const res = await getRoom(room.id)
        const updated = res.data?.data || res.data
        setRoom(updated)
        if (updated.player2) clearInterval(pollingRef.current)
      } catch { /* still waiting */ }
    }, POLL_INTERVAL)
    return () => clearInterval(pollingRef.current)
  }, [room?.id, room?.player2])

  const handleStart = async () => {
    if (!room?.player2) return
    setStarting(true)
    try {
      const res = await startRoom(room.id)
      const gameId = res.data?.data?.id || res.data?.id || room.id
      navigate(`/game/${gameId}`)
    } catch {
      navigate(`/game/${room.id}`) // TODO: remove mock
    } finally {
      setStarting(false)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(room.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isHost = room?.player1?.username === myUsername

  if (loading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <p>Đang tải phòng...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/pvp')}>
          ← Quay lại
        </button>
        <span className={styles.logo}>🏠 Phòng chờ</span>
        <div />
      </header>

      <main className={styles.main}>
        <div className={styles.roomIdBox}>
          <span className={styles.roomIdLabel}>ID Phòng</span>
          <div className={styles.roomIdRow}>
            <span className={styles.roomIdValue}>{room?.id}</span>
            <button className={styles.copyBtn} onClick={handleCopyId} title="Sao chép">
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <p className={styles.roomIdHint}>Chia sẻ ID này để mời bạn bè vào phòng</p>
        </div>

        <div className={styles.playersRow}>
          <PlayerSlot
            player={room?.player1}
            label="Người chơi 1"
            isMe={room?.player1?.username === myUsername}
          />
          <div className={styles.vsBlock}>
            <span className={styles.vsText}>VS</span>
          </div>
          <PlayerSlot
            player={room?.player2}
            label="Người chơi 2"
            isMe={room?.player2?.username === myUsername}
            waiting
          />
        </div>

        {isHost ? (
          <button
            className={styles.btnStart}
            onClick={handleStart}
            disabled={!room?.player2 || starting}
          >
            {starting ? 'Đang bắt đầu...' : !room?.player2 ? '⏳ Chờ đối thủ vào phòng...' : '🎮 Bắt đầu trận đấu'}
          </button>
        ) : (
          <p className={styles.waitingHint}>
            <span className={styles.dot} />
            Đang chờ host bắt đầu trận...
          </p>
        )}
      </main>
    </div>
  )
}

function PlayerSlot({ player, isMe, label, waiting }) {
  return (
    <div className={`${styles.playerSlot} ${isMe ? styles.playerSlotMe : ''} ${!player ? styles.playerSlotEmpty : ''}`}>
      <div className={styles.avatarWrap}>
        {player ? (
          player.avatar
            ? <img src={player.avatar} alt="" className={styles.avatarImg} />
            : <span className={styles.avatarFallback}>{player.username[0].toUpperCase()}</span>
        ) : (
          <span className={styles.avatarEmpty}>?</span>
        )}
        {isMe && <span className={styles.meBadge}>Bạn</span>}
      </div>

      {player ? (
        <>
          <p className={styles.playerName}>{player.username}</p>
          {player.name && <p className={styles.playerDisplayName}>{player.name}</p>}
          <div className={styles.eloChip}>⚡ {player.elo ?? '—'}</div>
        </>
      ) : (
        <>
          <p className={styles.emptyLabel}>{label}</p>
          {waiting && <p className={styles.waitingDots}><span>.</span><span>.</span><span>.</span></p>}
        </>
      )}
    </div>
  )
}
