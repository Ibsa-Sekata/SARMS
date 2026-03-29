import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

const AcademicSettings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentContext, setCurrentContext] = useState(null)
  const [years, setYears] = useState([])
  const [formData, setFormData] = useState({
    year_name: '',
    semester_id: 1
  })

  useEffect(() => {
    loadCurrentContext()
    loadYears()
  }, [])

  const loadCurrentContext = async () => {
    try {
      console.log('Loading current context...')
      const response = await api.get('/settings/context')
      console.log('Context response:', response.data)
      if (response.data.success) {
        setCurrentContext(response.data.context)
        setFormData({
          year_name: response.data.context.year_name !== 'Not Set' ? response.data.context.year_name : '',
          semester_id: response.data.context.semester_id
        })
      }
    } catch (error) {
      console.error('Error loading context:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load current academic context'
      toast.error(errorMessage)
    }
  }

  const loadYears = async () => {
    try {
      const response = await api.get('/settings/years')
      if (response.data.success) {
        setYears(response.data.years)
      }
    } catch (error) {
      console.error('Error loading years:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate year format (should be a 4-digit number)
    const yearNum = parseInt(formData.year_name)
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      toast.error('Please enter a valid year (e.g., 2024)')
      return
    }

    try {
      setLoading(true)
      console.log('Submitting context update:', formData)
      const response = await api.put('/settings/context', formData)
      console.log('Update response:', response.data)
      if (response.data.success) {
        toast.success('Academic context updated successfully!')
        loadCurrentContext()
        loadYears() // Reload years list to show newly created year
      }
    } catch (error) {
      console.error('Error updating context:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Failed to update context'
      toast.error(errorMessage)
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
        <h1>Academic Settings</h1>
      </header>

      <div className="settings-container">
        <div className="current-context-card">
          <h2>Current Academic Context</h2>
          {currentContext ? (
            <div className="context-display">
              <div className="context-item">
                <span className="context-label">Academic Year:</span>
                <span className="context-value">{currentContext.year_name}</span>
              </div>
              <div className="context-item">
                <span className="context-label">Semester:</span>
                <span className="context-value">{currentContext.semester_name}</span>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div className="form-card">
          <h3>Update Academic Context</h3>
          <p className="form-description">
            Enter the academic year and select the semester. If the year doesn't exist, 
            it will be created automatically.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Academic Year</label>
              <input
                type="text"
                placeholder="Enter year (e.g., 2024)"
                value={formData.year_name}
                onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                required
                maxLength="4"
                pattern="[0-9]{4}"
                title="Please enter a 4-digit year"
              />
              {years.length > 0 && (
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  Existing years: {years.map(y => y.year_name).join(', ')}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Semester</label>
              <select
                value={formData.semester_id}
                onChange={(e) => setFormData({ ...formData, semester_id: parseInt(e.target.value) })}
                required
              >
                <option value={1}>1st Semester</option>
                <option value={2}>2nd Semester</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Updating...' : 'Update Academic Context'}
              </button>
            </div>
          </form>
        </div>

        <div className="info-card">
          <h3>ℹ️ Important Information</h3>
          <ul>
            <li>Enter the academic year as a 4-digit number (e.g., 2024, 2025)</li>
            <li>If the year doesn't exist, it will be created automatically</li>
            <li>Select either 1st Semester or 2nd Semester</li>
            <li>The academic year and semester determine which data is displayed and entered</li>
            <li>Teachers will enter marks for the current semester and year</li>
            <li>Reports will be generated for the current academic context</li>
            <li>Changing the context does not delete any data - it only changes what is active</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AcademicSettings
