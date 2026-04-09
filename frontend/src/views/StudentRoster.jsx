import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTeacherClass } from '../contexts/TeacherClassContext'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

/** Backend sends subjects[]; legacy responses used fixed keys maths, eng, … */
const LEGACY_ROSTER_SUBJECTS = [
  { id: 'maths', name: 'Mathematics' },
  { id: 'eng', name: 'English' },
  { id: 'bio', name: 'Biology' },
  { id: 'chem', name: 'Chemistry' },
  { id: 'phy', name: 'Physics' },
]

function getRosterSubjectColumns(rosterData) {
  if (!rosterData) return []
  if (Array.isArray(rosterData.subjects) && rosterData.subjects.length > 0) {
    return rosterData.subjects.map((s) => ({
      id: String(s.subject_id),
      name: s.subject_name,
    }))
  }
  const sample = rosterData.students?.[0]?.marks
  if (sample && Object.prototype.hasOwnProperty.call(sample, 'maths')) {
    return LEGACY_ROSTER_SUBJECTS
  }
  return []
}

function displayMark(student, subjectId) {
  const raw = student.marks?.[subjectId]
  if (raw === null || raw === undefined) return '-'
  return raw
}

function subjectHeaderLabel(name) {
  if (!name) return '—'
  const n = String(name).trim()
  return n.length <= 12 ? n.toUpperCase() : n
}

