import { jwtDecode } from "jwt-decode";
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
    return jwtDecode(token);
  } catch (error) {
    console.error("Lỗi giải mã token:", error);
    return null;
  }
}

export const getRole = () => {
  const token = getToken()
  if (!token) return null

  const decoded = decodeToken(token)
  return decoded?.role || decoded?.roles?.[0] || decoded?.scope || null
}

export const isAdmin = () => {
  const token = getToken()
  if (!token) return false
  
  const decoded = decodeToken(token)

  const role = decoded?.role || decoded?.roles?.[0] || decoded?.scope || ''
  if (Array.isArray(role)) {
    return role.includes('ADMIN')
  }

  return String(role).includes('ADMIN')
}
