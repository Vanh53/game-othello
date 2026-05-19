import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUserById, getUserRank } from '../api/userService'
import { getHistoryById } from '../api/gameService'
import styles from './PlayerHistoryPage.module.css'

const PAGE_SIZE = 10

const RESULT_LABEL = {
  WIN: 'WIN',
  LOSE: 'LOSE',
  DRAW: 'DRAW',
}

export default function PlayerHistoryPage() {
  const navigate = useNavigate()
  const { userId } = useParams()

  const [player, setPlayer] = useState(null)
  const [rankInfo, setRankInfo] = useState(null)
  const [history, setHistory] = useState([])

  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    setLoadingProfile(true)
    setError('')

    Promise.all([getUserById(userId), getUserRank(userId)])
      .then(([profileData, rankData]) => {
        setPlayer(profileData)
        setRankInfo(rankData)
      })
      .catch(async () => {
        try {
          const profileData = await getUserById(userId)
          setPlayer(profileData)
          setRankInfo(null)
        } catch (err) {
          setError(err.message)
        }
      })
      .finally(() => setLoadingProfile(false))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoadingHistory(true)
    setError('')

    getHistoryById(userId, currentPage, PAGE_SIZE)
      .then((data) => {
        setHistory(data?.content || [])
        setTotalPages(data?.totalPages || 1)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingHistory(false))
  }, [userId, currentPage])

  const formatStartTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const mon = String(date.getMonth() + 1).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)

    return `${hh}:${mm} - ${dd}/${mon}/${yy}`
  }

  const formatDuration = (startValue, endValue) => {
    if (!startValue || !endValue) return '—'
    const start = new Date(startValue)
    const end = new Date(endValue)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'

    const diffSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
    const minutes = Math.floor(diffSeconds / 60)
    const seconds = diffSeconds % 60

    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  }

  const getWinRate = () => {
    if (rankInfo?.winRate != null) return `${rankInfo.winRate}%`
    if (!rankInfo?.totalMatches) return '—'
    return `${((rankInfo.totalWins / rankInfo.totalMatches) * 100).toFixed(1)}%`
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/leaderboard')}>
          ← Quay lại
        </button>
        <span className={styles.logo}>Lịch sử đấu</span>
        <div />
      </header>

      <main className={styles.main}>
        {error && <p className={styles.error}>{error}</p>}

        {loadingProfile ? (
          <div className={styles.cardLoading}>Đang tải thông tin người chơi...</div>
        ) : player ? (
          <div className={styles.playerCard}>
            <div className={styles.playerInfo}>
              <p className={styles.username}>User:</p>
              <p className={styles.name}>{player.name || '—'}</p>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{rankInfo?.elo ?? '—'}</span>
                <span className={styles.statLabel}>ELO</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{rankInfo?.rank ?? '—'}</span>
                <span className={styles.statLabel}>Hạng</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{rankInfo?.totalMatches ?? 0}</span>
                <span className={styles.statLabel}>Trận</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{getWinRate()}</span>
                <span className={styles.statLabel}>Thắng</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.tableWrapper}>
          {loadingHistory ? (
            <div className={styles.tableLoading}>Đang tải lịch sử đấu...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Người chơi</th>
                  <th>Đối thủ</th>
                  <th>Kết quả</th>
                  <th>Start Time</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id}>
                    <td>{player?.name || player?.id || '—'}</td>
                    <td>{m.opponentName || '—'}</td>
                    <td className={styles[`result${m.result}`] || ''}>{RESULT_LABEL[m.result] || m.result || '—'}</td>
                    <td>{formatStartTime(m.startTime)}</td>
                    <td>{formatDuration(m.startTime, m.endTime)}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      Người chơi này chưa có lịch sử đấu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loadingHistory && totalPages > 1 && (
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