const StudentRoster = () => {
  const { user } = useAuth()
  const {
    homeroomToolsForSelection,
    loading: classLoading,
    assignments,
    setSelectedClass,
  } = useTeacherClass()
  const location = useLocation()
  const navigate = useNavigate()
  const [rosterData, setRosterData] = useState(null)
  const [snapshotMeta, setSnapshotMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStored, setLoadingStored] = useState(false)
  /** Prevents duplicate auto-generate for the same navigation (e.g. React Strict Mode) */
  const autoGenerateHandledKeyRef = useRef(null)
  const rosterGenerateInFlightRef = useRef(false)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'teacher' || !user.is_homeroom_teacher) {
      navigate('/dashboard', { replace: true })
      return
    }
    if (classLoading) return

    const hid = user.homeroom_class_id
    if (!hid) {
      toast.error('No homeroom class assigned to your account.')
      navigate('/dashboard', { replace: true })
      return
    }

    if (homeroomToolsForSelection) return

    const row = assignments.find((a) => Number(a.class_id) === Number(hid))
    if (row) {
      setSelectedClass(row)
      return
    }

    toast.error(
      'Your homeroom class is not linked to your subject assignments. Contact an administrator.'
    )
    navigate('/dashboard', { replace: true })
  }, [
    user,
    classLoading,
    homeroomToolsForSelection,
    assignments,
    setSelectedClass,
    navigate,
  ])

  const generateRoster = useCallback(async (classId = null) => {
    const targetClassId = classId || user?.homeroom_class_id

    if (!targetClassId) {
      toast.error('No class assigned to this homeroom teacher')
      return
    }

    if (rosterGenerateInFlightRef.current) {
      return
    }
    rosterGenerateInFlightRef.current = true

    setLoading(true)
    try {
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1

      const response = await api.get(
        `/reports/roster/${targetClassId}?year_id=${currentYearId}&semester_id=${currentSemesterId}`
      )

      if (response.data.success) {
        const rawStudents = Array.isArray(response.data.students) ? response.data.students : []
        const sortedStudents = [...rawStudents].sort((a, b) => a.rank - b.rank)
        const { snapshot_saved_at: _saved, ...rest } = response.data
        setRosterData({
          ...rest,
          students: sortedStudents,
        })
        setSnapshotMeta(
          response.data.snapshot_saved_at
            ? { generated_at: response.data.snapshot_saved_at }
            : null
        )
        if (sortedStudents.length > 0) {
          toast.success(
            response.data.snapshot_saved_at
              ? 'Student roster generated and saved on the server for this class and term.'
              : 'Student roster generated successfully.'
          )
        } else {
          toast('Roster created, but there are no students in this class for the selected term.', {
            icon: 'ℹ️',
          })
        }
        const cleared = response.data.marks_cleared
        if (cleared > 0) {
          toast.success(
            `Removed ${cleared} mark record${cleared === 1 ? '' : 's'} for this class and term. Subject teachers can enter marks again.`,
            { duration: 6000 }
          )
        }
      } else {
        toast.error(response.data.message || 'Failed to generate roster')
      }
    } catch (error) {
      console.error('Error generating roster:', error)
      toast.error(error.response?.data?.message || 'Failed to generate student roster')
    } finally {
      rosterGenerateInFlightRef.current = false
      setLoading(false)
    }
  }, [user?.homeroom_class_id])

  const loadStoredRoster = useCallback(async () => {
    const targetClassId = user?.homeroom_class_id
    if (!targetClassId) {
      toast.error('No class assigned to this homeroom teacher')
      return
    }
    setLoadingStored(true)
    try {
      const settingsResponse = await api.get('/settings')
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1

      const response = await api.get(
        `/reports/roster/${targetClassId}/stored?year_id=${currentYearId}&semester_id=${currentSemesterId}`
      )

      if (response.data.success) {
        const { snapshot_meta, ...payload } = response.data
        const rawStudents = Array.isArray(payload.students) ? payload.students : []
        const sortedStudents = [...rawStudents].sort((a, b) => a.rank - b.rank)
        setRosterData({ ...payload, students: sortedStudents })
        setSnapshotMeta(snapshot_meta || null)
        toast.success('Loaded saved roster from the server.')
      } else {
        toast.error(response.data.message || 'No saved roster found')
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to load saved roster'
      toast.error(msg)
    } finally {
      setLoadingStored(false)
    }
  }, [user?.homeroom_class_id])

  /** Only Dashboard "Generate roster" passes this — sidebar opens /roster without auto-run */
  useEffect(() => {
    if (!homeroomToolsForSelection || classLoading) return
    if (!location.state?.autoGenerate || !location.state?.classId) return

    const cid = location.state.classId
    if (Number(cid) !== Number(user?.homeroom_class_id)) return

    if (autoGenerateHandledKeyRef.current === location.key) return
    autoGenerateHandledKeyRef.current = location.key

    navigate('/roster', { replace: true, state: {} })
    void generateRoster(cid)
  }, [
    location.state,
    location.key,
    homeroomToolsForSelection,
    classLoading,
    user?.homeroom_class_id,
    generateRoster,
    navigate,
  ])

  const saveRoster = () => {
    if (!rosterData) {
      toast.error('No roster data to save')
      return
    }

    const escapeHtml = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    const subjectCols = getRosterSubjectColumns(rosterData)
    const subColspan = Math.max(subjectCols.length, 1)
    const maxTotalNote = subjectCols.length * 100
    const subjectHeaderCells = subjectCols.length
      ? subjectCols
          .map(
            (col) =>
              `<th title="${escapeHtml(col.name)}">${escapeHtml(subjectHeaderLabel(col.name))}</th>`
          )
          .join('')
      : '<th>—</th>'

    const grade = rosterData.class_info?.grade_number
    const section = rosterData.class_info?.section_name
    const filename = `Student_Roster_Grade_${grade}${section}_${new Date().toISOString().split('T')[0]}.html`

    const studentRows =
      rosterData.students
        ?.map((student) => {
          const marksCells = subjectCols.length
            ? subjectCols
                .map(
                  (col) =>
                    `<td style="font-weight: bold;">${escapeHtml(String(displayMark(student, col.id)))}</td>`
                )
                .join('')
            : '<td>—</td>'
          const failRow = student.status === 'FAIL' ? 'fail-row' : ''
          const statusClass =
            student.status === 'PASS'
              ? 'pass-badge'
              : student.status === 'FAIL'
                ? 'fail-badge'
                : 'na-badge'
          return `
        <tr class="${failRow}">
          <td style="font-family: monospace;">${escapeHtml(student.student_code || 'N/A')}</td>
          <td style="font-weight: 500; text-align: left;">${escapeHtml(student.student_name || '')}</td>
          <td>${escapeHtml(student.gender?.charAt(0) || 'M')}</td>
          ${marksCells}
          <td style="font-weight: bold; background: #f8f9fa;">${student.total ?? 0}</td>
          <td style="font-weight: bold;">${student.average ?? '0.0'}</td>
          <td style="font-weight: bold; background: #e8f5e8;">${student.rank ?? '-'}</td>
          <td>
            <span class="${statusClass}">
              ${escapeHtml(student.status || 'N/A')}
            </span>
          </td>
        </tr>`
        })
        .join('') ?? ''

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
    .na-badge {
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 10px;
      color: white;
      background: #6c757d;
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
      STUDENT ROSTER
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
        <th colspan="${subColspan}" style="background: #e3f2fd;">SUBJECTS</th>
        <th>TOTAL</th>
        <th>AVG</th>
        <th>RANK</th>
        <th>STATUS</th>
      </tr>
      <tr style="background: #f0f8ff;">
        <th></th>
        <th></th>
        <th></th>
        ${subjectHeaderCells}
        <th></th>
        <th></th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${studentRows}
    </tbody>
  </table>
  
  <div class="notes">
    <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #333;">NOTE:</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <div style="margin-bottom: 8px;">☐ <strong>SUBJECT LEVEL TOTAL = 100</strong></div>
        <div style="margin-bottom: 8px;">☐ <strong>OVERALL MAX = ${maxTotalNote || '—'} (100 per subject)</strong></div>
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

  const rosterSubjectCols = getRosterSubjectColumns(rosterData)
  const rosterSubjectColspan = Math.max(rosterSubjectCols.length, 1)
  const rosterMaxTotalNote = rosterSubjectCols.length * 100

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
          <div style={{ fontSize: '18px', color: '#333', marginBottom: '10px', fontWeight: 600 }}>
            Student roster
          </div>
          <div style={{ fontSize: '15px', color: '#666', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px' }}>
            Generate the roster after marks are approved for this term. Use the button below — opening this page does not
            generate automatically.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => generateRoster()}
              disabled={loadingStored}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loadingStored ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                opacity: loadingStored ? 0.7 : 1,
              }}
            >
              Generate student roster
            </button>
            <button
              type="button"
              onClick={() => loadStoredRoster()}
              disabled={loadingStored}
              style={{
                padding: '12px 24px',
                background: '#0f766e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loadingStored ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              {loadingStored ? 'Loading…' : 'Load saved roster'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Back to Dashboard
            </button>
          </div>
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
              STUDENT ROSTER
            </h1>
            <div style={{ fontSize: '16px', fontWeight: '600', margin: '5px 0' }}>
              GRADE: {rosterData.class_info?.grade_number}
              {rosterData.class_info?.section_name}
            </div>
            <div style={{ fontSize: '14px', margin: '5px 0' }}>
              HOMEROOM TEACHER: {rosterData.class_info?.homeroom_teacher?.toUpperCase() || 'N/A'}
            </div>
            <div style={{ fontSize: '14px', margin: '5px 0' }}>
              ACADEMIC YEAR: {rosterData.class_info?.year_name || '2018'} | SEMESTER: {rosterData.class_info?.semester_name || '1st Semester'}
            </div>
            {snapshotMeta?.generated_at && (
              <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.95 }}>
                Server copy saved:{' '}
                {new Date(snapshotMeta.generated_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="roster-table-scroll">
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
                }} colSpan={rosterSubjectColspan}>
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
                {rosterSubjectCols.length === 0 ? (
                  <th
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '10px',
                    }}
                  >
                    —
                  </th>
                ) : (
                  rosterSubjectCols.map((col) => (
                    <th
                      key={col.id}
                      title={col.name}
                      style={{
                        border: '1px solid #ddd',
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        maxWidth: '96px',
                        lineHeight: 1.2,
                      }}
                    >
                      {subjectHeaderLabel(col.name)}
                    </th>
                  ))
                )}
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
                <th style={{ border: '1px solid #ddd', padding: '8px', background: 'transparent' }}></th>
              </tr>
            </thead>
            <tbody>
              {rosterData.students?.map((student) => (
                <tr
                  key={student.student_id}
                  style={{
                    background: student.status === 'FAIL' ? '#ffebee' : 'white',
                  }}
                >
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {student.student_code || 'N/A'}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      fontWeight: '500',
                      fontSize: '11px',
                    }}
                  >
                    {student.student_name || `${student.first_name} ${student.last_name}`}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontSize: '11px',
                    }}
                  >
                    {student.gender?.charAt(0) || 'M'}
                  </td>
                  {rosterSubjectCols.length === 0 ? (
                    <td
                      style={{
                        border: '1px solid #ddd',
                        padding: '10px 8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '11px',
                      }}
                    >
                      —
                    </td>
                  ) : (
                    rosterSubjectCols.map((col) => (
                      <td
                        key={`${student.student_id}-${col.id}`}
                        style={{
                          border: '1px solid #ddd',
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '11px',
                        }}
                      >
                        {displayMark(student, col.id)}
                      </td>
                    ))
                  )}
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      background: '#f8f9fa',
                    }}
                  >
                    {student.total ?? 0}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    {student.average ?? '0.0'}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      background: '#e8f5e8',
                    }}
                  >
                    {student.rank ?? '-'}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontSize: '11px',
                    }}
                  >
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        color: 'white',
                        background:
                          student.status === 'PASS'
                            ? '#28a745'
                            : student.status === 'FAIL'
                              ? '#dc3545'
                              : '#6c757d',
                      }}
                    >
                      {student.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* end roster-table-scroll */}

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
            
            <div className="roster-notes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>SUBJECT LEVEL TOTAL = 100</strong>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>☐</span>
                  <strong>
                    OVERALL MAX = {rosterMaxTotalNote || '—'} (100 per subject)
                  </strong>
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
          <div className="no-print roster-actions" style={{
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
              type="button"
              onClick={() => loadStoredRoster()}
              disabled={loadingStored}
              style={{
                padding: '12px 30px',
                background: '#0f766e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loadingStored ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                opacity: loadingStored ? 0.75 : 1,
              }}
            >
              {loadingStored ? 'Loading…' : 'Load saved roster'}
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