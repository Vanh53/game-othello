import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeToken, decodeToken, getToken, isAdmin } from '../utils/auth'
import styles from './LobbyPage.module.css'

export default function LobbyPage() {
  const navigate = useNavigate()

  const token = getToken()
  const user = token ? decodeToken(token) : {}

  useEffect(() => {
    if (token && isAdmin()) {
      navigate('/admin', { replace: true })
    }
  }, [navigate, token])

  const goProtected = (path) => {
    if (token) {
      navigate(path)
      return
    }

    navigate('/login', { state: { redirectTo: path } })
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
          <button className={styles.navBtn} onClick={() => navigate('/profile')}>
            Hồ sơ
          </button>
          {!token && (
            <button className={styles.navBtn} onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          )}
          {token && (
            <button className={styles.navBtn} onClick={handleLogout}>
              Đăng xuất
            </button>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        <h2 className={styles.welcome}>
          {token ? (
            <>
              Xin chào, <span>{user?.name || user?.username || 'bạn'}</span>
            </>
          ) : (
            <>
              Chào mừng bạn đến với <span>Othello</span>
            </>
          )}
        </h2>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Chơi PvP</h3>
          <p className={styles.sectionDesc}>Đấu với người chơi khác theo nhiều hình thức</p>
          <div className={styles.actionRow}>
            <button className={styles.btnPvp} onClick={() => goProtected('/pvp')}>
              ⚔️ Chơi PvP
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Chơi với máy</h3>
          <p className={styles.sectionDesc}>Chế độ đấu với máy hiện chưa xử lý sự kiện</p>
          <button className={styles.btnAi} type="button">
            🤖 Chơi với máy
          </button>
        </section>

        <section className={styles.section}>
          <button className={styles.btnLeader} onClick={() => goProtected('/leaderboard')}>
            🏆 Bảng xếp hạng
          </button>
        </section>
      </main>
    </div>
  )
}
