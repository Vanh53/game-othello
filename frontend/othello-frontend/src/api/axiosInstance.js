import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Tự động đính kèm JWT token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Chuẩn hóa lỗi theo ApiResponse
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.'
    return Promise.reject(new Error(message))
  }
)

export default api
