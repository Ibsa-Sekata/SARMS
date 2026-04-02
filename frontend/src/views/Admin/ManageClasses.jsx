import { useState, useEffect, useMemo, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AdminPageLayout from '../../components/admin/AdminPageLayout'

const norm = (s) => String(s ?? '').trim().toLowerCase()

/** When subjects are not linked by department_id (legacy data) */
function resolveSubjectForTeacherLegacy(teacher, subjectsList) {
  if (!teacher) {
    return { subjectId: '', subjectName: '', warning: '' }
  }
  if (!teacher.department_id && !teacher.department_name) {
    return {
      subjectId: '',
      subjectName: '',
      warning: 'This teacher has no department. Set one under Teachers before assigning.',
    }
  }
  const dn = norm(teacher.department_name)
  if (dn) {
    const byName = subjectsList.find((s) => norm(s.subject_name) === dn)
    if (byName) {
      return { subjectId: String(byName.subject_id), subjectName: byName.subject_name, warning: '' }
    }
  }
  if (teacher.department_id) {
    const inDept = subjectsList
      .filter((s) => Number(s.department_id) === Number(teacher.department_id))
      .sort((a, b) => a.subject_name.localeCompare(b.subject_name))
    if (inDept.length === 1) {
      return { subjectId: String(inDept[0].subject_id), subjectName: inDept[0].subject_name, warning: '' }
    }
    const matchInDept = dn ? inDept.find((s) => norm(s.subject_name) === dn) : null
    if (matchInDept) {
      return { subjectId: String(matchInDept.subject_id), subjectName: matchInDept.subject_name, warning: '' }
    }
    if (inDept.length > 0) {
      return {
        subjectId: String(inDept[0].subject_id),
        subjectName: inDept[0].subject_name,
        warning:
          inDept.length > 1
            ? 'Several subjects share this department; using the first alphabetically until subjects are saved under the department.'
            : '',
      }
    }
  }
  if (dn) {
    const globalName = subjectsList.find((s) => norm(s.subject_name) === dn)
    if (globalName) {
      return {
        subjectId: String(globalName.subject_id),
        subjectName: globalName.subject_name,
        warning: 'Subject matched by name but is not linked to this department in the catalog.',
      }
    }
  }
  return {
    subjectId: '',
    subjectName: '',
    warning:
      'No subject found for this department. Add subjects under the department in Departments, or link subjects to the department.',
  }
}

/**
 * auto = single department subject (or legacy match); choose = admin must pick subject
 */
function getAssignmentSubjectState(teacher, subjectsList) {
  if (!teacher) {
    return { mode: 'none', subjectId: '', subjectName: '', options: [], warning: '' }
  }
  if (!teacher.department_id && !teacher.department_name) {
    return {
      mode: 'none',
      subjectId: '',
      subjectName: '',
      options: [],
      warning: 'This teacher has no department. Set one under Teachers before assigning.',
    }
  }

  const inDept = subjectsList
    .filter((s) => Number(s.department_id) === Number(teacher.department_id))
    .sort((a, b) => a.subject_name.localeCompare(b.subject_name))

  if (inDept.length === 1) {
    return {
      mode: 'auto',
      subjectId: String(inDept[0].subject_id),
      subjectName: inDept[0].subject_name,
      options: inDept,
      warning: '',
    }
  }
  if (inDept.length > 1) {
    return {
      mode: 'choose',
      subjectId: '',
      subjectName: '',
      options: inDept,
      warning: 'This department has several subjects — choose which one this teacher teaches for this class.',
    }
  }

  const legacy = resolveSubjectForTeacherLegacy(teacher, subjectsList)
  if (legacy.subjectId) {
    return {
      mode: 'auto',
      subjectId: legacy.subjectId,
      subjectName: legacy.subjectName,
      options: [],
      warning: legacy.warning,
    }
  }
  return {
    mode: 'none',
    subjectId: '',
    subjectName: '',
    options: [],
    warning: legacy.warning || 'No subjects found for this department.',
  }
}

const ManageClasses = () => {
  const [classes, setClasses] = useState([])
  const [grades, setGrades] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classAssignments, setClassAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showClassForm, setShowClassForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingClassId, setEditingClassId] = useState(null)
  const classFormAnchorRef = useRef(null)
  const assignmentFormAnchorRef = useRef(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [viewingAssignments, setViewingAssignments] = useState(false)
  const [editingHomeroom, setEditingHomeroom] = useState(false)
  const [newHomeroomTeacherId, setNewHomeroomTeacherId] = useState('')
  const [classFormData, setClassFormData] = useState({
    grade_id: '',
    section_id: '',
    homeroom_teacher_id: '',
  })
  const [assignmentFormData, setAssignmentFormData] = useState({
    class_id: '',
    teacher_id: '',
    subject_id: '',
  })

  const assignmentSubjectState = useMemo(() => {
    const teacher = teachers.find((t) => String(t.teacher_id) === String(assignmentFormData.teacher_id))
    return getAssignmentSubjectState(teacher, subjects)
  }, [teachers, subjects, assignmentFormData.teacher_id])

  useEffect(() => {
    loadClasses()
    loadGrades()
    loadSections()
    loadTeachers()
    loadSubjects()
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/classes')
      if (response.data.success) {
        setClasses(response.data.classes)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const loadGrades = async () => {
    try {
      const response = await api.get('/grades')
      if (response.data.success) setGrades(response.data.grades)
    } catch (error) {
      console.error('Error loading grades:', error)
    }
  }

  const loadSections = async () => {
    try {
      const response = await api.get('/sections')
      if (response.data.success) setSections(response.data.sections)
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await api.get('/teachers')
      if (response.data.success) setTeachers(response.data.teachers)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects')
      if (response.data.success) setSubjects(response.data.subjects)
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = editingClassId
        ? await api.put(`/classes/${editingClassId}`, classFormData)
        : await api.post('/classes', classFormData)
      if (response.data.success) {
        toast.success(editingClassId ? 'Class updated successfully!' : 'Class created successfully!')
        setShowClassForm(false)
        setEditingClassId(null)
        setClassFormData({ grade_id: '', section_id: '', homeroom_teacher_id: '' })
        loadClasses()
      }
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error(error.response?.data?.message || 'Failed to save class')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTeacher = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/teacher-assignments', assignmentFormData)
      if (response.data.success) {
        toast.success('Teacher assigned successfully!')
        setShowAssignmentForm(false)
        setAssignmentFormData({ class_id: '', teacher_id: '', subject_id: '' })
        loadSubjects()
        if (viewingAssignments && selectedClass) {
          loadClassAssignments(selectedClass.class_id)
        }
        loadClasses()
      }
    } catch (error) {
      console.error('Error assigning teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to assign teacher')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Delete ${className}? This cannot be undone.`)) return

    try {
      setLoading(true)
      const response = await api.delete(`/classes/${classId}`)
      if (response.data.success) {
        toast.success('Class deleted.')
        loadClasses()
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error(error.response?.data?.message || 'Failed to delete class')
    } finally {
      setLoading(false)
    }
  }

  const loadClassAssignments = async (classId) => {
    try {
      setLoading(true)
      const response = await api.get(`/teacher-assignments?class_id=${classId}`)
      if (response.data.success) {
        setClassAssignments(response.data.assignments)
      }
    } catch (error) {
      console.error('Error loading class assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleViewAssignments = (cls) => {
    setSelectedClass(cls)
    setViewingAssignments(true)
    loadClassAssignments(cls.class_id)
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this teacher assignment?')) return

    try {
      setLoading(true)
      const response = await api.delete(`/teacher-assignments/${assignmentId}`)
      if (response.data.success) {
        toast.success('Assignment removed.')
        loadClassAssignments(selectedClass.class_id)
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error.response?.data?.message || 'Failed to remove assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHomeroom = async () => {
    if (!newHomeroomTeacherId) {
      toast.error('Please select a homeroom teacher')
      return
    }

    try {
      setLoading(true)
      const response = await api.put(`/classes/${selectedClass.class_id}/homeroom`, {
        homeroom_teacher_id: newHomeroomTeacherId,
      })

      if (response.data.success) {
        toast.success('Homeroom teacher updated.')
        setEditingHomeroom(false)
        setNewHomeroomTeacherId('')
        loadClasses()
        const teacher = teachers.find((t) => t.teacher_id == newHomeroomTeacherId)
        setSelectedClass((prev) => ({
          ...prev,
          homeroom_teacher: teacher?.teacher_name,
          teacher_id: newHomeroomTeacherId,
        }))
      }
    } catch (error) {
      console.error('Error updating homeroom teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to update homeroom teacher')
    } finally {
      setLoading(false)
    }
  }

  const layoutTitle = viewingAssignments
    ? `Grade ${selectedClass?.grade_number}${selectedClass?.section_name} · Assignments`
    : 'Classes & assignments'

  const layoutSubtitle = viewingAssignments
    ? 'Homeroom teacher and subject teachers linked to this class.'
    : 'Create grade/section combinations, assign homeroom teachers, and map subject teachers.'

  const openClassFormAtTop = () => {
    setShowAssignmentForm(false)
    setShowClassForm((prev) => {
      const next = !prev
      if (!next) {
        setEditingClassId(null)
        setClassFormData({ grade_id: '', section_id: '', homeroom_teacher_id: '' })
      }
      if (next) {
        setTimeout(
          () => classFormAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          0
        )
      }
      return next
    })
  }

  const startEditClass = (cls) => {
    setEditingClassId(cls.class_id)
    setClassFormData({
      grade_id: cls.grade_id ? String(cls.grade_id) : '',
      section_id: cls.section_id ? String(cls.section_id) : '',
      homeroom_teacher_id: cls.homeroom_teacher_id ? String(cls.homeroom_teacher_id) : '',
    })
    setShowAssignmentForm(false)
    setShowClassForm(true)
    setTimeout(
      () => classFormAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      0
    )
  }

  const openAssignmentFormAtTop = (presetClassId = '') => {
    setShowClassForm(false)
    if (presetClassId) {
      setAssignmentFormData({
        class_id: String(presetClassId),
        teacher_id: '',
        subject_id: '',
      })
    }
    setShowAssignmentForm((prev) => {
      const next = presetClassId ? true : !prev
      if (next) {
        setTimeout(
          () => assignmentFormAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          0
        )
      }
      return next
    })
  }

  return (
    <AdminPageLayout
      title={layoutTitle}
      subtitle={layoutSubtitle}
      onBack={
        viewingAssignments
          ? () => {
              setViewingAssignments(false)
              setSelectedClass(null)
            }
          : undefined
      }
      actions={
        viewingAssignments ? (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              openAssignmentFormAtTop(selectedClass.class_id)
            }}
          >
            + Assign to this class
          </button>
        ) : (
          <>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={openClassFormAtTop}
            >
              {showClassForm ? 'Close' : '+ Create class'}
            </button>
            <button type="button" className="admin-btn" onClick={() => openAssignmentFormAtTop()}>
              {showAssignmentForm ? 'Close' : '+ Assign teacher'}
            </button>
          </>
        )
      }
    >
      <div ref={classFormAnchorRef} />
      {showClassForm && (
        <div className="admin-card">
          <h3 className="admin-card__title">{editingClassId ? 'Edit class' : 'Create class'}</h3>
          <form onSubmit={handleCreateClass}>
            <div className="admin-form-grid admin-form-grid--2">
              <div className="form-group">
                <label>Grade</label>
                <select
                  value={classFormData.grade_id}
                  onChange={(e) => setClassFormData({ ...classFormData, grade_id: e.target.value })}
                  required
                >
                  <option value="">Select grade</option>
                  {grades.map((grade) => (
                    <option key={grade.grade_id} value={grade.grade_id}>
                      Grade {grade.grade_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <select
                  value={classFormData.section_id}
                  onChange={(e) => setClassFormData({ ...classFormData, section_id: e.target.value })}
                  required
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section.section_id} value={section.section_id}>
                      Section {section.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Homeroom teacher</label>
                <select
                  value={classFormData.homeroom_teacher_id}
                  onChange={(e) =>
                    setClassFormData({ ...classFormData, homeroom_teacher_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.teacher_name} — {teacher.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-actions-cell">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving…' : editingClassId ? 'Update class' : 'Create class'}
              </button>
              {editingClassId && (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => {
                    setEditingClassId(null)
                    setShowClassForm(false)
                    setClassFormData({ grade_id: '', section_id: '', homeroom_teacher_id: '' })
                  }}
                  disabled={loading}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div ref={assignmentFormAnchorRef} />
      {showAssignmentForm && (
        <div className="admin-card">
          <h3 className="admin-card__title">Assign teacher to class</h3>
          <form onSubmit={handleAssignTeacher}>
            <div className="admin-form-grid admin-form-grid--2">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Class</label>
                <select
                  value={assignmentFormData.class_id}
                  onChange={(e) =>
                    setAssignmentFormData({ ...assignmentFormData, class_id: e.target.value })
                  }
                  required
                  disabled={viewingAssignments}
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
              <div className="form-group">
                <label>Teacher</label>
                <select
                  value={assignmentFormData.teacher_id}
                  onChange={(e) => {
                    const teacherId = e.target.value
                    if (!teacherId) {
                      setAssignmentFormData({
                        ...assignmentFormData,
                        teacher_id: '',
                        subject_id: '',
                      })
                      return
                    }
                    const teacher = teachers.find((t) => String(t.teacher_id) === String(teacherId))
                    const st = getAssignmentSubjectState(teacher, subjects)
                    setAssignmentFormData({
                      ...assignmentFormData,
                      teacher_id: teacherId,
                      subject_id: st.mode === 'auto' ? st.subjectId : '',
                    })
                  }}
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.teacher_name} — {teacher.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Subject</label>
                {!assignmentFormData.teacher_id ? (
                  <p className="admin-muted" style={{ margin: 0 }}>
                    Select a teacher first.
                  </p>
                ) : assignmentSubjectState.mode === 'choose' ? (
                  <>
                    <select
                      value={assignmentFormData.subject_id}
                      onChange={(e) =>
                        setAssignmentFormData({
                          ...assignmentFormData,
                          subject_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select subject for this teacher</option>
                      {assignmentSubjectState.options.map((s) => (
                        <option key={s.subject_id} value={s.subject_id}>
                          {s.subject_name}
                        </option>
                      ))}
                    </select>
                    {assignmentSubjectState.warning && (
                      <p className="admin-muted" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                        {assignmentSubjectState.warning}
                      </p>
                    )}
                  </>
                ) : assignmentSubjectState.mode === 'auto' ? (
                  <>
                    <div
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-muted, #f4f5f7)',
                        fontSize: '0.95rem',
                      }}
                    >
                      <strong>{assignmentSubjectState.subjectName}</strong>
                      <span className="admin-muted" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                        (only subject in this department)
                      </span>
                    </div>
                    {assignmentSubjectState.warning && (
                      <p className="admin-muted" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                        {assignmentSubjectState.warning}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="admin-muted" style={{ margin: 0 }}>
                    {assignmentSubjectState.warning || 'Cannot determine subject.'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !assignmentFormData.subject_id}
            >
              {loading ? 'Saving…' : 'Save assignment'}
            </button>
          </form>
        </div>
      )}

      {viewingAssignments ? (
        <div className="admin-table-shell">
          <div className="admin-homeroom-panel">
            <div className="admin-homeroom-panel__row">
              <div>
                <div className="admin-muted" style={{ fontSize: '0.72rem', marginBottom: '0.25rem' }}>
                  Homeroom teacher
                </div>
                {!editingHomeroom ? (
                  <strong>{selectedClass?.homeroom_teacher || 'Not assigned'}</strong>
                ) : (
                  <select
                    value={newHomeroomTeacherId}
                    onChange={(e) => setNewHomeroomTeacherId(e.target.value)}
                    style={{
                      marginTop: '0.35rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                      maxWidth: '320px',
                    }}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.teacher_name} — {teacher.department_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="admin-actions-cell">
                {!editingHomeroom ? (
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      setEditingHomeroom(true)
                      setNewHomeroomTeacherId(selectedClass?.teacher_id || '')
                    }}
                  >
                    Change homeroom
                  </button>
                ) : (
                  <>
                    <button type="button" className="admin-btn admin-btn--primary" onClick={handleUpdateHomeroom} disabled={loading}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() => {
                        setEditingHomeroom(false)
                        setNewHomeroomTeacherId('')
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="admin-section-label">Subject teachers</div>
          <div className="admin-table-scroll">
            {loading ? (
              <p className="admin-muted" style={{ padding: '1rem 1.25rem' }}>
                Loading assignments…
              </p>
            ) : classAssignments.length === 0 ? (
              <p className="admin-muted" style={{ padding: '1rem 1.25rem' }}>
                No subject teachers assigned yet.
              </p>
            ) : (
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th style={{ width: '1%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classAssignments.map((assignment) => (
                    <tr key={assignment.assignment_id}>
                      <td>
                        <strong>{assignment.subject_name}</strong>
                      </td>
                      <td>{assignment.teacher_name}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-table-shell">
          <div className="admin-table-shell__caption">
            {loading && !classes.length ? 'Loading…' : `${classes.length} class${classes.length === 1 ? '' : 'es'}`}
          </div>
          <div className="admin-table-scroll">
            {loading && !classes.length ? null : (
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Grade</th>
                    <th>Section</th>
                    <th>Homeroom</th>
                    <th style={{ width: '1%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.class_id}>
                      <td>
                        <span className="admin-id-badge">{cls.class_id}</span>
                      </td>
                      <td>
                        <strong>Grade {cls.grade_number}</strong>
                      </td>
                      <td>Section {cls.section_name}</td>
                      <td>{cls.homeroom_teacher || '—'}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => startEditClass(cls)}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            onClick={() => handleViewAssignments(cls)}
                          >
                            Assignments
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            onClick={() =>
                              handleDeleteClass(cls.class_id, `Grade ${cls.grade_number}${cls.section_name}`)
                            }
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
            )}
          </div>
          {!loading && classes.length === 0 && (
            <p className="admin-muted" style={{ padding: '1.5rem 1.25rem', margin: 0 }}>
              No classes yet. Create a class to enrol students and assign teachers.
            </p>
          )}
        </div>
      )}
    </AdminPageLayout>
  )
}

export default ManageClasses
