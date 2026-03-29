import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const MarkEntry = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [existingMarks, setExistingMarks] = useState({})
  const [editingMarks, setEditingMarks] = useState({}) // Track which marks are being edited
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && user.teacher_id) {
      loadTeacherClasses()
    }
  }, [user])

  // Auto-select class if passed from dashboard
  useEffect(() => {
    if (location.state?.selectedClass && classes.length > 0) {
      const classFromDashboard = location.state.selectedClass
      setSelectedClass(classFromDashboard.class_id)
      setSelectedSubject(classFromDashboard.subject_id)
      loadStudents(classFromDashboard.class_id)
    }
  }, [location.state, classes])

  const loadTeacherClasses = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/teachers/${user.teacher_id}/assignments`)
      if (response.data.success) {
        setClasses(response.data.assignments)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async (classId) => {
    try {
      setLoading(true)
      const response = await api.get(`/students/class/${classId}`)
      if (response.data.success) {
        setStudents(response.data.students)
        
        // Load existing marks for this class/subject
        await loadExistingMarks(classId)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const loadExistingMarks = async (classId) => {
    try {
      const selectedAssignment = classes.find(c => c.class_id == classId)
      if (!selectedAssignment) return

      // Get current year_id from system settings
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1

      const response = await api.get(`/marks?class_id=${classId}&subject_id=${selectedAssignment.subject_id}&year_id=${currentYearId}&semester_id=${currentSemesterId}`)
      
      if (response.data.success) {
        const marksMap = {}
        response.data.marks.forEach(mark => {
          marksMap[mark.student_id] = {
            mark: mark.mark,
            status: mark.status,
            mark_id: mark.mark_id
          }
        })
        setExistingMarks(marksMap)
        
        // Pre-fill marks input with existing marks
        const marksInput = {}
        Object.keys(marksMap).forEach(studentId => {
          marksInput[studentId] = marksMap[studentId].mark
        })
        setMarks(marksInput)
      }
    } catch (error) {
      console.error('Error loading existing marks:', error)
    }
  }

  const handleClassChange = (classId) => {
    setSelectedClass(classId)
    const selectedAssignment = classes.find(c => c.class_id == classId)
    setSelectedSubject(selectedAssignment?.subject_id || '')
    
    if (classId) {
      loadStudents(classId)
    } else {
      setStudents([])
      setMarks({})
      setExistingMarks({})
      setEditingMarks({})
    }
  }

  const handleMarkChange = (studentId, mark) => {
    setMarks({
      ...marks,
      [studentId]: mark
    })
  }

  const handleEditMark = (studentId) => {
    setEditingMarks({
      ...editingMarks,
      [studentId]: true
    })
  }

  const handleCancelEdit = (studentId) => {
    // Restore original mark
    setMarks({
      ...marks,
      [studentId]: existingMarks[studentId]?.mark || ''
    })
    setEditingMarks({
      ...editingMarks,
      [studentId]: false
    })
  }

  const submitMarks = async () => {
    try {
      setLoading(true)
      
      // Get current year_id from system settings
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1
      
      const marksArray = Object.entries(marks).map(([studentId, mark]) => ({
        student_id: parseInt(studentId),
        subject_id: classes.find(c => c.class_id == selectedClass)?.subject_id,
        teacher_id: user.teacher_id,
        semester_id: currentSemesterId,
        year_id: currentYearId,
        mark: parseFloat(mark)
      }))

      const response = await api.post('/marks/batch', { marks: marksArray })
      
      if (response.data.success) {
        toast.success('Marks saved as draft!')
        // Don't reload - just update the status in existingMarks
        const updatedExistingMarks = { ...existingMarks }
        marksArray.forEach(mark => {
          updatedExistingMarks[mark.student_id] = {
            mark: mark.mark,
            status: 'draft',
            mark_id: updatedExistingMarks[mark.student_id]?.mark_id
          }
        })
        setExistingMarks(updatedExistingMarks)
      }
    } catch (error) {
      console.error('Error submitting marks:', error)
      toast.error(error.response?.data?.message || 'Failed to save marks')
    } finally {
      setLoading(false)
    }
  }

  const submitToHomeroom = async () => {
    if (!window.confirm('Are you sure you want to submit these marks to the homeroom teacher? You can still edit them later.')) {
      return
    }

    try {
      setSubmitting(true)
      
      // Get current year_id from system settings
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1
      
      const response = await api.post('/marks/submit-to-homeroom', {
        class_id: parseInt(selectedClass),
        subject_id: selectedSubject,
        year_id: currentYearId,
        semester_id: currentSemesterId
      })
      
      if (response.data.success) {
        toast.success(`${response.data.submitted_count} marks submitted to homeroom teacher!`)
        // Update status to 'submitted' for all marks without removing them
        const updatedExistingMarks = { ...existingMarks }
        Object.keys(updatedExistingMarks).forEach(studentId => {
          if (updatedExistingMarks[studentId].status === 'draft') {
            updatedExistingMarks[studentId].status = 'submitted'
          }
        })
        setExistingMarks(updatedExistingMarks)
      }
    } catch (error) {
      console.error('Error submitting to homeroom:', error)
      toast.error(error.response?.data?.message || 'Failed to submit to homeroom teacher')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Students Table */}
        {students.length > 0 && (
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
              Student Marks - Grade {location.state?.selectedClass?.grade}{location.state?.selectedClass?.section} ({location.state?.selectedClass?.subject_name})
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '0 8px'
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333', borderRadius: '8px 0 0 8px' }}>Student Name</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Student Code</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Mark (0-100)</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', borderRadius: '0 8px 8px 0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const isSubmitted = existingMarks[student.student_id]?.status === 'submitted'
                    const isEditing = editingMarks[student.student_id]
                    const canEdit = isSubmitted && !isEditing
                    
                    return (
                      <tr key={student.student_id} style={{
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }}>
                        <td style={{ padding: '16px', borderRadius: '8px 0 0 8px', fontWeight: '500' }}>{student.student_name}</td>
                        <td style={{ padding: '16px', color: '#666' }}>{student.student_code}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marks[student.student_id] || ''}
                            onChange={(e) => handleMarkChange(student.student_id, e.target.value)}
                            placeholder="0"
                            disabled={isSubmitted && !isEditing}
                            style={{
                              width: '80px',
                              padding: '8px 12px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '16px',
                              textAlign: 'center',
                              backgroundColor: (isSubmitted && !isEditing) ? '#f0f0f0' : 'white'
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {isSubmitted ? (
                            <span style={{
                              padding: '6px 12px',
                              background: '#d1fae5',
                              color: '#065f46',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>✓ Submitted</span>
                          ) : existingMarks[student.student_id]?.status === 'draft' ? (
                            <span style={{
                              padding: '6px 12px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>Draft</span>
                          ) : (
                            <span style={{ color: '#999', fontSize: '14px' }}>Not entered</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>
                          {canEdit && (
                            <button
                              onClick={() => handleEditMark(student.student_id)}
                              style={{
                                padding: '6px 16px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {isEditing && (
                            <button
                              onClick={() => handleCancelEdit(student.student_id)}
                              style={{
                                padding: '6px 16px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginLeft: '8px'
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{
              marginTop: '32px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button 
                onClick={submitMarks}
                disabled={loading || Object.keys(marks).length === 0}
                style={{
                  padding: '14px 28px',
                  background: loading ? '#ccc' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
              >
                {loading ? 'Saving...' : '💾 Save as Draft'}
              </button>
              
              <button 
                onClick={submitToHomeroom}
                disabled={submitting || Object.keys(existingMarks).filter(id => existingMarks[id].status === 'draft').length === 0}
                style={{
                  padding: '14px 28px',
                  background: submitting ? '#ccc' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                {submitting ? 'Submitting...' : '📤 Submit to Homeroom'}
              </button>
              
              <button 
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '14px 28px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                ← Back
              </button>
            </div>
            
            <p style={{
              marginTop: '16px',
              fontSize: '14px',
              color: '#666',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              💡 Tip: Save your work as draft first, then submit to homeroom teacher when ready. You can edit submitted marks anytime.
            </p>
          </div>
        )}

        {!loading && selectedClass && students.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
            <p style={{ fontSize: '18px', color: '#666' }}>No students found in this class.</p>
          </div>
        )}

        {loading && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <p style={{ fontSize: '18px', color: '#666' }}>Loading students...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkEntry
