import api, { unwrap } from './axiosInstance'

// ─── identity-service ────────────────────────────────────────────────────────

/**
 * Lấy thông tin user đang đăng nhập
 * Backend trả về: { code, result: { id, username, name, avatar, email, status } }
 * @returns UserResponse
 */
export const getMyProfile = async () => {
  const res = await api.get('/othello/users/myInfo')
  return unwrap(res) // { id, username, name, avatar, email, status }
}

/**
 * Cập nhật thông tin user
 * Backend nhận: { name }
 * Backend trả về: { code, result: UserResponse }
 * @returns UserResponse
 */
export const updateMyProfile = async (userId, data) => {
  const res = await api.put(`/othello/users/${userId}`, data)
  return unwrap(res)
}

/**
 * Lấy thông tin user theo id
 * @returns UserResponse
 */
export const getUserById = async (userId) => {
  const res = await api.get(`/othello/users/${userId}`)
  return unwrap(res)
}

// ─── leaderboard-service ─────────────────────────────────────────────────────

/**
 * Lấy bảng xếp hạng phân trang
 * Backend trả về: { code, result: { entries: [...], page, size, totalElements, totalPages } }
 * Mỗi entry: { rank, userId, name, avatar, elo, totalMatches, totalWins, totalDraws, winRate }
 * @returns LeaderboardResponse
 */
export const getLeaderboard = async (page = 0, size = 10) => {
  const res = await api.get('/leaderboard', { params: { page, size } })
  return unwrap(res) // { entries, page, size, totalElements, totalPages }
}

/**
 * Lấy rank của user đang đăng nhập
 * Backend trả về: { code, result: LeaderboardEntryResponse }
 * @returns LeaderboardEntryResponse
 */
export const getMyRank = async () => {
  const res = await api.get('/leaderboard/me')
  return unwrap(res) // { rank, userId, name, avatar, elo, totalMatches, totalWins, totalDraws, winRate }
}

/**
 * Lấy rank của user theo id
 * @returns LeaderboardEntryResponse
 */
export const getUserRank = async (userId) => {
  const res = await api.get(`/leaderboard/users/${userId}`)
  return unwrap(res)
}

/**
 * Đổi mật khẩu cho user đang đăng nhập
 * Backend nhận: { currentPassword, newPassword }
 */
export const changeMyPassword = async (currentPassword, newPassword) => {
  const res = await api.post('/othello/users/change-password', { currentPassword, newPassword })
  return unwrap(res)
}
