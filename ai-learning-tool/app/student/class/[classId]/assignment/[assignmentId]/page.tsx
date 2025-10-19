// app/student/class/[classId]/assignment/[assignmentId]/page.tsx
"use client"

import { use, useEffect, useState } from "react"
import { AssignmentHeader } from "@/components/assignment-header"
import { AssignmentLoading } from "@/components/assignment-loading"
import { AssignmentError } from "@/components/assignment-error"
import { StudentWorkspace } from "@/components/student-workspace"
import { getAssignment, type Assignment } from "@/lib/supabase-utils"

export default function AssignmentPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>
}) {
  const { classId, assignmentId } = use(params)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAssignment(assignmentId)

        if (!data) {
          setError("Assignment not found")
          return
        }

        setAssignment(data)
      } catch (err) {
        console.error("Error fetching assignment:", err)
        setError("Failed to load assignment")
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [assignmentId])

  if (loading) return <AssignmentLoading />
  if (error || !assignment) return <AssignmentError error={error || "Assignment Not Found"} classId={classId} />

  const problem = {
    id: assignment.problemId,
    title: assignment.title,
    difficulty: assignment.difficulty,
    description: assignment.description,
    examples: assignment.examples,
    constraints: assignment.constraints,
    starterCode: assignment.starterCode,
    testCases: assignment.testCases,
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AssignmentHeader classId={classId} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <StudentWorkspace problem={problem} assignmentId={assignmentId} classId={classId} />
      </div>
    </div>
  )
}
