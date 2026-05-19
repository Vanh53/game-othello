import api, { unwrap } from './axiosInstance'

/**
 * Đăng nhập bằng username/password
 * Backend trả về: { code, result: { token, authenticated } }
 * @returns { token: string, authenticated: boolean }
 */
export const login = async (username, password) => {
  const res = await api.post('/othello/auth/log-in', { username, password })
  return unwrap(res) // { token, authenticated }
}

/**
 * Đăng ký tài khoản mới
 * Backend trả về: { code, result: { id, username, name, avatar, email, status } }
 * @returns UserResponse
 */
export const register = async (data) => {
  const res = await api.post('/othello/users', data)
  return unwrap(res) // UserResponse
}

/**
 * Kiểm tra token còn hợp lệ không
 * Backend trả về: { code, result: { valid: boolean } }
 * @returns { valid: boolean }
 */
export const introspect = async (token) => {
  const res = await api.post('/othello/auth/introspect', { token })
  return unwrap(res) // { valid }
}

export const loginWithGoogle = async (code, state) => {
  const res = await api.post('/othello/auth/google', { code, state })
  return unwrap(res)
}

export const loginWithMezon = async (code, state) => {
  const res = await api.post('/othello/auth/mezon', { code, state })
  return unwrap(res)
}
  
  
