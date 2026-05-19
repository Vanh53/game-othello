import api, { unwrap } from './axiosInstance'

// ─── ai-model-service ────────────────────────────────────────────────────────

/**
 * Lấy danh sách AI model (đã sort theo difficultyLevel tăng dần)
 * Backend trả về: { code, result: [{ id, name, difficultyLevel }, ...] }
 * @returns AiModelResponse[]
 */
export const getAiModels = async () => {
  const res = await api.get('/ai-models')
  return unwrap(res) // [{ id, name, difficultyLevel }]
}


/**
 * Lấy chi tiết AI model theo id
 * @returns AiModelResponse
 */
export const getAiModelById = async (id) => {
  const res = await api.get(`/ai-models/${id}`)
  return unwrap(res) // { id, name, difficultyLevel }
}

/**
 * Bắt đầu trận với AI theo modelId
 * Backend trả về: { code, result: MatchResponse }
 * @returns MatchResponse
 */
export const startAiGame = async (modelId) => {
  const res = await api.post(`/matches/ai/${modelId}`)
  return unwrap(res)
}

// ─── pvp-service: rooms ──────────────────────────────────────────────────────

/**
 * Tạo phòng chờ mới (user hiện tại là host)
 * Backend trả về: { code, result: { roomId, hostUsername, guestUsername, status, createdAt } }
 * @returns RoomResponse
 */
export const createRoom = async () => {
  const res = await api.post('/rooms')
  return unwrap(res) // { roomId, hostUsername, guestUsername, status, createdAt }
}

/**
 * Lấy danh sách phòng đang chờ (status=WAITING)
 * Backend trả về: { code, result: [RoomResponse, ...] }
 * @returns RoomResponse[]
 */
export const getWaitingRooms = async () => {
  const res = await api.get('/rooms')
  return unwrap(res) // [{ roomId, hostUsername, guestUsername, status, createdAt }]
}

/**
 * Tham gia phòng theo roomId
 * Backend trả về: { code, result: RoomResponse }
 * @returns RoomResponse
 */
export const joinRoom = async (roomId) => {
  const res = await api.put(`/rooms/join/${roomId}`)
  return unwrap(res)
}

/**
 * Rời phòng
 * Backend trả về: { code, result: RoomResponse }
 * @returns RoomResponse
 */
export const leaveRoom = async (roomId) => {
  const res = await api.put(`/rooms/leave/${roomId}`)
  return unwrap(res)
}

/**
 * Tham gia matchmaking PvP ngẫu nhiên
 * Backend có thể trả về null nếu chưa ghép được ngay,
 * hoặc MatchResponse nếu đã tìm thấy đối thủ.
 */
export const joinMatchmaking = async () => {
  const res = await api.post('/matches/matchmaking/join')
  return unwrap(res)
}

/**
 * Rời hàng chờ matchmaking PvP
 */
export const leaveMatchmaking = async () => {
  const res = await api.post('/matches/matchmaking/leave')
  return unwrap(res)
}

// ─── pvp-service: matches ────────────────────────────────────────────────────

/**
 * Bắt đầu trận từ phòng (host gọi sau khi đủ 2 người)
 * Backend trả về: { code, result: { id, matchType, player1Id, player2Id, status, startTime, ... } }
 * @returns MatchResponse
 */
export const startRoom = async (roomId) => {
  const res = await api.post(`/matches/${roomId}`)
  return unwrap(res) // { id, matchType, player1Id, player2Id, status, startTime, ... }
}

/**
 * Lấy thông tin trận đấu theo id
 * @returns MatchResponse
 */
export const getMatch = async (matchId) => {
  const res = await api.get(`/matches/${matchId}`)
  return unwrap(res)
}

/**
 * Lấy trạng thái bàn cờ hiện tại
 * Backend trả về: { code, result: { matchId, board, currentTurn, blackCount, whiteCount, status, winner, validMoves } }
 * @returns GameStateResponse
 */
export const getGameState = async (matchId) => {
  const res = await api.get(`/matches/${matchId}/state`)
  return unwrap(res) // { matchId, board, currentTurn, blackCount, whiteCount, status, winner, validMoves }
}

/**
 * Lấy lịch sử trận của user đang đăng nhập (phân trang)
 * Backend trả về: { code, result: { content: [MatchSummaryResponse], page, size, totalElements, totalPages } }
 * Mỗi summary: { id, matchType, opponentId, result, myScore, opponentScore, startTime, endTime }
 * @returns PagedResponse<MatchSummaryResponse>
 */
export const getMyHistory = async (page = 0, size = 10) => {
  const res = await api.get('/matches/my-history', { params: { page, size } })
  return unwrap(res) // { content, page, size, totalElements, totalPages }
}

/**
 * Lấy lịch sử trận theo userId
 * @returns PagedResponse<MatchSummaryResponse>
 */
export const getHistoryById = async (userId, page = 0, size = 10) => {
  const res = await api.get(`/matches/getHistoryById/${userId}`, { params: { page, size } })
  return unwrap(res)
}
