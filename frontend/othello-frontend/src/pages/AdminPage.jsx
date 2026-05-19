import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin, removeToken } from '../utils/auth'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin()) navigate('/', { replace: true })
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

        <section className={styles.sectionCard}>
          <h3 className={styles.cardTitle}>Quản lý người chơi</h3>
          <p className={styles.cardDesc}>Thêm, sửa, xóa thông tin người chơi, Quản lý trạng thái và phân quyền người chơi</p>
          <button className={styles.btnUsers} type="button">
            👥 Quản lý người chơi
          </button>
        </section>

        <section className={styles.sectionCard}>
          <h3 className={styles.cardTitle}>Quản lý mô hình máy</h3>
          <p className={styles.cardDesc}>Thêm, sửa, xóa mô hình máy chơi</p>
          <button className={styles.btnModels} type="button" onClick={() => navigate('/admin/models')}>
            🤖 Quản lý mô hình máy
          </button>
        </section>
      </main>
    </div>
  )
}
