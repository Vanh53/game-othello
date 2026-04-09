import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeaderboard, getMyProfile } from '../api/userService'
import { MOCK_LEADERBOARD, MOCK_MY_PROFILE } from '../mock/mockData'
import styles from './LeaderboardPage.module.css'

const PAGE_SIZE = 10

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [myProfile, setMyProfile] = useState(null)

  useEffect(() => {
    getMyProfile()
      .then((res) => setMyProfile(res.data?.data || res.data))
      .catch(() => {
        // TODO: remove mock fallback when backend is ready
        setMyProfile(MOCK_MY_PROFILE)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    getLeaderboard(currentPage, PAGE_SIZE)
      .then((res) => {
        const data = res.data?.data || res.data
        setPlayers(data?.content || data || [])
        setTotalPages(data?.totalPages || 1)
      })
      .catch(() => {
        // TODO: remove mock fallback when backend is ready
        setPlayers(MOCK_LEADERBOARD.content)
        setTotalPages(MOCK_LEADERBOARD.totalPages)
      })
      .finally(() => setLoading(false))
  }, [currentPage])

  const globalRank = (index) => currentPage * PAGE_SIZE + index + 1

  const winRate = (p) => {
    if (!p.totalMatches || p.totalMatches === 0) return '—'
    return ((p.totalWins / p.totalMatches) * 100).toFixed(1) + '%'
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Trang chủ
        </button>
        <span className={styles.logo}>🏆 Bảng xếp hạng</span>
        <div />
      </header>

      <main className={styles.main}>
        {/* My stats card */}
        {myProfile && (
          <div className={styles.myCard}>
            <div className={styles.myAvatar}>
              {myProfile.avatar
                ? <img src={myProfile.avatar} alt="avatar" />
                : <span>{(myProfile.username || '?')[0].toUpperCase()}</span>}
            </div>
            <div className={styles.myInfo}>
              <p className={styles.myName}>{myProfile.username}</p>
              <p className={styles.myMeta}>
                {myProfile.name && <span>{myProfile.name}</span>}
              </p>
            </div>
            <div className={styles.myStats}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{myProfile.elo ?? '—'}</span>
                <span className={styles.statLabel}>ELO</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{myProfile.rank ?? '—'}</span>
                <span className={styles.statLabel}>Hạng</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{myProfile.totalMatches ?? 0}</span>
                <span className={styles.statLabel}>Trận</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {myProfile.totalMatches
                    ? ((myProfile.totalWins / myProfile.totalMatches) * 100).toFixed(1) + '%'
                    : '—'}
                </span>
                <span className={styles.statLabel}>Thắng</span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrapper}>
          {error && <p className={styles.error}>{error}</p>}

          {loading ? (
            <div className={styles.loadingRows}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người chơi</th>
                  <th>ELO</th>
                  <th>Tổng trận</th>
                  <th>Tỉ lệ thắng</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const rank = globalRank(i)
                  const isMe = myProfile && p.username === myProfile.username
                  return (
                    <tr key={p.id || p.username} className={isMe ? styles.myRow : ''}>
                      <td className={styles.rankCell}>
                        {RANK_MEDAL[rank] ?? <span className={styles.rankNum}>{rank}</span>}
                      </td>
                      <td className={styles.playerCell}>
                        <div className={styles.avatar}>
                          {p.avatar
                            ? <img src={p.avatar} alt="" />
                            : <span>{(p.username || '?')[0].toUpperCase()}</span>}
                        </div>
                        <div>
                          <p className={styles.playerName}>{p.username}</p>
                          {p.name && <p className={styles.playerSubname}>{p.name}</p>}
                        </div>
                      </td>
                      <td className={styles.eloCell}>{p.elo ?? '—'}</td>
                      <td>{p.totalMatches ?? 0}</td>
                      <td className={styles.winRateCell}>{winRate(p)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${i === currentPage ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages - 1}
            >
              ›
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
