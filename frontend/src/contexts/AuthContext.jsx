import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      getCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.user)
      } else {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      }
    } catch (error) {
      console.error('Get current user error:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password, options = {}) => {
    const { expectedRole } = options
    try {
      setLoading(true)
      const response = await api.post('/auth/login', { username, password })
      
      if (response.data.success) {
        const { token, user } = response.data
        const role = String(user?.role ?? '').toLowerCase().trim()

        if (expectedRole) {
          const want = String(expectedRole).toLowerCase().trim()
          if (role !== want) {
            toast.error(
              want === 'admin'
                ? 'This account is not an administrator. Use the teacher sign-in page.'
                : 'This account is not a teacher. Use the administrator sign-in page.'
            )
            return { success: false, message: 'Role mismatch' }
          }
        }

        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        setUser(user)

        const displayName =
          role === 'admin' ? user.username : user.teacher_name || user.username
        toast.success(`Welcome back, ${displayName}!`)
        return { success: true }
      } else {
        toast.error(response.data.message || 'Login failed')
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.message || 'Server error during login'
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    getCurrentUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}