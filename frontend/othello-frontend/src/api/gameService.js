import api from './axiosInstance'

// ai-model-service
export const getAiModels = () => api.get('/ai-models')
export const getAiModelById = (id) => api.get(`/ai-models/${id}`)

// pvp-service - matchmaking (qua WebSocket, REST chỉ dùng để join/leave queue)
export const joinMatchmaking = () => api.post('/matches/matchmaking/join')
export const leaveMatchmaking = () => api.post('/matches/matchmaking/leave')

// pvp-service - AI game
export const startAiGame = (aiModelId) => api.post('/matches/ai', { aiModelId })

// pvp-service - rooms
export const createRoom = () => api.post('/rooms')
export const getWaitingRooms = () => api.get('/rooms')
export const getRoom = (roomId) => api.get(`/rooms/${roomId}`)
export const joinRoom = (roomId) => api.put(`/rooms/join/${roomId}`)
export const leaveRoom = (roomId) => api.put(`/rooms/leave/${roomId}`)
export const startRoom = (roomId) => api.post(`/matches/${roomId}`)

// pvp-service - matches
export const getMatch = (matchId) => api.get(`/matches/${matchId}`)
export const getGameState = (matchId) => api.get(`/matches/${matchId}/state`)
export const getMyHistory = (page = 0, size = 10) =>
  api.get('/matches/my-history', { params: { page, size } })
