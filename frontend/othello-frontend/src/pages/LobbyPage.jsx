import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAiModels, startAiGame, joinMatchmaking, leaveMatchmaking } from '../api/gameService'
import { removeToken, decodeToken, getToken, isAdmin } from '../utils/auth'
import { MOCK_AI_MODELS } from '../mock/mockData'
import styles from './LobbyPage.module.css'

const DIFFICULTY_LABEL = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  EXPERT: 'Chuyên gia',
}

const DIFFICULTY_ORDER = ['EASY', 'MEDIUM', 'HARD', 'EXPERT']

export default function LobbyPage() {
  const navigate = useNavigate()
  const [aiModels, setAiModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [modelsError, setModelsError] = useState('')

  const [selectedModel, setSelectedModel] = useState(null)
  const [startingAi, setStartingAi] = useState(false)

  const [inQueue, setInQueue] = useState(false)
  const [queueLoading, setQueueLoading] = useState(false)

  const [error, setError] = useState('')

  const token = getToken()
  const user = token ? decodeToken(token) : {}

  useEffect(() => {
    getAiModels()
      .then((res) => {
        const models = res.data?.data || res.data || []
        const sorted = [...models].sort((a, b) => {
          const ai = DIFFICULTY_ORDER.indexOf(a.difficulty?.toUpperCase())
          const bi = DIFFICULTY_ORDER.indexOf(b.difficulty?.toUpperCase())
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })
        setAiModels(sorted)
      })
      .catch(() => {
        // TODO: remove mock fallback when backend is ready
        setAiModels(MOCK_AI_MODELS)
      })
      .finally(() => setLoadingModels(false))
  }, [])

  const handlePlayAi = async () => {
    if (!selectedModel) return
    setStartingAi(true)
    setError('')
    try {
      const res = await startAiGame(selectedModel.id)
      const gameId = res.data?.data?.id || res.data?.id
      navigate(`/game/${gameId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setStartingAi(false)
    }
  }

  const handleToggleQueue = async () => {
    setQueueLoading(true)
    setError('')
    try {
      if (inQueue) {
        await leaveMatchmaking()
        setInQueue(false)
      } else {
        const res = await joinMatchmaking()
        const gameId = res.data?.data?.id || res.data?.id
        if (gameId) {
          // Match tìm được ngay
          navigate(`/game/${gameId}`)
        } else {
          setInQueue(true)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setQueueLoading(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>Othello</span>
        <nav className={styles.nav}>
          {isAdmin() && (
            <button className={styles.navBtn} onClick={() => navigate('/admin')}>
              ⚙️ Admin
            </button>
          )}
          <button className={styles.navBtn} onClick={() => navigate('/leaderboard')}>
            🏆 Bảng xếp hạng
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/profile')}>
            Hồ sơ
          </button>
          <button className={styles.navBtn} onClick={handleLogout}>
            Đăng xuất
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <h2 className={styles.welcome}>
          Xin chào, <span>{user?.sub || user?.username || 'bạn'}</span>
        </h2>

        {error && <p className={styles.error}>{error}</p>}

        {/* PvP */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Chơi PvP</h3>
          <p className={styles.sectionDesc}>Đấu với người chơi khác theo nhiều hình thức</p>
          <button className={styles.btnPvp} onClick={() => navigate('/pvp')}>
            ⚔️ Chơi PvP
          </button>
        </section>

        {/* Play vs AI */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Chơi với AI</h3>
          <p className={styles.sectionDesc}>Chọn độ khó và thách đấu AI</p>

          {loadingModels ? (
            <p className={styles.hint}>Đang tải danh sách AI...</p>
          ) : modelsError ? (
            <p className={styles.error}>{modelsError}</p>
          ) : aiModels.length === 0 ? (
            <p className={styles.hint}>Chưa có AI model nào.</p>
          ) : (
            <div className={styles.modelGrid}>
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  className={`${styles.modelCard} ${
                    selectedModel?.id === model.id ? styles.modelCardSelected : ''
                  }`}
                  onClick={() => setSelectedModel(model)}
                >
                  <span className={styles.modelName}>{model.name}</span>
                  <span
                    className={`${styles.diffBadge} ${
                      styles[`diff${model.difficulty}`] || ''
                    }`}
                  >
                    {DIFFICULTY_LABEL[model.difficulty?.toUpperCase()] || model.difficulty}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            className={styles.btnAi}
            onClick={handlePlayAi}
            disabled={!selectedModel || startingAi}
          >
            {startingAi
              ? 'Đang bắt đầu...'
              : selectedModel
              ? `🤖 Chơi với ${selectedModel.name}`
              : '🤖 Chọn AI để chơi'}
          </button>
        </section>
      </main>
    </div>
  )
}
