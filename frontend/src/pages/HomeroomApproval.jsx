import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const HomeroomApproval = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [marks, setMarks] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)

  useEffect(() => {
    // Get class from navigation state
    if (location.state?.selectedClass) {
      setSelectedClass(location.state.selectedClass)
    }
  }, [location.state])

  useEffect(() => {
    console.log('[HomeroomApproval] Component mounted');
    console.log('[HomeroomApproval] User:', user);
    console.log('[HomeroomApproval] Is homeroom teacher:', user?.is_homeroom_teacher);
    
    if (user && user.is_homeroom_teacher) {
      console.log('[HomeroomApproval] Calling loadSubmittedMarks...');
      loadSubmittedMarks()
    } else {
      console.log('[HomeroomApproval] NOT calling loadSubmittedMarks because:');
      console.log('  - user exists:', !!user);
      console.log('  - is_homeroom_teacher:', user?.is_homeroom_teacher);
    }
  }, [user])

  const loadSubmittedMarks = async () => {
    try {
      setLoading(true)
      
      // Get current year and semester from settings
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1

      console.log('Loading submitted marks with:', { currentYearId, currentSemesterId })

      const response = await api.get(`/marks/homeroom/submitted?year_id=${currentYearId}&semester_id=${currentSemesterId}`)
      
      console.log('Submitted marks response:', response.data)
      
      if (response.data.success) {
        setMarks(response.data.marks)
        setSummary(response.data.summary)
        console.log('Loaded marks:', response.data.marks.length)
        console.log('Loaded summary:', response.data.summary.length)
      }
    } catch (error) {
      console.error('Error loading submitted marks:', error)
      toast.error(error.response?.data?.message || 'Failed to load submitted marks')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAll = async () => {
    if (!window.confirm('Are you sure you want to approve all submitted marks? This will allow you to generate the roster.')) {
      return
    }

    try {
      setApproving(true)
      
      // Get current year and semester from settings
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1

      const response = await api.post('/marks/homeroom/approve-all', {
        year_id: currentYearId,
        semester_id: currentSemesterId
      })
      
      if (response.data.success) {
        toast.success(`${response.data.approved_count} marks approved successfully!`)
        loadSubmittedMarks() // Reload to show updated status
      }
    } catch (error) {
      console.error('Error approving marks:', error)
      toast.error(error.response?.data?.message || 'Failed to approve marks')
    } finally {
      setApproving(false)
    }
  }

  // Group marks by subject
  const marksBySubject = marks.reduce((acc, mark) => {
    if (!acc[mark.subject_name]) {
      acc[mark.subject_name] = []
    }
    acc[mark.subject_name].push(mark)
    return acc
  }, {})

  // Check if all subjects are complete (all students have submitted marks)
  const allSubjectsComplete = summary.length > 0 && summary.every(item => 
    item.submitted_count === item.total_students
  );

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Page Title */}
      <div style={{
        background: 'white',
        padding: '25px 30px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
      }}>
        <h1 style={{ 
          fontSize: '26px', 
          fontWeight: '600', 
          color: '#2c3e50',
          margin: '0 0 8px 0'
        }}>
          Approve Submitted Marks
        </h1>
        {selectedClass && (
          <p style={{ 
            fontSize: '15px', 
            color: '#666',
            margin: 0
          }}>
            Grade {selectedClass.grade_number}{selectedClass.section_name}
          </p>
        )}
      </div>

      {loading ? (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ fontSize: '16px', color: '#666' }}>Loading submitted marks...</div>
        </div>
      ) : (
        <>
          {/* Summary Cards - All Courses and Teachers at Top */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#2c3e50',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e9ecef'
            }}>
              📚 Subject Teachers & Submission Status
            </h2>
            
            {summary.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                <p style={{ fontSize: '18px', color: '#495057', margin: '0 0 10px 0', fontWeight: '500' }}>
                  No marks have been submitted yet
                </p>
                <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
                  Subject teachers need to submit their marks before you can approve them
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '15px'
              }}>
                {summary.map((item, index) => {
                  const isComplete = item.submitted_count === item.total_students
                  const percentage = item.total_students > 0 
                    ? Math.round((item.submitted_count / item.total_students) * 100) 
                    : 0
                  
                  return (
                    <div key={index} style={{
                      background: isComplete ? '#f0f9ff' : '#fff8f0',
                      border: `1px solid ${isComplete ? '#3b82f6' : '#f59e0b'}`,
                      borderRadius: '6px',
                      padding: '8px 10px',
                      transition: 'all 0.3s',
                      cursor: 'default'
                    }}>
                      {/* Subject Name */}
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: isComplete ? '#10b981' : '#f59e0b',
                          display: 'inline-block'
                        }}></span>
                        {item.subject_name}
                      </div>
                      
                      {/* Teacher Name */}
                      <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span style={{ fontSize: '10px' }}>👨‍🏫</span>
                        <span style={{ fontWeight: '500' }}>{item.teacher_name}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ marginBottom: '4px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '3px',
                          fontSize: '10px',
                          color: '#475569'
                        }}>
                          <span style={{ fontWeight: '600' }}>Progress</span>
                          <span style={{ fontWeight: '700' }}>{percentage}%</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '2px',
                          background: '#e2e8f0',
                          borderRadius: '1px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: isComplete 
                              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                              : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Submission Count */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '4px',
                        paddingTop: '4px',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Submitted
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: isComplete ? '#10b981' : '#f59e0b'
                        }}>
                          {item.submitted_count} / {item.total_students}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div style={{ marginTop: '4px' }}>
                        {isComplete ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: '#d1fae5',
                            color: '#065f46',
                            width: '100%',
                            justifyContent: 'center'
                          }}>
                            ✓ Complete
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: '#fef3c7',
                            color: '#92400e',
                            width: '100%',
                            justifyContent: 'center'
                          }}>
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detailed Marks Section */}
          {marks.length > 0 && (
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#2c3e50',
                marginBottom: '25px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e9ecef'
              }}>
                📊 Detailed Marks by Subject
              </h2>
              
              {Object.keys(marksBySubject).map((subjectName, subjectIndex) => (
                <div key={subjectName} style={{ 
                  marginBottom: subjectIndex < Object.keys(marksBySubject).length - 1 ? '35px' : '0'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '8px 8px 0 0',
                    marginBottom: '0'
                  }}>
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span>📖</span>
                      {subjectName}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '14px',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '12px'
                      }}>
                        {marksBySubject[subjectName].length} students
                      </span>
                    </h3>
                  </div>
                  
                  <div style={{ 
                    overflowX: 'auto',
                    border: '1px solid #e9ecef',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Student Code
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Student Name
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'center',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Mark
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Submitted By
                          </th>
                          <th style={{ 
                            padding: '14px 16px', 
                            textAlign: 'left',
                            borderBottom: '2px solid #dee2e6',
                            fontWeight: '600',
                            color: '#495057',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Submitted At
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {marksBySubject[subjectName].map((mark, markIndex) => (
                          <tr key={mark.mark_id} style={{
                            borderBottom: '1px solid #e9ecef',
                            background: markIndex % 2 === 0 ? 'white' : '#f8f9fa',
                            transition: 'background 0.2s'
                          }}>
                            <td style={{ 
                              padding: '14px 16px', 
                              fontFamily: 'monospace', 
                              color: '#495057',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {mark.student_code}
                            </td>
                            <td style={{ 
                              padding: '14px 16px', 
                              fontWeight: '500',
                              color: '#212529'
                            }}>
                              {mark.student_name}
                            </td>
                            <td style={{ 
                              padding: '14px 16px', 
                              textAlign: 'center'
                            }}>
                              <span style={{
                                display: 'inline-block',
                                minWidth: '50px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: '700',
                                fontSize: '15px',
                                background: mark.mark >= 50 
                                  ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                                  : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                                color: mark.mark >= 50 ? '#155724' : '#721c24',
                                border: `2px solid ${mark.mark >= 50 ? '#c3e6cb' : '#f5c6cb'}`
                              }}>
                                {mark.mark}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '14px 16px', 
                              color: '#6c757d',
                              fontSize: '13px'
                            }}>
                              👨‍🏫 {mark.teacher_name}
                            </td>
                            <td style={{ 
                              padding: '14px 16px', 
                              color: '#6c757d', 
                              fontSize: '13px'
                            }}>
                              🕒 {new Date(mark.submitted_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '14px 32px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a6268'}
              onMouseOut={(e) => e.target.style.background = '#6c757d'}
            >
              ← Back
            </button>
            
            {marks.length > 0 && (
              <button 
                onClick={handleApproveAll}
                disabled={approving || !allSubjectsComplete}
                style={{
                  padding: '14px 32px',
                  background: (approving || !allSubjectsComplete) ? '#6c757d' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (approving || !allSubjectsComplete) ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  opacity: (approving || !allSubjectsComplete) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: (approving || !allSubjectsComplete) ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)'
                }}
                onMouseOver={(e) => !approving && allSubjectsComplete && (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !approving && allSubjectsComplete && (e.target.style.transform = 'translateY(0)')}
              >
                {approving ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Approving...
                  </>
                ) : (
                  <>
                    ✓ Approve All Marks
                  </>
                )}
              </button>
            )}
          </div>
          
          {marks.length > 0 && !allSubjectsComplete && (
            <div style={{
              marginTop: '15px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#856404',
              background: '#fff3cd',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              ⚠️ You cannot approve marks until all teachers have submitted marks for all students
            </div>
          )}
          
          {marks.length > 0 && allSubjectsComplete && (
            <div style={{
              marginTop: '15px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#155724',
              background: '#d4edda',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              ✓ All teachers have submitted marks. You can now approve and generate the roster!
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default HomeroomApproval
