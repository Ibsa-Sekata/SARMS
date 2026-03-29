import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentRoster from './pages/StudentRoster'
import MarkEntry from './pages/MarkEntry'
import StudentManagement from './pages/StudentManagement'
import HomeroomApproval from './pages/HomeroomApproval'
import ManageTeachers from './pages/Admin/ManageTeachers'
import ManageStudents from './pages/Admin/ManageStudents'
import ManageDepartments from './pages/Admin/ManageDepartments'
import ManageClasses from './pages/Admin/ManageClasses'
import AcademicSettings from './pages/Admin/AcademicSettings'
import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" />
}

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  return user ? <Navigate to="/dashboard" /> : children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/roster" 
              element={
                <ProtectedRoute>
                  <StudentRoster />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/marks" 
              element={
                <ProtectedRoute>
                  <MarkEntry />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/students" 
              element={
                <ProtectedRoute>
                  <StudentManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/homeroom/approval" 
              element={
                <ProtectedRoute>
                  <HomeroomApproval />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/teachers" 
              element={
                <ProtectedRoute>
                  <ManageTeachers />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/students" 
              element={
                <ProtectedRoute>
                  <ManageStudents />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/departments" 
              element={
                <ProtectedRoute>
                  <ManageDepartments />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/classes" 
              element={
                <ProtectedRoute>
                  <ManageClasses />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <AcademicSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App