/**
 * Lưu token vào storage
 * @param {string} token
 * @param {boolean} remember - true: localStorage, false: sessionStorage
 */
export const saveToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem('token', token)
  } else {
    sessionStorage.setItem('token', token)
  }
}

export const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token')

export const removeToken = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

/**
 * Giải mã JWT payload (không verify signature)
 */
export const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1]
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export const getRole = () => {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.role || decoded?.roles?.[0] || null
}

export const isAdmin = () => getRole() === 'ADMIN'
