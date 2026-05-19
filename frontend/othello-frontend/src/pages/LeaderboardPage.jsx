import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeaderboard, getMyProfile, getMyRank } from '../api/userService'
import styles from './LeaderboardPage.module.css'

const PAGE_SIZE = 10

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [myProfile, setMyProfile] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    // Lấy profile + rank của bản thân
    Promise.all([getMyProfile(), getMyRank()])
      .then(([profile, rankData]) => {
        // profile = { id, username, name, avatar, email, status }
        // rankData = { rank, userId, name, avatar, elo, totalMatches, totalWins, totalDraws, winRate }
        setMyProfile({ ...profile, ...rankData })
      })
      .catch(() => {}) // không bắt buộc phải có rank
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    getLeaderboard(currentPage, PAGE_SIZE)
      .then((data) => {
        // data = { entries: [...], page, size, totalElements, totalPages }
        // Mỗi entry: { rank, userId, name, avatar, elo, totalMatches, totalWins, totalDraws, winRate }
        setPlayers(data?.entries || [])
        setTotalPages(data?.totalPages || 1)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [currentPage])

  const globalRank = (index) => currentPage * PAGE_SIZE + index + 1

  const winRate = (p) => {
    if (!p.totalMatches || p.totalMatches === 0) return '—'
    return ((p.totalWins / p.totalMatches) * 100).toFixed(1) + '%'
  }

  const fetchAllLeaderboardEntries = async () => {
    const firstPage = await getLeaderboard(0, PAGE_SIZE)
    const firstEntries = firstPage?.entries || []
    const pageCount = firstPage?.totalPages || 1

    if (pageCount <= 1) return firstEntries

    const restPages = await Promise.all(
      Array.from({ length: pageCount - 1 }).map((_, index) =>
        getLeaderboard(index + 1, PAGE_SIZE)
      )
    )

    const restEntries = restPages.flatMap((page) => page?.entries || [])
    const merged = [...firstEntries, ...restEntries]

    // Loại trùng để đảm bảo mỗi user chỉ hiển thị một dòng.
    const byUser = new Map()
    merged.forEach((entry) => {
      if (!entry?.userId) return
      if (!byUser.has(entry.userId)) byUser.set(entry.userId, entry)
    })

    return Array.from(byUser.values())
  }

  const handleSearch = async () => {
    const keyword = searchInput.trim().toLowerCase()
    if (!keyword) {
      setIsSearchMode(false)
      setSearchResults([])
      return
    }

    setSearching(true)
    setError('')

    try {
      const allPlayers = await fetchAllLeaderboardEntries()
      const results = allPlayers.filter((p) => {
        const candidates = [p?.name, p?.username, p?.userId]
        return candidates.some((value) =>
          String(value || '').toLowerCase().includes(keyword)
        )
      })

      setSearchResults(results)
      setIsSearchMode(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchResults([])
    setIsSearchMode(false)
  }

  const displayedPlayers = isSearchMode ? searchResults : players
  const isTableLoading = loading || searching

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Trang chủ
        </button>
        <span className={styles.logo}>Bảng xếp hạng</span>
        <div />
      </header>

      <main className={styles.main}>
        <div className={styles.searchRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Nhập tên người chơi"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
            {searching ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
          {isSearchMode && (
            <button className={styles.clearBtn} onClick={handleClearSearch}>
              Xóa lọc
            </button>
          )}
        </div>

        {isSearchMode && (
          <p className={styles.searchHint}>
            Kết quả tìm kiếm cho: <strong>{searchInput}</strong>
          </p>
        )}

        {/* My stats card */}
        {myProfile && !isSearchMode && (
          <div className={styles.myCard}>
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

          {isTableLoading ? (
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
                {displayedPlayers.map((p, i) => {
                  const rank = p.rank ?? globalRank(i)
                  const isMe = myProfile && p.userId === myProfile.userId
                  return (
                    <tr
                      key={p.userId}
                      className={`${isMe ? styles.myRow : ''} ${styles.clickableRow}`}
                      onClick={() => p.userId && navigate(`/leaderboard/${p.userId}/history`)}
                    >
                      <td className={styles.rankCell}>
                        <span className={styles.rankNum}>{rank}</span>
                      </td>
                      <td className={styles.playerCell}>
                        <div>
                          <p className={styles.playerName}>{p.name || p.userId}</p>
                        </div>
                      </td>
                      <td className={styles.eloCell}>{p.elo ?? '—'}</td>
                      <td>{p.totalMatches ?? 0}</td>
                      <td className={styles.winRateCell}>
                        {p.winRate != null ? `${p.winRate}%` : winRate(p)}
                      </td>
                    </tr>
                  )
                })}
                {displayedPlayers.length === 0 && (
                  <tr>
                    <td className={styles.emptyCell} colSpan={5}>
                      Không tìm thấy người chơi phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isSearchMode && totalPages > 1 && (
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
