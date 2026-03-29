import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ManageTeachers = () => {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    teacher_name: '',
    email: '',
    department_id: '',
    username: '',
    password: ''
  })

  useEffect(() => {
    loadTeachers()
    loadDepartments()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/teachers')
      if (response.data.success) {
        setTeachers(response.data.teachers)
      }
    } catch (error) {
      console.error('Error loading teachers:', error)
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments')
      if (response.data.success) {
        setDepartments(response.data.departments)
      }
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      console.log('Submitting teacher data:', formData)
      const response = await api.post('/teachers', formData)
      console.log('Teacher creation response:', response.data)
      if (response.data.success) {
        toast.success('Teacher added successfully!')
        setShowForm(false)
        setFormData({
          teacher_name: '',
          email: '',
          department_id: '',
          username: '',
          password: ''
        })
        loadTeachers()
      } else {
        toast.error(response.data.message || 'Failed to add teacher')
      }
    } catch (error) {
      console.error('Error adding teacher:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Failed to add teacher'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete teacher "${name}"? This will also delete their user account. This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/teachers/${id}`)
      if (response.data.success) {
        toast.success('Teacher deleted successfully!')
        loadTeachers()
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to delete teacher')
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
        <h1>Manage Teachers</h1>
        <button onClick={() => setShowForm(!showForm)} className="add-button">
          {showForm ? 'Cancel' : '+ Add Teacher'}
        </button>
      </header>

      {showForm && (
        <div className="form-card">
          <h3>Add New Teacher</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Teacher Name</label>
              <input
                type="text"
                value={formData.teacher_name}
                onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Teacher'}
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
              <th>Email</th>
              <th>Department</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => (
              <tr key={teacher.teacher_id}>
                <td>{teacher.teacher_id}</td>
                <td>{teacher.teacher_name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.department_name}</td>
                <td>{teacher.username}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(teacher.teacher_id, teacher.teacher_name)}
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

export default ManageTeachers
