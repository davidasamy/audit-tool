"use client"

import { useEffect, useState } from "react"
import { InstructorDashboard } from "@/components/instructor-dashboard"
import { AccessDeniedToast } from "@/components/access-denied-toast"
import { useAuth } from "@/lib/auth-context"
import { getStudentsByClass } from "@/lib/supabase-utils"
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

interface PageProps {
  classId: string
  assignmentId: string
}

export default function InstructorPage({ classId, assignmentId }: PageProps) {
  const { user, userRole, loading: authLoading } = useAuth()
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all students in the class
        const classStudents = await getStudentsByClass(classId)

        if (classStudents.length === 0) {
          setStudents([])
          return
        }

        // Fetch activity logs for this assignment
        const logs = await supabaseLogger.getLogs(classId)

        // Filter logs by assignment
        const assignmentLogs = logs.filter(log => log.assignmentId === assignmentId)

        // Group logs by student
        const studentMap = new Map<string, StudentData>()

        // Initialize students from class enrollment
        classStudents.forEach(student => {
          studentMap.set(student.userId, {
            id: student.userId,
            name: student.name,
            email: student.email,
            problemId: "",
            problemTitle: "",
            status: "not-started",
            attempts: 0,
            testsPassed: 0,
            testsTotal: 3,
            timeSpent: 0,
            lastActivity: student.enrolledAt,
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
              student.code = log.data.code
            }
          }
        })

        const studentsArray = Array.from(studentMap.values())
        setStudents(studentsArray)
      } catch (err) {
        console.error('Error fetching student data:', err)
        setError('Failed to load student data')
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    if (classId && assignmentId && !authLoading) {
      fetchStudentData()
    }
  }, [classId, assignmentId, authLoading])

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
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <InstructorDashboard students={students} />
    </>
  )
}