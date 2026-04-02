import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/** @param {{ variant: 'admin' | 'teacher' }} props */
const Login = ({ variant }) => {
  const isAdmin = variant === 'admin'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(formData.username, formData.password, {
      expectedRole: isAdmin ? 'admin' : 'teacher',
    })

    if (result.success) {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="login-app">
      <div className="login-hero" aria-hidden="false">
        <div className="login-hero__inner">
          <span className="login-hero__badge">SARMS</span>
          <h1>Student Record Management System</h1>
          <p>
            {isAdmin
              ? 'School-wide setup, accounts, classes, and academic settings for administrators.'
              : 'Enter marks, view students, and homeroom tools for teaching staff.'}
          </p>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1>{isAdmin ? 'Administrator sign in' : 'Teacher sign in'}</h1>
              <h2>SARMS</h2>
              <p>
                {isAdmin
                  ? 'Use your administrator username and password.'
                  : 'Use your teacher username and password.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder={isAdmin ? 'Administrator username' : 'Teacher username'}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="login-role-switch">
              {isAdmin ? (
                <Link to="/login/teacher" className="login-role-switch__link">
                  Log in as teacher
                </Link>
              ) : (
                <Link to="/login/admin" className="login-role-switch__link">
                  Log in as administrator
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
