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
    name: '',
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
    
    // Username validation
    if (!form.username.trim()) {
      newErrors.username = 'Vui lòng nhập username.'
    } else if (form.username.length < 4) {
      newErrors.username = 'Username tối thiểu 4 ký tự.'
    } else if (form.username.length > 50) {
      newErrors.username = 'Username tối đa 50 ký tự.'
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Username chỉ được chứa chữ, số và dấu gạch dưới (_).'
    }
    
    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Vui lòng nhập email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ.'
    }
    
    // Password validation with detailed checks
    if (!form.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.'
    } else {
      const passwordErrors = []
      
      if (form.password.length < 8) {
        passwordErrors.push('tối thiểu 8 ký tự')
      }
      if (!/[a-z]/.test(form.password)) {
        passwordErrors.push('1 chữ thường')
      }
      if (!/[A-Z]/.test(form.password)) {
        passwordErrors.push('1 chữ IN HOA')
      }
      if (!/\d/.test(form.password)) {
        passwordErrors.push('1 chữ số')
      }
      if (!/[@$!%*?&]/.test(form.password)) {
        passwordErrors.push('1 ký tự đặc biệt (@$!%*?&)')
      }
      // Check only allowed characters
      if (!/^[A-Za-z\d@$!%*?&]+$/.test(form.password)) {
        passwordErrors.push('chỉ được dùng chữ, số và ký tự đặc biệt (@$!%*?&)')
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Mật khẩu phải có: ${passwordErrors.join(', ')}`
      }
    }
    
    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp (kiểm tra lại 2 field).'
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
        confirmPassword: form.confirmPassword,
        name: form.name || null,
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
              placeholder="4-50 ký tự, chỉ chữ, số, dấu gạch dưới"
              disabled={loading}
              aria-invalid={!!errors.username}
            />
            {errors.username && <span className={styles.fieldError}>{errors.username}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="name">Họ và tên (tùy chọn)</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
              disabled={loading}
            />
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
              placeholder="8+ ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt (@$!%*?&)"
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
