import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const STORAGE_KEY = 'sarms_teacher_class_v1'

const TeacherClassContext = createContext(null)

export function normalizeTeacherAssignment(row) {
  if (!row) return null
  return {
    class_id: row.class_id,
    subject_id: row.subject_id,
    grade: row.grade_number,
    section: row.section_name,
    subject_name: row.subject_name,
    year_name: row.year_name,
  }
}

function matchesAssignment(stored, row) {
  return (
    row &&
    Number(row.class_id) === Number(stored.class_id) &&
    Number(row.subject_id) === Number(stored.subject_id)
  )
}

export function TeacherClassProvider({ children }) {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [selectedClass, setSelectedClassState] = useState(null)
  const [loading, setLoading] = useState(false)

  const isTeacher = user?.role === 'teacher' && Boolean(user?.teacher_id)

  const fetchAssignments = useCallback(async () => {
    if (!user?.teacher_id) return
    setLoading(true)
    try {
      const response = await api.get(`/teachers/${user.teacher_id}/assignments`)
      if (response.data.success && Array.isArray(response.data.assignments)) {
        setAssignments(response.data.assignments)
      } else {
        setAssignments([])
      }
    } catch (e) {
      console.error('TeacherClassContext: failed to load assignments', e)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [user?.teacher_id])

  useEffect(() => {
    if (isTeacher) {
      fetchAssignments()
    } else {
      setAssignments([])
      setSelectedClassState(null)
    }
  }, [isTeacher, fetchAssignments])

  useEffect(() => {
    if (!isTeacher) return
    if (loading) return
    if (assignments.length === 0) {
      setSelectedClassState(null)
      return
    }

    setSelectedClassState((prev) => {
      if (prev) {
        const match = assignments.find((a) => matchesAssignment(prev, a))
        if (match) return normalizeTeacherAssignment(match)
      }
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          const match = assignments.find((a) => matchesAssignment(parsed, a))
          if (match) return normalizeTeacherAssignment(match)
        } catch {
          /* ignore */
        }
      }
      return null
    })
  }, [isTeacher, assignments, loading])

  useEffect(() => {
    if (!isTeacher) return
    if (selectedClass) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedClass))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [isTeacher, selectedClass])

  const setSelectedClass = useCallback((value) => {
    setSelectedClassState(value ? normalizeTeacherAssignment(value) : null)
  }, [])

  const homeroomToolsForSelection = useMemo(() => {
    if (!user?.homeroom_class_id || !selectedClass) return false
    return Number(user.homeroom_class_id) === Number(selectedClass.class_id)
  }, [user?.homeroom_class_id, selectedClass])

  const value = useMemo(
    () => ({
      assignments,
      selectedClass,
      setSelectedClass,
      loading,
      refetchAssignments: fetchAssignments,
      homeroomToolsForSelection,
    }),
    [assignments, selectedClass, setSelectedClass, loading, fetchAssignments, homeroomToolsForSelection]
  )

  return <TeacherClassContext.Provider value={value}>{children}</TeacherClassContext.Provider>
}

export function useTeacherClass() {
  const ctx = useContext(TeacherClassContext)
  if (!ctx) {
    throw new Error('useTeacherClass must be used within TeacherClassProvider')
  }
  return ctx
}
