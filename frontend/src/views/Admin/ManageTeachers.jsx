import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AdminPageLayout from '../../components/admin/AdminPageLayout'

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTeacherId, setEditingTeacherId] = useState(null)
  const formAnchorRef = useRef(null)
  const [formData, setFormData] = useState({
    teacher_name: '',
    email: '',
    department_id: '',
    username: '',
    password: '',
  })

  useEffect(() => {
    loadTeachers()
    loadDepartments()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/teachers')
      if (response.data.success) {
        setTeachers(response.data.teachers)
      }
    } catch (error) {
      console.error('Error loading teachers:', error)
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments')
      if (response.data.success) {
        setDepartments(response.data.departments)
      }
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      teacher_name: '',
      email: '',
      department_id: '',
      username: '',
      password: '',
    })
    setEditingTeacherId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        ...formData,
        password: String(formData.password || ''),
      }
      const response = editingTeacherId
        ? await api.put(`/teachers/${editingTeacherId}`, payload)
        : await api.post('/teachers', payload)
      if (response.data.success) {
        toast.success(editingTeacherId ? 'Teacher updated successfully!' : 'Teacher added successfully!')
        resetForm()
        loadTeachers()
      } else {
        toast.error(response.data.message || 'Failed to save teacher')
      }
    } catch (error) {
      console.error('Error saving teacher:', error)
      const errorMessage =
        error.response?.data?.message || error.response?.data?.details || 'Failed to save teacher'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Delete teacher "${name}"? Their login account will be removed. This cannot be undone.`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/teachers/${id}`)
      if (response.data.success) {
        toast.success('Teacher deleted.')
        loadTeachers()
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to delete teacher')
    } finally {
      setLoading(false)
    }
  }

  const toggleFormAtTop = () => {
    setShowForm((prev) => {
      const next = !prev
      if (!next) setEditingTeacherId(null)
      if (next) {
        setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      }
      return next
    })
  }

  const startEditTeacher = (teacher) => {
    setEditingTeacherId(teacher.teacher_id)
    setFormData({
      teacher_name: teacher.teacher_name || '',
      email: teacher.email || '',
      department_id: teacher.department_id ? String(teacher.department_id) : '',
      username: teacher.username || '',
      password: '',
    })
    setShowForm(true)
    setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  return (
    <AdminPageLayout
      title="Teachers"
      subtitle="Create staff accounts linked to a department. Each teacher gets a username and password for SARMS."
      actions={
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={toggleFormAtTop}
        >
          {showForm ? 'Close form' : '+ Add teacher'}
        </button>
      }
    >
      <div ref={formAnchorRef} />
      {showForm && (
        <div className="admin-card">
          <h3 className="admin-card__title">{editingTeacherId ? 'Edit teacher' : 'New teacher'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid admin-form-grid--2">
              <div className="form-group">
                <label>Full name</label>
                <input
                  type="text"
                  value={formData.teacher_name}
                  onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-group">
                <label>{editingTeacherId ? 'Password (leave blank to keep current)' : 'Password'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  required={!editingTeacherId}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-actions-cell">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving…' : editingTeacherId ? 'Update teacher' : 'Create teacher'}
              </button>
              {editingTeacherId && (
                <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm} disabled={loading}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-shell">
        <div className="admin-table-shell__caption">
          {loading && !teachers.length
            ? 'Loading…'
            : `${teachers.length} teacher${teachers.length === 1 ? '' : 's'}`}
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Username</th>
                <th style={{ width: '1%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.teacher_id}>
                  <td>
                    <span className="admin-id-badge">{teacher.teacher_id}</span>
                  </td>
                  <td>
                    <strong>{teacher.teacher_name}</strong>
                  </td>
                  <td className="admin-muted">{teacher.email || '—'}</td>
                  <td>{teacher.department_name || '—'}</td>
                  <td>
                    <code style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                      {teacher.username || '—'}
                    </code>
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => startEditTeacher(teacher)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => handleDelete(teacher.teacher_id, teacher.teacher_name)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && teachers.length === 0 && (
          <p className="admin-muted" style={{ padding: '1.5rem 1.25rem', margin: 0 }}>
            No teachers yet. Add a teacher to issue logins and assign classes.
          </p>
        )}
      </div>
    </AdminPageLayout>
  )
}

export default ManageTeachers
