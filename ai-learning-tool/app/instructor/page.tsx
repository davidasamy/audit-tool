"use client"

import { useEffect, useState } from "react"
import { AccessDeniedToast } from "@/components/access-denied-toast"
import { useAuth } from "@/lib/auth-context"
import { getAssignmentsByClass } from "@/lib/supabase-utils"
import { supabase } from "@/lib/supabase"
import { supabaseLogger } from "@/lib/supabase-logger"
import { InstructorDashboard } from "@/components/instructor-dashboard"

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
  className: string
  assignmentTitle: string
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
  const [students, setStudents] = useState<StudentData[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return
      try {
        setLoading(true)
        setError(null)

        // Fetch all classes for instructor
        const { data: instructorClasses, error: classesError } = await supabase
          .from("classes")
          .select("id, name")
          .eq("instructor_id", user.id)
        if (classesError) throw classesError
        if (!instructorClasses) return

        setClasses(instructorClasses)

        const allAssignments: AssignmentInfo[] = []
        const allStudentsMap = new Map<string, StudentData>()

        for (const c of instructorClasses) {
          // Fetch assignments for class
          const classAssignments = await getAssignmentsByClass(c.id)
          allAssignments.push(...classAssignments)

          // Fetch students in class
          const { data: classStudents, error: studentsError } = await supabase
            .from("class_students")
            .select("*")
            .eq("class_id", c.id)
          if (studentsError) throw studentsError
          if (!classStudents) continue

          // Fetch logs for this class
          const logs = await supabaseLogger.getLogs(c.id)

          for (const student of classStudents) {
            const studentId = student.user_id
            if (!allStudentsMap.has(studentId)) {
              allStudentsMap.set(studentId, {
                id: studentId,
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
                className: c.name,
                assignmentTitle: "",
              })
            }
          }

          // Process logs to enrich student data
          logs.forEach((log) => {
            const student = allStudentsMap.get(log.studentId)
            if (!student) return

            student.problemId = log.problemId
            student.problemTitle = log.problemTitle
            student.lastActivity = new Date(log.timestamp)

            // Lookup assignment title by assignmentId
            const assignment = allAssignments.find((a) => a.id === log.assignmentId)
            student.assignmentTitle = assignment?.title || log.problemTitle

            if (log.action === "chat") {
              student.chatMessages.push({
                role: log.data.role,
                content: log.data.message,
                timestamp: new Date(log.timestamp),
              })
            } else if (log.action === "code_run") {
              student.attempts++
              student.code = log.data.code
              if (student.status === "not-started") student.status = "in-progress"
            } else if (log.action === "code_submit") {
              student.status = "completed"
              student.testsPassed = log.data.results?.filter((r: any) => r.passed).length || 0
              student.testsTotal = log.data.results?.length || 0
              student.code = log.data.code
            }
          })
        }

        setStudents(Array.from(allStudentsMap.values()))
        setAssignments(allAssignments)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) fetchAllData()
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || userRole !== "instructor") {
    return <AccessDeniedToast role="instructor" />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <InstructorDashboard
      students={students}
      classes={classes}
      assignments={assignments}
    />
  )
}
