import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    departments: 0
  })
  const [teacherClasses, setTeacherClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      console.log('Dashboard loaded for user:', user)
      if (user.role === 'admin') {
        fetchStats()
      } else {
        fetchTeacherClasses()
      }
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const [teachersRes, studentsRes, classesRes, departmentsRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/students'),
        api.get('/classes'),
        api.get('/departments')
      ])
      setStats({
        teachers: teachersRes.data.teachers?.length || 0,
        students: studentsRes.data.students?.length || 0,
        classes: classesRes.data.classes?.length || 0,
        departments: departmentsRes.data.departments?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTeacherClasses = async () => {
    setLoading(true)
    try {
      if (!user.teacher_id) {
        console.error('No teacher_id found for user')
        return
      }
      
      const response = await api.get(`/teachers/${user.teacher_id}/assignments`)
      console.log('Teacher assignments:', response.data)
      
      if (response.data.success && response.data.assignments) {
        // Transform the data to match the expected format
        const formattedClasses = response.data.assignments.map(assignment => ({
          class_id: assignment.class_id,
          grade: assignment.grade_number,
          section: assignment.section_name,
          subject_id: assignment.subject_id,
          subject_name: assignment.subject_name,
          year_name: assignment.year_name
        }))
        setTeacherClasses(formattedClasses)
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const menuItems = user.role === 'admin' ? [
    { icon: '🏢', label: 'Departments', path: '/admin/departments' },
    { icon: '👨‍🏫', label: 'Teachers', path: '/admin/teachers' },
    { icon: '👥', label: 'Students', path: '/admin/students' },
    { icon: '🏫', label: 'Classes', path: '/admin/classes' },
    { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
  ] : user.is_homeroom_teacher ? [
    { icon: '👥', label: 'Students', path: '/students' },
    { icon: '✅', label: 'Approve Marks', path: '/homeroom/approval' },
    { icon: '📊', label: 'Generate Roster', path: '/roster' },
    { icon: '📝', label: 'View Marks', path: '/marks' },
  ] : [
    { icon: '✏️', label: 'Enter Marks', path: '/marks' },
    { icon: '👥', label: 'View Students', path: '/students' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar - Only for Admin */}
      {user.role === 'admin' && (
        <aside style={{
          width: sidebarOpen ? '280px' : '80px',
          background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Logo Section */}
          <div style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-end' : 'center'
          }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav style={{
            flex: 1,
            padding: '20px 0',
            overflowY: 'auto'
          }}>
            {menuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                style={{
                  padding: sidebarOpen ? '14px 20px' : '14px 0',
                  margin: '4px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {sidebarOpen && (
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                )}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <span>🚪</span>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f5f7fa'
      }}>
        {/* Top Bar */}
        <header style={{
          background: 'white',
          padding: '20px 32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1e3c72',
            margin: 0,
            flex: 1,
            textAlign: 'center'
          }}>
            Hinde High School
          </h1>
          {user.role === 'admin' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                👑
              </div>
              <div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  {user.teacher_name || user.username}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Administrator
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  {user.teacher_name || user.username}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {selectedClass 
                    ? `Grade ${selectedClass.grade}${selectedClass.section} - ${selectedClass.subject_name}`
                    : user.is_homeroom_teacher 
                      ? `Homeroom - Grade ${user.grade}${user.section}`
                      : `${user.department_name} Teacher`}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#dc2626'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#ef4444'
                }}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1400px'
          }}>
            {/* Admin Dashboard */}
            {user.role === 'admin' && (
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1e3c72',
                  marginBottom: '24px'
                }}>
                  System Overview
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '24px'
                }}>
                  <StatCard
                    icon="👨‍🏫"
                    title="Total Teachers"
                    value={stats.teachers}
                    color="#667eea"
                  />
                  <StatCard
                    icon="👥"
                    title="Total Students"
                    value={stats.students}
                    color="#f59e0b"
                  />
                  <StatCard
                    icon="🏫"
                    title="Total Classes"
                    value={stats.classes}
                    color="#10b981"
                  />
                  <StatCard
                    icon="🏢"
                    title="Total Departments"
                    value={stats.departments}
                    color="#ef4444"
                  />
                </div>
              </div>
            )}

            {/* Teacher Dashboard - Class List */}
            {user.role !== 'admin' && !selectedClass && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '500px',
                padding: '40px 20px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1e3c72',
                  marginBottom: '32px',
                  textAlign: 'center'
                }}>
                  My Classes
                </h2>
                {loading ? (
                  <div style={{ color: '#666' }}>Loading classes...</div>
                ) : teacherClasses.length === 0 ? (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    No classes assigned yet
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '900px'
                  }}>
                    {teacherClasses.map((classItem, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedClass(classItem)}
                        style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '24px',
                          cursor: 'pointer',
                          border: '2px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#667eea'
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div style={{
                          fontSize: '48px',
                          textAlign: 'center',
                          marginBottom: '16px'
                        }}>
                          🏫
                        </div>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: '#1e3c72',
                          textAlign: 'center',
                          marginBottom: '8px'
                        }}>
                          Grade {classItem.grade}{classItem.section}
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#666',
                          textAlign: 'center',
                          marginBottom: '4px'
                        }}>
                          {classItem.subject_name}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#999',
                          textAlign: 'center'
                        }}>
                          Click to view options
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Teacher Dashboard - Class Actions */}
            {user.role !== 'admin' && selectedClass && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '500px',
                padding: '40px 20px'
              }}>
                <button
                  onClick={() => setSelectedClass(null)}
                  style={{
                    alignSelf: 'flex-start',
                    marginBottom: '24px',
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>←</span>
                  <span>Back to Classes</span>
                </button>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1e3c72',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  Grade {selectedClass.grade}{selectedClass.section}
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#666',
                  marginBottom: '32px',
                  textAlign: 'center'
                }}>
                  {selectedClass.subject_name}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <div
                    onClick={() => navigate('/marks', { state: { selectedClass } })}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '32px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      width: '220px',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#667eea'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✏️</div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e3c72',
                      marginBottom: '8px'
                    }}>
                      Add Marks
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Enter student marks
                    </p>
                  </div>
                  <div
                    onClick={() => navigate('/students', { state: { selectedClass } })}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '32px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      width: '220px',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#667eea'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e3c72',
                      marginBottom: '8px'
                    }}>
                      Students
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      View class students
                    </p>
                  </div>
                  {/* Only show Approve Marks and Generate Roster if this is their homeroom class */}
                  {user.is_homeroom_teacher && user.homeroom_class_id === selectedClass.class_id && (
                    <>
                      <div
                        onClick={() => navigate('/homeroom/approval')}
                        style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '32px',
                          cursor: 'pointer',
                          border: '2px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          width: '220px',
                          textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#667eea'
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1e3c72',
                          marginBottom: '8px'
                        }}>
                          Approve Marks
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Review submitted marks
                        </p>
                      </div>
                      <div
                        onClick={() => navigate('/roster', { state: { autoGenerate: true, classId: user.homeroom_class_id } })}
                        style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '32px',
                          cursor: 'pointer',
                          border: '2px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          width: '220px',
                          textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#667eea'
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1e3c72',
                          marginBottom: '8px'
                        }}>
                          Generate Roster
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Create student reports
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s ease'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px'
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
