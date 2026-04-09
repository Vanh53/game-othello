import api from './axiosInstance'

// game-othello context-path: /othello
export const login = (username, password) =>
  api.post('/othello/auth/log-in', { username, password })

export const register = (data) =>
  api.post('/othello/users', data)

export const introspect = (token) =>
  api.post('/othello/auth/introspect', { token })

export const loginWithGoogle = (code) =>
  api.post('/othello/auth/google', { code })

export const loginWithMezon = (code) =>
  api.post('/othello/auth/mezon', { code })
