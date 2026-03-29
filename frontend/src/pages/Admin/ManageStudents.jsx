import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ManageStudents = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    student_name: '',
    gender: '',
    student_code: '',
    class_id: '',
    date_of_birth: ''
  })

  useEffect(() => {
    loadStudents()
    loadClasses()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/students')
      if (response.data.success) {
        setStudents(response.data.students)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      console.log('Submitting student data:', formData)
      const response = await api.post('/students', formData)
      console.log('Student creation response:', response.data)
      if (response.data.success) {
        toast.success('Student added successfully!')
        setShowForm(false)
        setFormData({
          student_name: '',
          gender: '',
          student_code: '',
          class_id: '',
          date_of_birth: ''
        })
        loadStudents()
      } else {
        toast.error(response.data.message || 'Failed to add student')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Failed to add student'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/students/${id}`)
      if (response.data.success) {
        toast.success('Student deleted successfully!')
        loadStudents()
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error(error.response?.data?.message || 'Failed to delete student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manage-container">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back
        </button>
        <h1>Manage Students</h1>
        <button onClick={() => setShowForm(!showForm)} className="add-button">
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </header>

      {showForm && (
        <div className="form-card">
          <h3>Add New Student</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Student Name</label>
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
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Student Code</label>
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
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.class_id} value={cls.class_id}>
                    Grade {cls.grade_number}{cls.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Code</th>
              <th>Gender</th>
              <th>Class</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.student_id}>
                <td>{student.student_id}</td>
                <td>{student.student_name}</td>
                <td>{student.student_code}</td>
                <td>{student.gender}</td>
                <td>Grade {student.grade_number}{student.section_name}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(student.student_id, student.student_name)}
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
      </div>
    </div>
  )
}

export default ManageStudents
