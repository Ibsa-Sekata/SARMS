import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AdminPageLayout from '../../components/admin/AdminPageLayout'

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingDepartmentId, setEditingDepartmentId] = useState(null)
  const formAnchorRef = useRef(null)
  const [formData, setFormData] = useState({
    department_name: '',
    subjectNames: [''],
  })
  const [allSubjects, setAllSubjects] = useState([])
  const [existingEditSubjects, setExistingEditSubjects] = useState([])
  const [newEditSubjectNames, setNewEditSubjectNames] = useState([''])

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/departments')
      if (response.data.success) {
        setDepartments(response.data.departments)
      } else {
        toast.error(response.data.message || 'Failed to load departments')
      }
    } catch (error) {
      console.error('Error loading departments:', error)
      toast.error(error.response?.data?.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects')
      if (response.data.success && Array.isArray(response.data.subjects)) {
        setAllSubjects(response.data.subjects)
      } else {
        setAllSubjects([])
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      setAllSubjects([])
    }
  }

  const addSubjectRow = () => {
    setFormData((prev) => ({ ...prev, subjectNames: [...prev.subjectNames, ''] }))
  }

  const removeSubjectRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      subjectNames: prev.subjectNames.filter((_, i) => i !== index),
    }))
  }

  const setSubjectNameAt = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.subjectNames]
      next[index] = value
      return { ...prev, subjectNames: next }
    })
  }

  const resetForm = () => {
    setFormData({ department_name: '', subjectNames: [''] })
    setExistingEditSubjects([])
    setNewEditSubjectNames([''])
    setEditingDepartmentId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      let response
      if (editingDepartmentId) {
        const addSubjects = newEditSubjectNames.map((s) => String(s).trim()).filter(Boolean)
        const removeSubjectIds = existingEditSubjects.filter((s) => s.remove).map((s) => s.subject_id)
        response = await api.put(`/departments/${editingDepartmentId}`, {
          department_name: formData.department_name.trim(),
          add_subjects: addSubjects,
          remove_subject_ids: removeSubjectIds,
        })
      } else {
        const trimmedSubjects = formData.subjectNames.map((s) => String(s).trim()).filter(Boolean)
        if (trimmedSubjects.length === 0) {
          toast.error('Add at least one subject for this department.')
          setLoading(false)
          return
        }
        response = await api.post('/departments', {
          department_name: formData.department_name.trim(),
          subjects: trimmedSubjects.map((subject_name) => ({ subject_name })),
        })
      }
      if (response.data.success) {
        toast.success(
          response.data.message || (editingDepartmentId ? 'Department updated successfully!' : 'Department added successfully!')
        )
        resetForm()
        loadDepartments()
        loadSubjects()
      }
    } catch (error) {
      console.error('Error saving department:', error)
      toast.error(error.response?.data?.message || 'Failed to save department')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return

    try {
      setLoading(true)
      const response = await api.delete(`/departments/${id}`)
      if (response.data.success) {
        toast.success('Department deleted.')
        loadDepartments()
      }
    } catch (error) {
      console.error('Error deleting department:', error)
      toast.error(error.response?.data?.message || 'Failed to delete department')
    } finally {
      setLoading(false)
    }
  }

  const toggleFormAtTop = () => {
    setShowForm((prev) => {
      const next = !prev
      if (!next) setEditingDepartmentId(null)
      if (next) {
        setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      }
      return next
    })
  }

  const startEditDepartment = (department) => {
    const departmentSubjects = allSubjects
      .filter((s) => Number(s.department_id) === Number(department.department_id))
      .sort((a, b) => String(a.subject_name).localeCompare(String(b.subject_name)))
      .map((s) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        remove: false,
      }))

    setEditingDepartmentId(department.department_id)
    setFormData({
      department_name: department.department_name || '',
      subjectNames: [''],
    })
    setExistingEditSubjects(departmentSubjects)
    setNewEditSubjectNames([''])
    setShowForm(true)
    setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const addNewEditSubjectRow = () => {
    setNewEditSubjectNames((prev) => [...prev, ''])
  }

  const removeNewEditSubjectRow = (index) => {
    setNewEditSubjectNames((prev) => prev.filter((_, i) => i !== index))
  }

  const setNewEditSubjectAt = (index, value) => {
    setNewEditSubjectNames((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const toggleExistingSubjectRemoval = (subjectId) => {
    setExistingEditSubjects((prev) =>
      prev.map((s) => (s.subject_id === subjectId ? { ...s, remove: !s.remove } : s))
    )
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  return (
    <AdminPageLayout
      title="Departments"
      subtitle="Create a department and its subjects together. Teachers in that department use those subjects when assigned to classes."
      actions={
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={toggleFormAtTop}
        >
          {showForm ? 'Close form' : '+ Add department'}
        </button>
      }
    >
      <div ref={formAnchorRef} />
      {showForm && (
        <div className="admin-card">
          <h3 className="admin-card__title">
            {editingDepartmentId ? 'Edit department' : 'New department & subjects'}
          </h3>
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Department name</label>
              <input
                type="text"
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                placeholder="e.g. Sciences, Languages"
                required
              />
            </div>
            {!editingDepartmentId && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label style={{ margin: 0 }}>Subjects in this department</label>
                  <button type="button" className="admin-btn" onClick={addSubjectRow}>
                    + Add subject
                  </button>
                </div>
                <p className="admin-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.65rem' }}>
                  If the department has only one subject, it is picked automatically when you assign a teacher.
                  If it has several, the admin chooses the subject when assigning to a class.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.subjectNames.map((name, index) => (
                    <div
                      key={index}
                      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setSubjectNameAt(index, e.target.value)}
                        placeholder={`Subject ${index + 1} name`}
                        style={{ flex: 1 }}
                      />
                      {formData.subjectNames.length > 1 && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => removeSubjectRow(index)}
                          aria-label="Remove subject row"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {editingDepartmentId && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label style={{ margin: 0 }}>Department subjects</label>
                </div>

                <p className="admin-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.65rem' }}>
                  You can delete existing subjects from this department and add new ones in the same update.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.9rem' }}>
                  {existingEditSubjects.length === 0 && (
                    <div className="admin-muted">No subjects currently assigned to this department.</div>
                  )}
                  {existingEditSubjects.map((subject) => (
                    <div
                      key={subject.subject_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '0.45rem 0.6rem',
                        background: subject.remove ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-surface)',
                      }}
                    >
                      <span style={{ textDecoration: subject.remove ? 'line-through' : 'none' }}>
                        {subject.subject_name}
                      </span>
                      <button
                        type="button"
                        className={`admin-btn ${subject.remove ? 'admin-btn--ghost' : 'admin-btn--danger'}`}
                        onClick={() => toggleExistingSubjectRemoval(subject.subject_id)}
                      >
                        {subject.remove ? 'Keep' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label style={{ margin: 0 }}>Add new subjects</label>
                  <button type="button" className="admin-btn" onClick={addNewEditSubjectRow}>
                    + Add subject
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newEditSubjectNames.map((name, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setNewEditSubjectAt(index, e.target.value)}
                        placeholder={`New subject ${index + 1} name`}
                        style={{ flex: 1 }}
                      />
                      {newEditSubjectNames.length > 1 && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => removeNewEditSubjectRow(index)}
                          aria-label="Remove subject row"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="admin-actions-cell">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving…' : editingDepartmentId ? 'Update department' : 'Save department & subjects'}
              </button>
              {editingDepartmentId && (
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
          {loading && !departments.length
            ? 'Loading…'
            : `${departments.length} department${departments.length === 1 ? '' : 's'}`}
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th style={{ width: '1%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.department_id}>
                  <td>
                    <span className="admin-id-badge">{dept.department_id}</span>
                  </td>
                  <td>
                    <strong>{dept.department_name}</strong>
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => startEditDepartment(dept)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => handleDelete(dept.department_id, dept.department_name)}
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
        {!loading && departments.length === 0 && (
          <p className="admin-muted" style={{ padding: '1.5rem 1.25rem', margin: 0 }}>
            No departments yet. Add one with its subjects to assign teachers and classes.
          </p>
        )}
      </div>
    </AdminPageLayout>
  )
}

export default ManageDepartments
