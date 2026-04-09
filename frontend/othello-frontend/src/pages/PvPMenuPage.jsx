import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinMatchmaking, leaveMatchmaking } from '../api/gameService'
import styles from './PvPMenuPage.module.css'

// view: 'menu' | 'searching' | 'findRoom'
export default function PvPMenuPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('menu')
  const [roomIdInput, setRoomIdInput] = useState('')
  const [roomError, setRoomError] = useState('')

  // matchmaking
  const [searchSeconds, setSearchSeconds] = useState(0)
  const timerRef = useRef(null)
  const pollingRef = useRef(null)

  // Bắt đầu tìm ngẫu nhiên
  const handleRandom = async () => {
    setView('searching')
    setSearchSeconds(0)
    try {
      const res = await joinMatchmaking()
      const gameId = res.data?.data?.id || res.data?.id
      if (gameId) {
        navigate(`/game/${gameId}`)
        return
      }
    } catch {
      // TODO: remove mock — giả lập tìm thấy sau 3s
    }
    // Polling mỗi 3s
    pollingRef.current = setInterval(async () => {
      try {
        const res = await joinMatchmaking()
        const gameId = res.data?.data?.id || res.data?.id
        if (gameId) {
          clearAll()
          navigate(`/game/${gameId}`)
        }
      } catch {
        // vẫn đang chờ
      }
    }, 3000)
  }

  // Đếm giây khi đang tìm
  useEffect(() => {
    if (view === 'searching') {
      timerRef.current = setInterval(() => {
        setSearchSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [view])

  const clearAll = () => {
    clearInterval(timerRef.current)
    clearInterval(pollingRef.current)
  }

  const handleCancelSearch = async () => {
    clearAll()
    try { await leaveMatchmaking() } catch { /* ignore */ }
    setView('menu')
    setSearchSeconds(0)
  }

  // Tìm phòng theo ID
  const handleJoinRoom = () => {
    const id = roomIdInput.trim()
    if (!id) { setRoomError('Vui lòng nhập ID phòng.'); return }
    navigate(`/room/${id}`)
  }

  // Tạo phòng mới
  const handleCreateRoom = () => {
    navigate('/room/new')
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => { clearAll(); navigate('/') }}>
          ← Trang chủ
        </button>
        <span className={styles.logo}>⚔️ Chơi PvP</span>
        <div />
      </header>

      <main className={styles.main}>

        {/* ── MENU ── */}
        {view === 'menu' && (
          <div className={styles.menuGrid}>
            <button className={styles.modeCard} onClick={handleRandom}>
              <span className={styles.modeIcon}>🎲</span>
              <span className={styles.modeTitle}>Ngẫu nhiên</span>
              <span className={styles.modeDesc}>Ghép trận tự động với đối thủ phù hợp</span>
            </button>

            <button className={styles.modeCard} onClick={() => setView('findRoom')}>
              <span className={styles.modeIcon}>🔍</span>
              <span className={styles.modeTitle}>Tìm phòng</span>
              <span className={styles.modeDesc}>Nhập ID phòng để tham gia trận đấu</span>
            </button>

            <button className={styles.modeCard} onClick={handleCreateRoom}>
              <span className={styles.modeIcon}>🏠</span>
              <span className={styles.modeTitle}>Tạo phòng</span>
              <span className={styles.modeDesc}>Tạo phòng riêng và mời bạn bè vào chơi</span>
            </button>

            {/* TODO: remove test button */}
            <button className={styles.modeCardTest} onClick={() => navigate('/game/test')}>
              <span className={styles.modeIcon}>🧪</span>
              <span className={styles.modeTitle}>Test Game</span>
              <span className={styles.modeDesc}>Xem giao diện fight với người chơi ảo</span>
            </button>
          </div>
        )}

        {/* ── SEARCHING ── */}
        {view === 'searching' && (
          <div className={styles.searchingBox}>
            <div className={styles.spinner} aria-hidden="true" />
            <h2 className={styles.searchingTitle}>Đang tìm đối thủ...</h2>
            <p className={styles.searchingTime}>{formatTime(searchSeconds)}</p>
            <p className={styles.searchingHint}>Hệ thống đang ghép trận dựa trên ELO của bạn</p>
            <button className={styles.btnCancel} onClick={handleCancelSearch}>
              Hủy tìm kiếm
            </button>
          </div>
        )}

        {/* ── FIND ROOM ── */}
        {view === 'findRoom' && (
          <div className={styles.findRoomBox}>
            <h2 className={styles.findRoomTitle}>🔍 Tìm phòng</h2>
            <p className={styles.findRoomDesc}>Nhập ID phòng do người tạo cung cấp</p>
            <div className={styles.findRoomRow}>
              <input
                type="text"
                className={styles.roomInput}
                placeholder="Nhập ID phòng..."
                value={roomIdInput}
                onChange={(e) => { setRoomIdInput(e.target.value); setRoomError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                autoFocus
              />
              <button className={styles.btnJoin} onClick={handleJoinRoom}>
                Vào phòng
              </button>
            </div>
            {roomError && <p className={styles.roomError}>{roomError}</p>}
            <button className={styles.btnBack} onClick={() => { setView('menu'); setRoomIdInput(''); setRoomError('') }}>
              ← Quay lại
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
