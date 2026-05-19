import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { login } from '../api/authService'
import { saveToken, getRole } from '../utils/auth'
import styles from './LoginPage.module.css'

const generateMezonState = () => {
  const prefix = 'mezon'; // 5 ký tự
  // Sinh ra 6 ký tự ngẫu nhiên từ chữ và số
  const randomStr = Math.random().toString(36).substring(2, 8); 
  return prefix + randomStr; 
};

const GOOGLE_AUTH_URL =
  `${import.meta.env.VITE_GOOGLE_AUTH_URL}` + '?' +
  `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth2/callback')}` +
  `&response_type=code&scope=openid%20email%20profile&state=google`

const MEZON_AUTH_URL =
  `${import.meta.env.VITE_MEZON_AUTH_URL}?` +
  `client_id=${import.meta.env.VITE_MEZON_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth2/callback')}` +
  `&response_type=code` +
  `&scope=openid%20offline` + 
  `&state=${generateMezonState()}`

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.registered === true
  const redirectTo = location.state?.redirectTo
  const [form, setForm] = useState({ username: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin.')
      return
    }
    setLoading(true)
    try {
      // TODO: remove mock login
      const authResponse = await login(form.username, form.password)
      // authResponse = { token, authenticated } (đã unwrap từ axiosInstance)
      saveToken(authResponse.token, remember)
      const role = getRole()
      if (String(role).includes('ADMIN')) {
        navigate('/admin', { replace: true })
        return
      }
      navigate(redirectTo || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Othello</h1>
        <p className={styles.subtitle}>Đăng nhập để tiếp tục</p>

        {justRegistered && (
          <p className={styles.success}>Đăng ký thành công! Hãy đăng nhập.</p>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Nhập username"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              disabled={loading}
            />
          </div>

          <div className={styles.rememberRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <button type="button" className={styles.btnMachine}>
            🤖 Đấu với máy
          </button>
        </form>

        <div className={styles.divider}>
          <span>hoặc</span>
        </div>

        <div className={styles.oauthButtons}>
          <a href={GOOGLE_AUTH_URL} className={styles.btnGoogle}>
            <GoogleIcon />
            Đăng nhập bằng Google
          </a>
          <a href={MEZON_AUTH_URL} className={styles.btnMezon}>
            <MezonIcon />
            Đăng nhập bằng Mezon
          </a>
        </div>

        <p className={styles.registerLink}>
          Chưa có tài khoản?{' '}
          <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function MezonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#5865F2" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">M</text>
    </svg>
  )
}

