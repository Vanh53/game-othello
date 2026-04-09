import api from './axiosInstance'

// game-othello
export const getMyProfile = () => api.get('/othello/users/myInfo')
export const updateMyProfile = (userId, data) => api.put(`/othello/users/${userId}`, data)
export const getUserById = (userId) => api.get(`/othello/users/${userId}`)

// leaderboard-service
export const getLeaderboard = (page = 0, size = 10) =>
  api.get('/leaderboard', { params: { page, size } })

export const getMyRank = () => api.get('/leaderboard/me')
export const getUserRank = (userId) => api.get(`/leaderboard/users/${userId}`)
