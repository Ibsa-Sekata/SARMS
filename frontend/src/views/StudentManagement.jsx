import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTeacherClass } from '../contexts/TeacherClassContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const StudentManagement = () => {
  const { user } = useAuth()
  const { selectedClass, loading: assignmentsLoading } = useTeacherClass()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const classId = user?.role === 'teacher' ? selectedClass?.class_id : undefined

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadStudents = useCallback(async () => {
    if (!user) return
    if (user.role === 'teacher' && !classId) {
      setStudents([])
      return
    }
    try {
      setLoading(true)
      const params = debouncedSearch ? { q: debouncedSearch } : undefined

      if (classId) {
        const response = await api.get(`/students/class/${classId}`, { params })
        if (response.data.success) {
          setStudents(response.data.students)
        }
      } else {
        const response = await api.get('/students', { params })
        if (response.data.success) {
          setStudents(response.data.students)
        }
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error(error.response?.data?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [user, classId, debouncedSearch])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const title =
    user?.role === 'teacher' && selectedClass
      ? `Students — Grade ${selectedClass.grade}${selectedClass.section} · ${selectedClass.subject_name}`
      : 'Students'

  const teacherNeedsClass = user?.role === 'teacher' && !assignmentsLoading && !classId

  return (
    <div className="teacher-students">
      <div className="teacher-students__inner">
        <div className="teacher-students__card">
          <div className="teacher-students__head">
            <h2 className="teacher-students__title">{title}</h2>
          </div>

          <div className="teacher-students__toolbar-wrap">
            <div className="sarms-toolbar">
              <input
                type="search"
                className="sarms-toolbar__search"
                placeholder="Search by name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Filter students"
                disabled={user?.role === 'teacher' && !classId}
              />
              <button
                type="button"
                className="sarms-toolbar__btn sarms-toolbar__btn--primary"
                onClick={loadStudents}
                disabled={loading || (user?.role === 'teacher' && !classId)}
              >
                Refresh
              </button>
            </div>
          </div>

          {assignmentsLoading && user?.role === 'teacher' ? (
            <p className="teacher-students__muted teacher-students__state-msg">Loading classes…</p>
          ) : teacherNeedsClass ? (
            <div className="teacher-students__empty">
              <span className="teacher-students__empty-icon" aria-hidden>
                👥
              </span>
              <p style={{ marginBottom: '1rem' }}>
                Choose your class with <strong>Select class</strong> in the sidebar (above Dashboard), or on the
                Dashboard page. This page does not ask for the class again.
              </p>
              <button
                type="button"
                className="sarms-toolbar__btn sarms-toolbar__btn--primary"
                onClick={() => navigate('/dashboard')}
              >
                Open Dashboard
              </button>
            </div>
          ) : loading ? (
            <p className="teacher-students__muted teacher-students__state-msg">Loading students…</p>
          ) : students.length === 0 ? (
            <div className="teacher-students__empty">
              <span className="teacher-students__empty-icon" aria-hidden>
                👥
              </span>
              <p>No students match your filters.</p>
            </div>
          ) : (
            <>
              <div className="teacher-students__table-wrap">
                <table className="teacher-students__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id}>
                        <td className="teacher-students__code">
                          {student.student_code || `STU${String(student.student_id).padStart(4, '0')}`}
                        </td>
                        <td>{student.student_name}</td>
                        <td>
                          <span
                            className={`teacher-students__pill ${
                              student.gender === 'M' ? 'teacher-students__pill--m' : 'teacher-students__pill--f'
                            }`}
                          >
                            {student.gender === 'M' ? 'Male' : 'Female'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="teacher-students__footer">
                <span className="teacher-students__muted">
                  {students.length} student{students.length !== 1 ? 's' : ''}
                </span>
                <button type="button" className="sarms-toolbar__btn" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentManagement
