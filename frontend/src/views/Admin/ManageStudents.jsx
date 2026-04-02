import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AdminPageLayout from '../../components/admin/AdminPageLayout'

const ManageStudents = () => {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const formAnchorRef = useRef(null)
  const [formData, setFormData] = useState({
    student_name: '',
    gender: '',
    student_code: '',
    class_id: '',
  })

  const groupedStudents = useMemo(() => {
    const groups = new Map()
    students.forEach((student) => {
      const grade = Number(student.grade_number) || 0
      const section = String(student.section_name || '')
      const classId = Number(student.class_id) || 0
      const key = `${grade}-${section}-${classId}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          class_id: classId,
          grade_number: grade,
          section_name: section,
          students: [],
        })
      }
      groups.get(key).students.push(student)
    })

    const grouped = Array.from(groups.values())
      .sort((a, b) => {
        return a.class_id - b.class_id
      })
      .map((group) => ({
        ...group,
        students: [...group.students].sort((a, b) => Number(a.student_id) - Number(b.student_id)),
      }))

    return grouped
  }, [students])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 320)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    loadClasses()
  }, [])

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/students', {
        params: debouncedSearch ? { q: debouncedSearch } : undefined,
      })
      if (response.data.success) {
        setStudents(response.data.students)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const exportCsv = () => {
    if (!students.length) {
      toast.error('No rows to export')
      return
    }
    const headers = ['ID', 'Name', 'Code', 'Gender', 'Class']
    const rows = students.map((s) => [
      s.student_id,
      `"${String(s.student_name || '').replace(/"/g, '""')}"`,
      s.student_code ?? '',
      s.gender ?? '',
      `"Grade ${s.grade_number ?? ''}${s.section_name ?? ''}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Download started')
  }

  const loadClasses = async () => {
    try {
      const response = await api.get('/classes')
      if (response.data.success) {
        setClasses(response.data.classes)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      student_name: '',
      gender: '',
      student_code: '',
      class_id: '',
    })
    setEditingStudentId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        ...formData,
        student_code: String(formData.student_code || '').trim(),
      }
      const response = editingStudentId
        ? await api.put(`/students/${editingStudentId}`, payload)
        : await api.post('/students', payload)
      if (response.data.success) {
        toast.success(editingStudentId ? 'Student updated successfully!' : 'Student added successfully!')
        resetForm()
        loadStudents()
      } else {
        toast.error(response.data.message || 'Failed to save student')
      }
    } catch (error) {
      console.error('Error saving student:', error)
      const errorMessage =
        error.response?.data?.message || error.response?.data?.details || 'Failed to save student'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return

    try {
      setLoading(true)
      const response = await api.delete(`/students/${id}`)
      if (response.data.success) {
        toast.success('Student deleted.')
        loadStudents()
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error(error.response?.data?.message || 'Failed to delete student')
    } finally {
      setLoading(false)
    }
  }

  const toggleFormAtTop = () => {
    setShowForm((prev) => {
      const next = !prev
      if (!next) setEditingStudentId(null)
      if (next) {
        setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
      }
      return next
    })
  }

  const startEditStudent = (student) => {
    setEditingStudentId(student.student_id)
    setFormData({
      student_name: student.student_name || '',
      gender: student.gender || '',
      student_code: student.student_code || '',
      class_id: student.class_id ? String(student.class_id) : '',
    })
    setShowForm(true)
    setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  return (
    <AdminPageLayout
      title="Students"
      subtitle="Enrol learners into classes, search the directory, and export rosters as CSV."
      actions={
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={toggleFormAtTop}
        >
          {showForm ? 'Close form' : '+ Add student'}
        </button>
      }
    >
      <div ref={formAnchorRef} />
      <div className="admin-card" style={{ padding: '1rem 1.15rem' }}>
        <div className="sarms-toolbar" style={{ marginBottom: 0 }}>
          <input
            type="search"
            className="sarms-toolbar__search"
            placeholder="Search by name or student code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search students"
          />
          <button type="button" className="sarms-toolbar__btn" onClick={exportCsv} disabled={loading}>
            Export CSV
          </button>
          <button
            type="button"
            className="sarms-toolbar__btn sarms-toolbar__btn--primary"
            onClick={loadStudents}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {showForm && (
        <div className="admin-card">
          <h3 className="admin-card__title">{editingStudentId ? 'Edit student' : 'New student'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid admin-form-grid--2">
              <div className="form-group">
                <label>Student name</label>
                <input
                  type="text"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Student code</label>
                <input
                  type="text"
                  value={formData.student_code}
                  onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      Grade {cls.grade_number}
                      {cls.section_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-actions-cell">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving…' : editingStudentId ? 'Update student' : 'Save student'}
              </button>
              {editingStudentId && (
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
          {loading && !students.length
            ? 'Loading…'
            : `${students.length} student${students.length === 1 ? '' : 's'}${debouncedSearch ? ' (filtered)' : ''}`}
        </div>
        <div className="admin-student-groups">
          {groupedStudents.map((group) => (
            <div key={group.key} className="admin-student-group">
              <div className="admin-student-group__header">
                <strong>
                  Grade {group.grade_number}
                  {group.section_name}
                </strong>
                <span className="admin-muted">
                  {group.students.length} student{group.students.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="admin-table-scroll">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Gender</th>
                      <th style={{ width: '1%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.students.map((student) => (
                      <tr key={student.student_id}>
                        <td>
                          <span className="admin-id-badge">{student.student_id}</span>
                        </td>
                        <td>
                          <strong>{student.student_name}</strong>
                        </td>
                        <td>{student.student_code}</td>
                        <td>{student.gender}</td>
                        <td>
                          <div className="admin-actions-cell">
                            <button
                              type="button"
                              className="admin-btn"
                              onClick={() => startEditStudent(student)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              onClick={() => handleDelete(student.student_id, student.student_name)}
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
            </div>
          ))}
        </div>
        {!loading && students.length === 0 && (
          <p className="admin-muted" style={{ padding: '1.5rem 1.25rem', margin: 0 }}>
            No students match this search, or the database is empty.
          </p>
        )}
      </div>
    </AdminPageLayout>
  )
}

export default ManageStudents
