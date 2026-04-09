import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile } from '../api/userService'
import { MOCK_MY_PROFILE } from '../mock/mockData'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // edit state
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    getMyProfile()
      .then((res) => setProfile(res.data?.data || res.data))
      .catch(() => setProfile(MOCK_MY_PROFILE)) // TODO: remove mock
      .finally(() => setLoading(false))
  }, [])

  const openEdit = () => {
    setForm({ name: profile.name || '', email: profile.email || '' })
    setSaveError('')
    setSaveSuccess(false)
    setEditing(true)
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaveError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.email.trim()) { setSaveError('Email không được để trống.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setSaveError('Email không hợp lệ.'); return }
    setSaving(true)
    try {
      const res = await updateMyProfile(form)
      setProfile((prev) => ({ ...prev, ...(res.data?.data || res.data || form) }))
      setSaveSuccess(true)
      setEditing(false)
    } catch (err) {
      // TODO: remove mock save
      setProfile((prev) => ({ ...prev, ...form }))
      setSaveSuccess(true)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const totalLosses = (p) =>
    (p.totalMatches ?? 0) - (p.totalWins ?? 0) - (p.totalDraws ?? 0)

  const winRate = (p) =>
    p.totalMatches ? ((p.totalWins / p.totalMatches) * 100).toFixed(1) + '%' : '—'

  if (loading) return <div className={styles.centered}>Đang tải...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Trang chủ</button>
        <span className={styles.logo}>Hồ sơ cá nhân</span>
        <div />
      </header>

      <main className={styles.main}>
        {/* Avatar + basic info */}
        <div className={styles.heroCard}>
          <div className={styles.avatarWrap}>
            {profile.avatar
              ? <img src={profile.avatar} alt="avatar" className={styles.avatarImg} />
              : <span className={styles.avatarFallback}>{(profile.username || '?')[0].toUpperCase()}</span>}
          </div>
          <div className={styles.heroInfo}>
            <h2 className={styles.username}>{profile.username}</h2>
            {profile.name && <p className={styles.displayName}>{profile.name}</p>}
            <p className={styles.email}>{profile.email}</p>
          </div>
          <div className={styles.eloBlock}>
            <span className={styles.eloValue}>{profile.elo ?? '—'}</span>
            <span className={styles.eloLabel}>ELO</span>
            {profile.rank && (
              <span className={styles.rankBadge}>Hạng #{profile.rank}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{profile.totalMatches ?? 0}</span>
            <span className={styles.statName}>Tổng trận</span>
          </div>
          <div className={`${styles.statCard} ${styles.statWin}`}>
            <span className={styles.statNum}>{profile.totalWins ?? 0}</span>
            <span className={styles.statName}>Thắng</span>
          </div>
          <div className={`${styles.statCard} ${styles.statDraw}`}>
            <span className={styles.statNum}>{profile.totalDraws ?? 0}</span>
            <span className={styles.statName}>Hòa</span>
          </div>
          <div className={`${styles.statCard} ${styles.statLose}`}>
            <span className={styles.statNum}>{totalLosses(profile)}</span>
            <span className={styles.statName}>Thua</span>
          </div>
          <div className={`${styles.statCard} ${styles.statRate}`}>
            <span className={styles.statNum}>{winRate(profile)}</span>
            <span className={styles.statName}>Tỉ lệ thắng</span>
          </div>
        </div>

        {/* Edit section */}
        <div className={styles.editCard}>
          <div className={styles.editHeader}>
            <h3>Thông tin cá nhân</h3>
            {!editing && (
              <button className={styles.editBtn} onClick={openEdit}>✏️ Chỉnh sửa</button>
            )}
          </div>

          {saveSuccess && !editing && (
            <p className={styles.successMsg}>Cập nhật thành công!</p>
          )}

          {editing ? (
            <form onSubmit={handleSave} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="name">Tên hiển thị</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên hiển thị"
                  disabled={saving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  disabled={saving}
                />
              </div>
              {saveError && <p className={styles.errorMsg}>{saveError}</p>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Username</span>
                <span className={styles.infoVal}>{profile.username}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Tên hiển thị</span>
                <span className={styles.infoVal}>{profile.name || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Email</span>
                <span className={styles.infoVal}>{profile.email}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
