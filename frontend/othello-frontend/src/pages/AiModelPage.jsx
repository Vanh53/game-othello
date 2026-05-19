import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllAiModels, createAiModel, updateAiModel, deleteAiModel, getAllAiModelsAdmin } from '../api/adminService'
import { isAdmin, removeToken } from '../utils/auth'
import styles from './AiModelPage.module.css'

const EMPTY_MODEL = { name: '', difficultyLevel: 1, filePath: '' }

export default function AiModelPage() {
  const navigate = useNavigate()
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelForm, setModelForm] = useState(null)
  const [modelSaving, setModelSaving] = useState(false)
  const [modelDeleteId, setModelDeleteId] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/', { replace: true })
      return
    }

    setModelsLoading(true)
    getAllAiModelsAdmin()
      .then((data) => setModels(data || []))
      .catch((err) => console.error('Load models failed:', err))
      .finally(() => setModelsLoading(false))
  }, [navigate])

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  const handleModelSave = async (e) => {
    e.preventDefault()
    if (!modelForm.name.trim()) { setFormError('Tên không được để trống.'); return }
    if (!modelForm.filePath.trim()) { setFormError('FilePath không được để trống.'); return }
    if (modelForm.difficultyLevel < 1 || modelForm.difficultyLevel > 10) {
      setFormError('Độ khó phải từ 1 đến 10.')
      return
    }

    setModelSaving(true)
    setFormError('')

    try {
      if (modelForm.id) {
        const updated = await updateAiModel(modelForm.id, {
          name: modelForm.name,
          difficultyLevel: Number(modelForm.difficultyLevel),
          filePath: modelForm.filePath,
        })
        setModels((prev) => prev.map((item) => (item.id === modelForm.id ? updated : item)))
      } else {
        const created = await createAiModel({
          name: modelForm.name,
          difficultyLevel: Number(modelForm.difficultyLevel),
          filePath: modelForm.filePath,
        })
        setModels((prev) => [...prev, created])
      }
      setModelForm(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setModelSaving(false)
    }
  }

  const handleDeleteModel = async (id) => {
    try {
      await deleteAiModel(id)
      setModels((prev) => prev.filter((model) => model.id !== id))
    } catch (err) {
      console.error('Delete model failed:', err)
    }
    setModelDeleteId(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Othello Admin</span>
        <nav className={styles.headerActions}>
          <button className={styles.headerBtn} type="button">
            Hồ sơ
          </button>
          <button className={styles.headerBtn} onClick={handleLogout}>
            Đăng xuất
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <h2 className={styles.welcome}>
          Xin chào, <span>Admin</span>
        </h2>

        <div className={styles.section}>
          <div className={styles.viewHeader}>
            <button className={styles.btnBack} type="button" onClick={() => navigate('/admin')}>
              ← Quay lại
            </button>
          </div>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quản lý mô hình máy chơi</h2>
            <button
              className={styles.btnAdd}
              onClick={() => {
                setModelForm({ ...EMPTY_MODEL })
                setFormError('')
              }}
            >
              + Thêm model
            </button>
          </div>

          {modelsLoading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên</th>
                    <th>Độ khó</th>
                    <th>File Path</th>
                    <th>Mô tả</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, index) => (
                    <tr key={model.id}>
                      <td className={styles.tdMuted}>{index + 1}</td>
                      <td className={styles.tdBold}>{model.name}</td>
                      <td>
                        <span className={styles.diffBadge}>{model.difficultyLevel}</span>
                      </td>
                      <td className={styles.tdPath}>{model.filePath}</td>
                      <td className={styles.tdPath}>{model.description}</td>
                      <td>
                        <div className={styles.actionRow}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => {
                              setModelForm({ ...model })
                              setFormError('')
                            }}
                          >
                            ✏️
                          </button>
                          {modelDeleteId === model.id ? (
                            <>
                              <button className={styles.btnConfirm} onClick={() => handleDeleteModel(model.id)}>
                                ✓
                              </button>
                              <button className={styles.btnCancelSm} onClick={() => setModelDeleteId(null)}>
                                ✕
                              </button>
                            </>
                          ) : (
                            <button className={styles.btnDelete} onClick={() => setModelDeleteId(model.id)}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modelForm && (
        <div className={styles.modalOverlay} onClick={() => setModelForm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{modelForm.id ? 'Chỉnh sửa model' : 'Thêm model mới'}</h3>
            <form onSubmit={handleModelSave} className={styles.form}>
              <div className={styles.field}>
                <label>Tên model</label>
                <input
                  type="text"
                  value={modelForm.name}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Master Bot"
                  disabled={modelSaving}
                />
              </div>
              <div className={styles.field}>
                <label>Độ khó (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={modelForm.difficultyLevel}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, difficultyLevel: e.target.value }))}
                  disabled={modelSaving}
                />
              </div>
              <div className={styles.field}>
                <label>File Path</label>
                <input
                  type="text"
                  value={modelForm.filePath}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, filePath: e.target.value }))}
                  placeholder="VD: models/master.onnx"
                  disabled={modelSaving}
                />
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnSave} disabled={modelSaving}>
                  {modelSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" className={styles.btnCancelMd} onClick={() => setModelForm(null)} disabled={modelSaving}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
