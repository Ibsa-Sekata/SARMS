import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ManageDepartments = () => {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    department_name: ''
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      console.log('Loading departments...')
      const response = await api.get('/departments')
      console.log('Departments response:', response.data)
      if (response.data.success) {
        setDepartments(response.data.departments)
        console.log('Departments loaded:', response.data.departments.length)
      } else {
        toast.error(response.data.message || 'Failed to load departments')
      }
    } catch (error) {
      console.error('Error loading departments:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load departments'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.post('/departments', formData)
      if (response.data.success) {
        toast.success('Department added successfully!')
        setShowForm(false)
        setFormData({ department_name: '' })
        loadDepartments()
      }
    } catch (error) {
      console.error('Error adding department:', error)
      toast.error(error.response?.data?.message || 'Failed to add department')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/departments/${id}`)
      if (response.data.success) {
        toast.success('Department deleted successfully!')
        loadDepartments()
      }
    } catch (error) {
      console.error('Error deleting department:', error)
      toast.error(error.response?.data?.message || 'Failed to delete department')
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
        <h1>Manage Departments</h1>
        <button onClick={() => setShowForm(!showForm)} className="add-button">
          {showForm ? 'Cancel' : '+ Add Department'}
        </button>
      </header>

      {showForm && (
        <div className="form-card">
          <h3>Add New Department</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Department Name</label>
              <input
                type="text"
                value={formData.department_name}
                onChange={(e) => setFormData({ department_name: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Department'}
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.department_id}>
                <td>{dept.department_id}</td>
                <td>{dept.department_name}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(dept.department_id, dept.department_name)}
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

export default ManageDepartments
