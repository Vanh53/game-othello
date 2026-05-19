import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile, getMyRank, changeMyPassword } from '../api/userService'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    Promise.all([getMyProfile(), getMyRank()])
      .then(([profileData, rankData]) => {
        // profileData = { id, username, name, avatar, email, status }
        // rankData = { rank, userId, elo, totalMatches, totalWins, totalDraws, winRate }
        setProfile({ ...profileData, ...rankData })
      })
      .catch(() => {
        // nếu chưa có rank (user chưa chơi trận nào) thì chỉ lấy profile
        getMyProfile().then(setProfile).catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  const openEdit = () => {
    setForm({ name: profile.name || '' })
    setSaveError('')
    setSaveSuccess(false)
    setEditing(true)
  }

  const [changingPwd, setChangingPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)

  const openChangePassword = () => {
    setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPwdError('')
    setPwdSuccess(false)
    setChangingPwd(true)
  }

  const handleChangePwdField = (e) => {
    setPwdForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setPwdError('')
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdError('Vui lòng nhập đầy đủ thông tin.')
      return
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải ít nhất 6 ký tự.')
      return
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Mật khẩu xác nhận không khớp.')
      return
    }

    setPwdSaving(true)
    try {
      await changeMyPassword(pwdForm.currentPassword, pwdForm.newPassword)
      setPwdSuccess(true)
      setChangingPwd(false)
    } catch (err) {
      setPwdError(err.message || 'Đổi mật khẩu thất bại.')
    } finally {
      setPwdSaving(false)
    }
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaveError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // UserUpdateRequest chỉ có { name }
      const updatedProfile = await updateMyProfile(profile.id, { name: form.name })
      setProfile((prev) => ({ ...prev, ...updatedProfile }))
      setSaveSuccess(true)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalLosses = (p) =>
    (p.totalMatches ?? 0) - (p.totalWins ?? 0) - (p.totalDraws ?? 0)

  const winRate = (p) =>
    p.totalMatches ? ((p.totalWins / p.totalMatches) * 100).toFixed(1) + '%' : '—'

  if (loading) return <div className={styles.centered}>Đang tải...</div>
  if (!profile) return <div className={styles.centered}>Không tải được thông tin.</div>

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
              <div className={styles.headerActions}>
                <button className={styles.editBtn} onClick={openEdit}>✏️ Chỉnh sửa</button>
                <button className={styles.changePwdBtn} onClick={openChangePassword}>🔒 Đổi mật khẩu</button>
              </div>
            )}
          </div>

          {saveSuccess && !editing && (
            <p className={styles.successMsg}>Cập nhật thành công!</p>
          )}

          {changingPwd ? (
            <form onSubmit={handleSavePassword} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={handleChangePwdField}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={pwdSaving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={handleChangePwdField}
                  placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                  disabled={pwdSaving}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={handleChangePwdField}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={pwdSaving}
                />
              </div>
              {pwdError && <p className={styles.errorMsg}>{pwdError}</p>}
              {pwdSuccess && <p className={styles.successMsg}>Đổi mật khẩu thành công!</p>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnSave} disabled={pwdSaving}>
                  {pwdSaving ? 'Đang đổi...' : 'Lưu mật khẩu'}
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setChangingPwd(false)}
                  disabled={pwdSaving}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : editing ? (
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
