import api from './axiosInstance'

// game-othello - users (ADMIN only)
export const getAllUsers = () => api.get('/othello/users')
export const deleteUser = (id) => api.delete(`/othello/users/${id}`)

// ai-model-service (ADMIN only)
export const getAllAiModels = () => api.get('/ai-models')
export const createAiModel = (data) => api.post('/ai-models', data)
export const updateAiModel = (id, data) => api.put(`/ai-models/${id}`, data)
export const deleteAiModel = (id) => api.delete(`/ai-models/${id}`)
