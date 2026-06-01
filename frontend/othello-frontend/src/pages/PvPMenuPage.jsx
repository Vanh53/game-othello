import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinMatchmaking, leaveMatchmaking } from '../api/gameService'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getToken } from '../utils/auth'
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
  const clientRef = useRef(null)
  const subscriptionRef = useRef(null)

  // Bắt đầu tìm ngẫu nhiên — sử dụng SockJS + STOMP (WebSocket)
  const handleRandom = async () => {
    setView('searching')
    setSearchSeconds(0)

    // tạo client STOMP qua SockJS
    const token = getToken()
    const sockUrl = '/ws' // proxy (vite/nginx) sẽ chuyển tiếp tới backend
    const stompClient = new Client({
      webSocketFactory: () =>
        new SockJS(token ? `/ws?token=${encodeURIComponent(token)}` : '/ws'),
      // connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {},
      onConnect: () => {
        // subscribe nhận trạng thái riêng cho user
        subscriptionRef.current = stompClient.subscribe('/user/queue/status', (msg) => {
          let payload = {}
          try { payload = JSON.parse(msg.body) } catch (e) { payload = { data: msg.body } }
          const gameId = payload?.id || payload?.result?.id || payload?.data?.result?.id || payload?.data?.id || payload?.gameId
          if (gameId) {
            clearAll()
            navigate(`/game/${gameId}`)
          }
        })

        // gửi yêu cầu join matchmaking
        stompClient.publish({ destination: '/app/game.join', body: '' })
      },
      onStompError: (frame) => {
        // fallback: giữ trạng thái searching, có thể log
        console.error('STOMP error', frame)
      },
    })

    clientRef.current = stompClient
    stompClient.activate()
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
    if (subscriptionRef.current && subscriptionRef.current.unsubscribe) {
      try { subscriptionRef.current.unsubscribe() } catch (e) { /* ignore */ }
      subscriptionRef.current = null
    }
    if (clientRef.current) {
      try { clientRef.current.deactivate() } catch (e) { /* ignore */ }
      clientRef.current = null
    }
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
