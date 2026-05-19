import api, { unwrap } from './axiosInstance'

// ─── identity-service: users (ADMIN only) ────────────────────────────────────

/**
 * Lấy danh sách tất cả user
 * Backend trả về: { code, result: [{ id, username, name, avatar, email, status }, ...] }
 * @returns UserResponse[]
 */
export const getAllUsers = async () => {
  const res = await api.get('/othello/users')
  return unwrap(res) // [{ id, username, name, avatar, email, status }]
}

/**
 * Xóa user theo id
 * Backend trả về: { code, result: "Xóa User thành công" }
 */
export const deleteUser = async (id) => {
  const res = await api.delete(`/othello/users/${id}`)
  return unwrap(res)
}

// ─── ai-model-service (ADMIN only) ───────────────────────────────────────────

/**
 * Lấy danh sách AI model
 * Backend trả về: { code, result: [{ id, name, difficultyLevel }, ...] }
 * @returns AiModelResponse[]
 */
export const getAllAiModels = async () => {
  const res = await api.get('/ai-models')
  return unwrap(res) // [{ id, name, difficultyLevel }]
}

export const getAllAiModelsAdmin = async () => {
  const res = await api.get('/ai-models/getAllByAdmin')
  return unwrap(res) // [{ id, name, difficultyLevel, des, file path, des, created_by  }]
}

/**
 * Tạo AI model mới
 * Backend nhận: { name, difficultyLevel (1-10), filePath }
 * Backend trả về: { code, result: { id, name, difficultyLevel } }
 * @returns AiModelResponse
 */
export const createAiModel = async (data) => {
  const res = await api.post('/ai-models', data)
  return unwrap(res) // { id, name, difficultyLevel }
}

/**
 * Cập nhật AI model
 * Backend nhận: { name?, difficultyLevel?, filePath? }
 * Backend trả về: { code, result: AiModelResponse }
 * @returns AiModelResponse
 */
export const updateAiModel = async (id, data) => {
  const res = await api.put(`/ai-models/${id}`, data)
  return unwrap(res)
}

/**
 * Xóa AI model
 * Backend trả về: { code, message: "Xóa mô hình AI thành công" }
 */
export const deleteAiModel = async (id) => {
  const res = await api.delete(`/ai-models/${id}`)
  return unwrap(res)
}
