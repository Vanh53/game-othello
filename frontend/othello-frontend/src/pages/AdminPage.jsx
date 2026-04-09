import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers, deleteUser, getAllAiModels, createAiModel, updateAiModel, deleteAiModel } from '../api/adminService'
import { isAdmin } from '../utils/auth'
import { MOCK_USERS, MOCK_AI_MODELS } from '../mock/mockData'
import styles from './AdminPage.module.css'

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT']
const DIFF_LABEL   = { EASY: 'De', MEDIUM: 'Trung binh', HARD: 'Kho', EXPERT: 'Chuyen gia' }
const DIFF_COLOR   = { EASY: styles.diffEASY, MEDIUM: styles.diffMEDIUM, HARD: styles.diffHARD, EXPERT: styles.diffEXPERT }

const EMPTY_MODEL = { name: '', difficulty: 'EASY', filePath: '' }

export default function AdminPage() {
  const navigate = useNavigate()

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) navigate('/', { replace: true })
  }, [navigate])

  const [tab, setTab] = useState('users') // 'users' | 'models'

  // ── Users state ──
  const [users, setUsers]           = useState([])
  const [usersLoading, setUL]       = useState(true)
  const [deleteConfirm, setDC]      = useState(null) // user id to confirm delete

  // ── AI Models state ──
  const [models, setModels]         = useState([])
  const [modelsLoading, setML]      = useState(true)
  const [modelForm, setModelForm]   = useState(null)  // null | { ...model } | EMPTY_MODEL
  const [modelSaving, setMS]        = useState(false)
  const [modelDeleteId, setMDI]     = useState(null)
  const [formError, setFormError]   = useState('')

  // ── Load users ──
  useEffect(() => {
    getAllUsers()
      .then((r) => setUsers(r.data?.data || r.data || []))
      .catch(() => setUsers(MOCK_USERS)) // TODO: remove mock
      .finally(() => setUL(false))
  }, [])

  // ── Load models ──
  useEffect(() => {
    getAllAiModels()
      .then((r) => setModels(r.data?.data || r.data || []))
      .catch(() => setModels(MOCK_AI_MODELS)) // TODO: remove mock
      .finally(() => setML(false))
  }, [])

  // ── Delete user ──
  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      setUsers((prev) => prev.filter((u) => u.id !== id)) // TODO: remove mock
    }
    setDC(null)
  }

  // ── Save model (create / update) ──
  const handleModelSave = async (e) => {
    e.preventDefault()
    if (!modelForm.name.trim()) { setFormError('Ten khong duoc de trong.'); return }
    if (!modelForm.filePath.trim()) { setFormError('FilePath khong duoc de trong.'); return }
    setMS(true); setFormError('')
    try {
      if (modelForm.id) {
        const r = await updateAiModel(modelForm.id, modelForm)
        setModels((prev) => prev.map((m) => m.id === modelForm.id ? (r.data?.data || r.data || modelForm) : m))
      } else {
        const r = await createAiModel(modelForm)
        const created = r.data?.data || r.data || { ...modelForm, id: Date.now() }
        setModels((prev) => [...prev, created])
      }
      setModelForm(null)
    } catch {
      // TODO: remove mock save
      if (modelForm.id) {
        setModels((prev) => prev.map((m) => m.id === modelForm.id ? modelForm : m))
      } else {
        setModels((prev) => [...prev, { ...modelForm, id: Date.now() }])
      }
      setModelForm(null)
    } finally {
      setMS(false)
    }
  }

  // ── Delete model ──
  const handleDeleteModel = async (id) => {
    try { await deleteAiModel(id) } catch { /* mock */ }
    setModels((prev) => prev.filter((m) => m.id !== id))
    setMDI(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Trang chu</button>
        <span className={styles.logo}>⚙️ Admin Panel</span>
        <div />
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'users'  ? styles.tabActive : ''}`} onClick={() => setTab('users')}>
          👥 Nguoi dung
        </button>
        <button className={`${styles.tab} ${tab === 'models' ? styles.tabActive : ''}`} onClick={() => setTab('models')}>
          🤖 AI Models
        </button>
      </div>

      <main className={styles.main}>

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Danh sach nguoi dung</h2>
              <span className={styles.badge}>{users.length}</span>
            </div>

            {usersLoading ? (
              <div className={styles.loading}>Dang tai...</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Ten</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>ELO</th>
                      <th>Tran</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id}>
                        <td className={styles.tdMuted}>{i + 1}</td>
                        <td className={styles.tdBold}>{u.username}</td>
                        <td>{u.name || '—'}</td>
                        <td className={styles.tdMuted}>{u.email}</td>
                        <td>
                          <span className={`${styles.roleBadge} ${u.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className={styles.tdElo}>{u.elo}</td>
                        <td>{u.totalMatches}</td>
                        <td>
                          {u.role !== 'ADMIN' && (
                            deleteConfirm === u.id ? (
                              <div className={styles.confirmRow}>
                                <span className={styles.confirmText}>Xac nhan?</span>
                                <button className={styles.btnConfirm} onClick={() => handleDeleteUser(u.id)}>✓</button>
                                <button className={styles.btnCancelSm} onClick={() => setDC(null)}>✕</button>
                              </div>
                            ) : (
                              <button className={styles.btnDelete} onClick={() => setDC(u.id)}>🗑️</button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── MODELS TAB ── */}
        {tab === 'models' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Quan ly AI Models</h2>
              <button className={styles.btnAdd} onClick={() => { setModelForm({ ...EMPTY_MODEL }); setFormError('') }}>
                + Them model
              </button>
            </div>

            {modelsLoading ? (
              <div className={styles.loading}>Dang tai...</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ten</th>
                      <th>Do kho</th>
                      <th>File Path</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m, i) => (
                      <tr key={m.id}>
                        <td className={styles.tdMuted}>{i + 1}</td>
                        <td className={styles.tdBold}>{m.name}</td>
                        <td>
                          <span className={`${styles.diffBadge} ${DIFF_COLOR[m.difficulty?.toUpperCase()] || ''}`}>
                            {DIFF_LABEL[m.difficulty?.toUpperCase()] || m.difficulty}
                          </span>
                        </td>
                        <td className={styles.tdPath}>{m.filePath}</td>
                        <td>
                          <div className={styles.actionRow}>
                            <button className={styles.btnEdit} onClick={() => { setModelForm({ ...m }); setFormError('') }}>✏️</button>
                            {modelDeleteId === m.id ? (
                              <>
                                <button className={styles.btnConfirm} onClick={() => handleDeleteModel(m.id)}>✓</button>
                                <button className={styles.btnCancelSm} onClick={() => setMDI(null)}>✕</button>
                              </>
                            ) : (
                              <button className={styles.btnDelete} onClick={() => setMDI(m.id)}>🗑️</button>
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
        )}
      </main>

      {/* ── Model form modal ── */}
      {modelForm && (
        <div className={styles.modalOverlay} onClick={() => setModelForm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{modelForm.id ? 'Chinh sua model' : 'Them model moi'}</h3>
            <form onSubmit={handleModelSave} className={styles.form}>
              <div className={styles.field}>
                <label>Ten model</label>
                <input
                  type="text"
                  value={modelForm.name}
                  onChange={(e) => setModelForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Master Bot"
                  disabled={modelSaving}
                />
              </div>
              <div className={styles.field}>
                <label>Do kho</label>
                <select
                  value={modelForm.difficulty}
                  onChange={(e) => setModelForm((p) => ({ ...p, difficulty: e.target.value }))}
                  disabled={modelSaving}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{DIFF_LABEL[d]}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>File Path</label>
                <input
                  type="text"
                  value={modelForm.filePath}
                  onChange={(e) => setModelForm((p) => ({ ...p, filePath: e.target.value }))}
                  placeholder="VD: models/master.onnx"
                  disabled={modelSaving}
                />
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnSave} disabled={modelSaving}>
                  {modelSaving ? 'Dang luu...' : 'Luu'}
                </button>
                <button type="button" className={styles.btnCancelMd} onClick={() => setModelForm(null)} disabled={modelSaving}>
                  Huy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
