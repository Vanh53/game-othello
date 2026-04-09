import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/authService'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.username.trim()) newErrors.username = 'Vui lòng nhập username.'
    if (!form.email.trim()) {
      newErrors.email = 'Vui lòng nhập email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ.'
    }
    if (!form.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.'
    } else if (form.password.length < 6) {
      newErrors.password = 'Mật khẩu tối thiểu 6 ký tự.'
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Othello</h1>
        <p className={styles.subtitle}>Tạo tài khoản mới</p>

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
              aria-invalid={!!errors.username}
            />
            {errors.username && <span className={styles.fieldError}>{errors.username}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Nhập email"
              disabled={loading}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tối thiểu 6 ký tự"
              disabled={loading}
              aria-invalid={!!errors.password}
            />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              disabled={loading}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <span className={styles.fieldError}>{errors.confirmPassword}</span>
            )}
          </div>

          {serverError && <p className={styles.error}>{serverError}</p>}

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className={styles.loginLink}>
          Đã có tài khoản?{' '}
          <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
