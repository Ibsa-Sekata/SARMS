import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const StudentManagement = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    try {
      setLoading(true)
      
      // If coming from dashboard with selected class, fetch students for that class
      if (location.state?.selectedClass) {
        const response = await api.get(`/students/class/${location.state.selectedClass.class_id}`)
        if (response.data.success) {
          setStudents(response.data.students)
        }
      } else {
        // Otherwise fetch all students the teacher has access to
        const response = await api.get('/students')
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
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Students Table */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1e3c72',
            marginBottom: '24px'
          }}>
            {location.state?.selectedClass 
              ? `Students - Grade ${location.state.selectedClass.grade}${location.state.selectedClass.section}`
              : 'My Students'}
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <p style={{ fontSize: '18px', color: '#666' }}>No students found in this class.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0 8px'
                }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333', borderRadius: '8px 0 0 8px' }}>Student Code</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Name</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Gender</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Date of Birth</th>
                      <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', borderRadius: '0 8px 8px 0' }}>Enrollment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.student_id} style={{
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }}>
                        <td style={{ padding: '16px', borderRadius: '8px 0 0 8px', fontWeight: '500', color: '#1e3c72' }}>
                          {student.student_code || `STU${String(student.student_id).padStart(4, '0')}`}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '500' }}>{student.student_name}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '6px 12px',
                            background: student.gender === 'M' ? '#dbeafe' : '#fce7f3',
                            color: student.gender === 'M' ? '#1e40af' : '#be185d',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {student.gender === 'M' ? '👦 Male' : '👧 Female'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                          {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#666', borderRadius: '0 8px 8px 0' }}>
                          {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Total: {students.length} student{students.length !== 1 ? 's' : ''}
                </span>
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ← Back to Dashboard
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