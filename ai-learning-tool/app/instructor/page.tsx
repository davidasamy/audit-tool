"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { InstructorDashboard } from "@/components/instructor-dashboard"
import { AccessDeniedToast } from "@/components/access-denied-toast"
import { useAuth } from "@/lib/auth-context"
import { getAssignmentsByClass, type Class, type Student } from "@/lib/supabase-utils"
import { supabase } from "@/lib/supabase"
import { supabaseLogger } from "@/lib/supabase-logger"

interface StudentData {
  id: string
  name: string
  email: string
  problemId: string
  problemTitle: string
  status: "completed" | "in-progress" | "not-started"
  attempts: number
  testsPassed: number
  testsTotal: number
  timeSpent: number
  lastActivity: Date
  chatMessages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }>
  code: string
}

interface ClassInfo {
  id: string
  name: string
}

interface AssignmentInfo {
  id: string
  title: string
}

export default function InstructorPage() {
  const { user, userRole, loading: authLoading } = useAuth()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentInfo | null>(null)
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch instructor's classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const { data: instructorClasses, error } = await supabase
          .from('classes')
          .select('id, name')
          .eq('instructor_id', user.id)

        if (error) throw error

        if (!instructorClasses || instructorClasses.length === 0) {
          setError("No classes found")
          setClasses([])
          setLoading(false)
          return
        }

        const classesInfo = instructorClasses.map((c: any) => ({
          id: c.id,
          name: c.name,
        }))

        setClasses(classesInfo)
        setSelectedClass(classesInfo[0])
      } catch (err) {
        console.error("Error fetching classes:", err)
        setError("Failed to load classes")
      }
    }

    if (!authLoading) {
      fetchClasses()
    }
  }, [user, authLoading])

  // Fetch assignments for selected class
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedClass) return

      try {
        const classAssignments = await getAssignmentsByClass(selectedClass.id)
        const assignmentsInfo = classAssignments.map((a) => ({
          id: a.id,
          title: a.title,
        }))

        setAssignments(assignmentsInfo)
        if (assignmentsInfo.length > 0) {
          setSelectedAssignment(assignmentsInfo[0])
        }
      } catch (err) {
        console.error("Error fetching assignments:", err)
      }
    }

    fetchAssignments()
  }, [selectedClass])

  // Fetch student data for selected assignment
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedClass || !selectedAssignment) {
        setStudents([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch all students in the class
        const { data: classStudents, error: studentsError } = await supabase
          .from('class_students')
          .select('*')
          .eq('class_id', selectedClass.id)

        if (studentsError) throw studentsError

        if (!classStudents || classStudents.length === 0) {
          setStudents([])
          setLoading(false)
          return
        }

        // Fetch activity logs for this assignment
        const logs = await supabaseLogger.getLogs(selectedClass.id)

        // Filter logs by assignment
        const assignmentLogs = logs.filter((log) => log.assignmentId === selectedAssignment.id)

        // Group logs by student
        const studentMap = new Map<string, StudentData>()

        // Initialize students from class enrollment
        classStudents.forEach((student: any) => {
          studentMap.set(student.user_id, {
            id: student.user_id,
            name: student.name,
            email: student.email,
            problemId: "",
            problemTitle: "",
            status: "not-started",
            attempts: 0,
            testsPassed: 0,
            testsTotal: 0,
            timeSpent: 0,
            lastActivity: new Date(student.enrolled_at),
            chatMessages: [],
            code: "",
          })
        })

        // Process logs to build student data
        assignmentLogs.forEach((log) => {
          const student = studentMap.get(log.studentId)

          if (student) {
            student.problemId = log.problemId
            student.problemTitle = log.problemTitle
            student.lastActivity = new Date(log.timestamp)

            if (log.action === "chat") {
              student.chatMessages.push({
                role: log.data.role,
                content: log.data.message,
                timestamp: new Date(log.timestamp),
              })
            } else if (log.action === "code_run") {
              student.attempts++
              student.code = log.data.code
              if (student.status === "not-started") {
                student.status = "in-progress"
              }
            } else if (log.action === "code_submit") {
              student.status = "completed"
              student.testsPassed = log.data.results?.filter((r: any) => r.passed).length || 0
              student.testsTotal = log.data.results?.length || 0
              student.code = log.data.code
            }
          }
        })

        const studentsArray = Array.from(studentMap.values())
        setStudents(studentsArray)
      } catch (err) {
        console.error("Error fetching student data:", err)
        setError("Failed to load student data")
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [selectedClass, selectedAssignment])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {(!user || userRole !== "instructor") && <AccessDeniedToast role="instructor" />}
      
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-yellow-50">
        {/* Class and Assignment Selection */}
        <div className="mx-auto max-w-7xl px-6 py-6 border-b border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Select Class</label>
              <select
                value={selectedClass?.id || ""}
                onChange={(e) => {
                  const classId = e.target.value
                  const found = classes.find((c) => c.id === classId)
                  setSelectedClass(found || null)
                }}
                className="mt-1 block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {assignments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Select Assignment</label>
                <select
                  value={selectedAssignment?.id || ""}
                  onChange={(e) => {
                    const assignmentId = e.target.value
                    const found = assignments.find((a) => a.id === assignmentId)
                    setSelectedAssignment(found || null)
                  }}
                  className="mt-1 block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard */}
        {selectedClass && selectedAssignment && (
          <InstructorDashboard students={students} />
        )}
      </div>
    </>
  )
}