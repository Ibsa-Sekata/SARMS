import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ManageClasses = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [grades, setGrades] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classAssignments, setClassAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showClassForm, setShowClassForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [viewingAssignments, setViewingAssignments] = useState(false)
  const [editingHomeroom, setEditingHomeroom] = useState(false)
  const [newHomeroomTeacherId, setNewHomeroomTeacherId] = useState('')
  const [classFormData, setClassFormData] = useState({
    grade_id: '',
    section_id: '',
    homeroom_teacher_id: ''
  })
  const [assignmentFormData, setAssignmentFormData] = useState({
    class_id: '',
    teacher_id: '',
    subject_id: ''
  })

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
      if (response.data.success) {
        setGrades(response.data.grades)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
    }
  }

  const loadSections = async () => {
    try {
      const response = await api.get('/sections')
      if (response.data.success) {
        setSections(response.data.sections)
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await api.get('/teachers')
      if (response.data.success) {
        setTeachers(response.data.teachers)
      }
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects')
      if (response.data.success) {
        setSubjects(response.data.subjects)
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/classes', classFormData)
      if (response.data.success) {
        toast.success('Class created successfully!')
        setShowClassForm(false)
        setClassFormData({ grade_id: '', section_id: '', homeroom_teacher_id: '' })
        loadClasses()
      }
    } catch (error) {
      console.error('Error creating class:', error)
      toast.error(error.response?.data?.message || 'Failed to create class')
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
        
        // Refresh assignments if viewing them
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

  const handleUpdateHomeroomTeacher = async (classId, teacherId) => {
    try {
      const response = await api.put(`/classes/${classId}/homeroom`, { homeroom_teacher_id: teacherId })
      if (response.data.success) {
        toast.success('Homeroom teacher updated!')
        loadClasses()
      }
    } catch (error) {
      console.error('Error updating homeroom teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to update homeroom teacher')
    }
  }

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete ${className}? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/classes/${classId}`)
      if (response.data.success) {
        toast.success('Class deleted successfully!')
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
    if (!window.confirm('Are you sure you want to remove this teacher assignment?')) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/teacher-assignments/${assignmentId}`)
      if (response.data.success) {
        toast.success('Assignment removed successfully!')
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
        homeroom_teacher_id: newHomeroomTeacherId
      })
      
      if (response.data.success) {
        toast.success('Homeroom teacher updated successfully!')
        setEditingHomeroom(false)
        setNewHomeroomTeacherId('')
        
        // Refresh class data
        loadClasses()
        
        // Update selected class
        const updatedClass = { ...selectedClass }
        const teacher = teachers.find(t => t.teacher_id == newHomeroomTeacherId)
        updatedClass.homeroom_teacher = teacher?.teacher_name
        updatedClass.teacher_id = newHomeroomTeacherId
        setSelectedClass(updatedClass)
      }
    } catch (error) {
      console.error('Error updating homeroom teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to update homeroom teacher')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manage-container">
      <header className="page-header">
        <button onClick={() => {
          if (viewingAssignments) {
            setViewingAssignments(false)
            setSelectedClass(null)
          } else {
            navigate('/dashboard')
          }
        }} className="back-button">
          ← Back
        </button>
        <h1>{viewingAssignments ? `Assignments for Grade ${selectedClass?.grade_number}${selectedClass?.section_name}` : 'Manage Classes'}</h1>
        {!viewingAssignments && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowClassForm(!showClassForm)} className="add-button">
              {showClassForm ? 'Cancel' : '+ Create Class'}
            </button>
            <button onClick={() => setShowAssignmentForm(!showAssignmentForm)} className="add-button">
              {showAssignmentForm ? 'Cancel' : '+ Assign Teacher'}
            </button>
          </div>
        )}
        {viewingAssignments && (
          <button onClick={() => {
            setShowAssignmentForm(true)
            setAssignmentFormData({ ...assignmentFormData, class_id: selectedClass.class_id })
          }} className="add-button">
            + Assign Teacher to This Class
          </button>
        )}
      </header>

      {showClassForm && (
        <div className="form-card">
          <h3>Create New Class</h3>
          <form onSubmit={handleCreateClass}>
            <div className="form-group">
              <label>Grade</label>
              <select
                value={classFormData.grade_id}
                onChange={(e) => setClassFormData({ ...classFormData, grade_id: e.target.value })}
                required
              >
                <option value="">Select Grade</option>
                {grades.map(grade => (
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
                <option value="">Select Section</option>
                {sections.map(section => (
                  <option key={section.section_id} value={section.section_id}>
                    Section {section.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Homeroom Teacher (Required)</label>
              <select
                value={classFormData.homeroom_teacher_id}
                onChange={(e) => setClassFormData({ ...classFormData, homeroom_teacher_id: e.target.value })}
                required
              >
                <option value="">Select Homeroom Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.teacher_id} value={teacher.teacher_id}>
                    {teacher.teacher_name} - {teacher.department_name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </form>
        </div>
      )}

      {showAssignmentForm && (
        <div className="form-card">
          <h3>Assign Teacher to Class</h3>
          <form onSubmit={handleAssignTeacher}>
            <div className="form-group">
              <label>Class</label>
              <select
                value={assignmentFormData.class_id}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, class_id: e.target.value })}
                required
                disabled={viewingAssignments}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.class_id} value={cls.class_id}>
                    Grade {cls.grade_number}{cls.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Teacher</label>
              <select
                value={assignmentFormData.teacher_id}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, teacher_id: e.target.value })}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.teacher_id} value={teacher.teacher_id}>
                    {teacher.teacher_name} - {teacher.department_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select
                value={assignmentFormData.subject_id}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, subject_id: e.target.value })}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Teacher'}
            </button>
          </form>
        </div>
      )}

      {viewingAssignments ? (
        <div className="table-container">
          <h3>Teacher Assignments for Grade {selectedClass?.grade_number}{selectedClass?.section_name}</h3>
          
          {/* Homeroom Teacher Section */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '14px', color: '#495057' }}>Homeroom Teacher:</strong>
                {!editingHomeroom ? (
                  <span style={{ marginLeft: '10px', fontSize: '16px', color: '#212529' }}>
                    {selectedClass?.homeroom_teacher || 'Not assigned'}
                  </span>
                ) : (
                  <select
                    value={newHomeroomTeacherId}
                    onChange={(e) => setNewHomeroomTeacherId(e.target.value)}
                    style={{
                      marginLeft: '10px',
                      padding: '6px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Homeroom Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.teacher_name} - {teacher.department_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                {!editingHomeroom ? (
                  <button
                    onClick={() => {
                      setEditingHomeroom(true)
                      setNewHomeroomTeacherId(selectedClass?.teacher_id || '')
                    }}
                    className="action-button"
                    style={{ background: '#17a2b8', fontSize: '14px' }}
                  >
                    Change Homeroom Teacher
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleUpdateHomeroom}
                      className="action-button"
                      style={{ background: '#28a745', fontSize: '14px' }}
                      disabled={loading}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingHomeroom(false)
                        setNewHomeroomTeacherId('')
                      }}
                      className="action-button"
                      style={{ background: '#6c757d', fontSize: '14px' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject Teachers Section */}
          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Subject Teachers</h4>
          {loading ? (
            <p>Loading assignments...</p>
          ) : classAssignments.length === 0 ? (
            <p>No subject teachers assigned to this class yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classAssignments.map(assignment => (
                  <tr key={assignment.assignment_id}>
                    <td>{assignment.subject_name}</td>
                    <td>{assignment.teacher_name}</td>
                    <td>{assignment.department_name || 'N/A'}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                        className="action-button"
                        style={{ background: '#dc3545' }}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="table-container">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Class ID</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Homeroom Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.class_id}>
                    <td>{cls.class_id}</td>
                    <td>Grade {cls.grade_number}</td>
                    <td>Section {cls.section_name}</td>
                    <td>{cls.homeroom_teacher || 'Not assigned'}</td>
                    <td>
                      <button 
                        onClick={() => handleViewAssignments(cls)}
                        className="action-button"
                        style={{ marginRight: '5px', background: '#007bff' }}
                      >
                        View Assignments
                      </button>
                      <button 
                        onClick={() => handleDeleteClass(cls.class_id, `Grade ${cls.grade_number}${cls.section_name}`)}
                        className="action-button"
                        style={{ background: '#dc3545' }}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default ManageClasses
