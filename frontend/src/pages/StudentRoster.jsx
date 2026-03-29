import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const StudentRoster = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [rosterData, setRosterData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Auto-generate if coming from dashboard
  useEffect(() => {
    if (location.state?.autoGenerate && location.state?.classId) {
      generateRoster(location.state.classId)
    }
  }, [location.state])

  const generateRoster = async (classId = null) => {
    const targetClassId = classId || user?.homeroom_class_id
    
    if (!targetClassId) {
      toast.error('No class assigned to this homeroom teacher')
      return
    }

    setLoading(true)
    try {
      // Get current year and semester from settings
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1

      console.log('Fetching roster for class:', targetClassId, 'year:', currentYearId, 'semester:', currentSemesterId)

      const response = await api.get(`/reports/roster/${targetClassId}?year_id=${currentYearId}&semester_id=${currentSemesterId}`)
      
      console.log('Roster response:', response.data)
      
      if (response.data.success) {
        // Sort students by rank
        const sortedStudents = [...response.data.students].sort((a, b) => a.rank - b.rank)
        setRosterData({
          ...response.data,
          students: sortedStudents
        })
        toast.success('Student roster generated successfully!')
      } else {
        toast.error(response.data.message || 'Failed to generate roster')
      }
    } catch (error) {
      console.error('Error generating roster:', error)
      toast.error(error.response?.data?.message || 'Failed to generate student roster')
    } finally {
      setLoading(false)
    }
  }

  const saveRoster = () => {
    if (!rosterData) {
      toast.error('No roster data to save')
      return
    }
    
    console.log('Starting save roster...')
    
    const grade = rosterData.class_info?.grade_number
    const section = rosterData.class_info?.section_name
    const filename = `Student_Roster_Grade_${grade}${section}_${new Date().toISOString().split('T')[0]}.html`

    console.log('Filename:', filename)

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Student Roster - Grade ${rosterData.class_info?.grade_number}${rosterData.class_info?.section_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: white;
    }
    .header {
      background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 0;
      border-radius: 8px 8px 0 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      border: 2px solid #4a90e2;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px 8px;
      text-align: center;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
      font-size: 11px;
    }
    .fail-row {
      background: #ffebee;
    }
    .pass-badge {
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 10px;
      color: white;
      background: #28a745;
    }
    .fail-badge {
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 10px;
      color: white;
      background: #dc3545;
    }
    .notes {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 5px 0; letter-spacing: 1px;">
      HINDE HIGH SCHOOL STUDENT ROSTER
    </h1>
    <div style="font-size: 16px; font-weight: 600; margin: 5px 0;">
      GRADE: ${rosterData.class_info?.grade_number}${rosterData.class_info?.section_name}
    </div>
    <div style="font-size: 14px; margin: 5px 0;">
      HOMEROOM TEACHER: ${rosterData.class_info?.homeroom_teacher?.toUpperCase() || 'N/A'}
    </div>
    <div style="font-size: 14px; margin: 5px 0;">
      ACADEMIC YEAR: ${rosterData.class_info?.year_name || '2018'} | SEMESTER: ${rosterData.class_info?.semester_name || '1st Semester'}
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>STUDENT CODE</th>
        <th>STUDENT NAME</th>
        <th>GENDER</th>
        <th colspan="5" style="background: #e3f2fd;">SUBJECTS</th>
        <th>TOTAL</th>
        <th>AVG</th>
        <th>RANK</th>
        <th>STATUS</th>
      </tr>
      <tr style="background: #f0f8ff;">
        <th></th>
        <th></th>
        <th></th>
        <th>MATHS</th>
        <th>ENG</th>
        <th>BIO</th>
        <th>CHEM</th>
        <th>PHY</th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${rosterData.students?.map(student => `
        <tr class="${student.status === 'FAIL' ? 'fail-row' : ''}">
          <td style="font-family: monospace;">${student.student_code || 'N/A'}</td>
          <td style="font-weight: 500; text-align: left;">${student.student_name}</td>
          <td>${student.gender?.charAt(0) || 'M'}</td>
          <td style="font-weight: bold;">${student.marks?.maths || '-'}</td>
          <td style="font-weight: bold;">${student.marks?.eng || '-'}</td>
          <td style="font-weight: bold;">${student.marks?.bio || '-'}</td>
          <td style="font-weight: bold;">${student.marks?.chem || '-'}</td>
          <td style="font-weight: bold;">${student.marks?.phy || '-'}</td>
          <td style="font-weight: bold; background: #f8f9fa;">${student.total || 0}</td>
          <td style="font-weight: bold;">${student.average || '0.0'}</td>
          <td style="font-weight: bold; background: #e8f5e8;">${student.rank || '-'}</td>
          <td>
            <span class="${student.status === 'PASS' ? 'pass-badge' : 'fail-badge'}">
              ${student.status || 'N/A'}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="notes">
    <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #333;">NOTE:</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <div style="margin-bottom: 8px;">☐ <strong>SUBJECT LEVEL TOTAL = 100</strong></div>
        <div style="margin-bottom: 8px;">☐ <strong>OVERALL TOTAL = 500</strong></div>
        <div style="margin-bottom: 8px;">☐ <strong>PASS MARK = 50%</strong></div>
      </div>
      <div>
        <div style="margin-bottom: 8px;">☐ <strong>Teachers have subject based department.</strong></div>
        <div style="margin-bottom: 8px;">☐ <strong>The subject will be assigned for one of the teacher from the department.</strong></div>
        <div style="margin-bottom: 8px;">☐ <strong>Homeroom Teacher:</strong> a teacher who collect student's mark from subject teachers and prepare a student roster.</div>
      </div>
    </div>
  </div>
</body>
</html>`

    console.log('HTML content length:', htmlContent.length)

    try {
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      console.log('Blob created:', blob.size, 'bytes')
      
      const url = URL.createObjectURL(blob)
      console.log('URL created:', url)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      console.log('Link created, appending to body...')
      document.body.appendChild(link)
      
      console.log('Clicking link...')
      link.click()
      
      console.log('Download triggered!')
      
      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        console.log('Cleanup complete')
      }, 100)
      
      toast.success('Roster file downloaded! Check your Downloads folder.')
    } catch (error) {
      console.error('Error during save:', error)
      toast.error('Failed to download roster: ' + error.message)
    }
  }

  const printRoster = () => {
    window.print()
  }

  return (
    <div className="student-roster-container" style={{ padding: '20px', minHeight: '100vh', background: '#f5f7fa' }}>
      {loading && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
            Generating Student Roster...
          </div>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}

      {!loading && !rosterData && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
            No roster data available
          </div>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Student Roster Report */}
      {rosterData && (
        <div className="roster-report" style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          fontFamily: 'Arial, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '0',
            borderRadius: '8px 8px 0 0'
          }}>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              margin: '0 0 5px 0',
              letterSpacing: '1px'
            }}>
              HINDE HIGH SCHOOL STUDENT ROSTER
            </h1>
            <div style={{ fontSize: '16px', fontWeight: '600', margin: '5px 0' }}>
              GRADE: {rosterData.class_info?.grade}{rosterData.class_info?.section}
            </div>
            <div style={{ fontSize: '14px', margin: '5px 0' }}>
              HOMEROOM TEACHER: {rosterData.class_info?.homeroom_teacher?.toUpperCase() || 'N/A'}
            </div>
            <div style={{ fontSize: '14px', margin: '5px 0' }}>
              ACADEMIC YEAR: {rosterData.class_info?.year_name || '2018'} | SEMESTER: {rosterData.class_info?.semester_name || '1st Semester'}
            </div>
          </div>

          {/* Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            border: '2px solid #4a90e2'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  STUDENT CODE
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  STUDENT NAME
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  GENDER
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  background: '#e3f2fd'
                }} colSpan="5">
                  SUBJECTS
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  TOTAL
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  AVG
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  RANK
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  STATUS
                </th>
              </tr>
              <tr style={{ background: '#f0f8ff' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  MATHS
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  ENG
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  BIO
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  CHEM
                </th>
                <th style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px 4px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  PHY
                </th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
              </tr>
            </thead>
            <tbody>
              {rosterData.students?.map((student, index) => (
                <tr key={student.student_id} style={{
                  background: student.status === 'FAIL' ? '#ffebee' : 'white'
                }}>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}>
                    {student.student_code || 'N/A'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    fontWeight: '500',
                    fontSize: '11px'
                  }}>
                    {student.student_name || `${student.first_name} ${student.last_name}`}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    {student.gender?.charAt(0) || 'M'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {student.marks?.maths || '-'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {student.marks?.eng || '-'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {student.marks?.bio || '-'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {student.marks?.chem || '-'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {student.marks?.phy || '-'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    background: '#f8f9fa'
                  }}>
                    {student.total || 0}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {student.average || '0.0'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    background: '#e8f5e8'
                  }}>
                    {student.rank || '-'}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      color: 'white',
                      background: student.status === 'PASS' ? '#28a745' : '#dc3545'
                    }}>
                      {student.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Notes Section */}
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              color: '#333'
            }}>
              NOTE:
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>SUBJECT LEVEL TOTAL = 100</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>OVERALL TOTAL = 500</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>PASS MARK = 50%</strong>
                </div>
              </div>
              
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>Teachers have subject based department.</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>The subject will be assigned for one of the teacher from the department.</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>Homeroom Teacher:</strong> a teacher who collect student's mark from subject teachers and prepare a student roster.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Bottom */}
          <div className="no-print" style={{
            marginTop: '30px',
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            paddingTop: '20px',
            borderTop: '2px solid #e9ecef'
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '12px 30px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a6268'}
              onMouseOut={(e) => e.target.style.background = '#6c757d'}
            >
              ← Back
            </button>
            
            <button
              onClick={saveRoster}
              style={{
                padding: '12px 30px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#0056b3'}
              onMouseOut={(e) => e.target.style.background = '#007bff'}
            >
              💾 Save
            </button>
            
            <button
              onClick={printRoster}
              style={{
                padding: '12px 30px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#218838'}
              onMouseOut={(e) => e.target.style.background = '#28a745'}
            >
              🖨️ Print
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .roster-report {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 20px !important;
          }
          
          body {
            background: white !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default StudentRoster