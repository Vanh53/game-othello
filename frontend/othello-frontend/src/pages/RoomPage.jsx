import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRoom, joinRoom, startRoom, leaveRoom } from '../api/gameService'
import { decodeToken, getToken } from '../utils/auth'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import styles from './RoomPage.module.css'

const POLL_INTERVAL = 2500

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef(null)
  const clientRef = useRef(null);

  const token = getToken()
  const me = token ? decodeToken(token) : {}
  // JWT của identity-service dùng sub = userId (UUID)
  const myUserId = me?.sub

  const initializedRef = useRef(false)

  useEffect(() => {
    const init = async () => {
      try {
        if (roomId === 'new') {

          // BƯỚC CHẶN: Nếu đã chạy rồi thì return luôn, không gọi API nữa
          if (initializedRef.current) return
          initializedRef.current = true

          // Tạo phòng mới — backend trả về RoomResponse
          const roomData = await createRoom()
          // roomData = { roomId, hostUsername, guestUsername, status, createdAt }
          setRoom(roomData)
        } else {
          // Join phòng có sẵn
          const roomData = await joinRoom(roomId)
          setRoom(roomData)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [roomId])

  useEffect(() => {
  if (!room?.roomId) return;

  // Khởi tạo STOMP Client
  const stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
      // Đăng ký nghe kênh riêng của phòng này
      stompClient.subscribe(`/topic/room/${room.roomId}`, (msg) => {
        const updatedRoom = JSON.parse(msg.body);
        setRoom(updatedRoom); // Khi có tin nhắn, cập nhật ngay lập tức
        console.log("Cập nhật phòng real-time:", updatedRoom);
      });

    // 2. NGHE KÊNH RIÊNG: Lệnh bắt đầu trận đấu từ Server (MatchService)
      stompClient.subscribe('/user/queue/status', (msg) => {
        let payload = {};
        try { payload = JSON.parse(msg.body); } catch (e) { /* ignore */ }
        
        if (payload.status === 'ONGOING' && payload.id) {
            if (clientRef.current) clientRef.current.deactivate();
            navigate(`/game/${payload.id}`);
        }
      });
    },
  });

  stompClient.activate();
  clientRef.current = stompClient;

  // Cleanup: Ngắt kết nối khi rời trang
  return () => {
    if (clientRef.current) clientRef.current.deactivate();
  };
}, [room?.roomId]); // Chỉ chạy lại nếu ID phòng thay đổi

  const handleStart = async () => {
    if (!room?.guestUsername) return
    setStarting(true)
    try {
      // POST /matches/{roomId} → tạo trận từ phòng
      // Backend trả về MatchResponse: { id, matchType, player1Id, player2Id, status, startTime, ... }
      const matchData = await startRoom(room.roomId)
      // navigate(`/game/${matchData.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setStarting(false)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(room.roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleBack = async () => {
    if (room?.roomId) {
      try {
        await leaveRoom(room.roomId); // Gọi API để xóa/cập nhật phòng trong Redis
      } catch (e) {
        console.error("Lỗi khi rời phòng:", e)
      }
    }
    navigate('/pvp');
  }

  // Host là người tạo phòng
  const isHost = room?.hostUsername && myUserId
    ? room.hostUsername === myUserId
    : false

  if (loading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <p>Đang tải phòng...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.error}>{error}</p>
        <button onClick={() => navigate('/pvp')}>← Quay lại</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          ← Quay lại
        </button>
        <span className={styles.logo}>🏠 Phòng chờ</span>
        <div />
      </header>

      <main className={styles.main}>
        <div className={styles.roomIdBox}>
          <span className={styles.roomIdLabel}>ID Phòng</span>
          <div className={styles.roomIdRow}>
            {/* roomId là field đúng từ RoomResponse */}
            <span className={styles.roomIdValue}>{room?.roomId}</span>
            <button className={styles.copyBtn} onClick={handleCopyId} title="Sao chép">
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <p className={styles.roomIdHint}>Chia sẻ ID này để mời bạn bè vào phòng</p>
        </div>

        <div className={styles.playersRow}>
          {/* hostUsername là string (userId) từ backend */}
          <PlayerSlot
            username={room?.hostUsername}
            label="Người chơi 1"
            isMe={room?.hostUsername === myUserId}
          />
          <div className={styles.vsBlock}>
            <span className={styles.vsText}>VS</span>
          </div>
          <PlayerSlot
            username={room?.guestUsername}
            label="Người chơi 2"
            isMe={room?.guestUsername === myUserId}
            waiting
          />
        </div>

        {isHost ? (
          <button
            className={styles.btnStart}
            onClick={handleStart}
            disabled={!room?.guestUsername || starting}
          >
            {starting
              ? 'Đang bắt đầu...'
              : !room?.guestUsername
              ? '⏳ Chờ đối thủ vào phòng...'
              : '🎮 Bắt đầu trận đấu'}
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

// username ở đây là userId (UUID string) từ backend
function PlayerSlot({ username, isMe, label, waiting }) {
  return (
    <div className={`${styles.playerSlot} ${isMe ? styles.playerSlotMe : ''} ${!username ? styles.playerSlotEmpty : ''}`}>
      <div className={styles.avatarWrap}>
        {username ? (
          <span className={styles.avatarFallback}>{username[0].toUpperCase()}</span>
        ) : (
          <span className={styles.avatarEmpty}>?</span>
        )}
        {isMe && <span className={styles.meBadge}>Bạn</span>}
      </div>

      {username ? (
        <p className={styles.playerName}>{username}</p>
      ) : (
        <>
          <p className={styles.emptyLabel}>{label}</p>
          {waiting && <p className={styles.waitingDots}><span>.</span><span>.</span><span>.</span></p>}
        </>
      )}
    </div>
  )
}
