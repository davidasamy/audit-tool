// app/student/class/[classId]/assignment/[assignmentId]/page.tsx
"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Link href={`/student/class/${classId}`}>
              <Button variant="ghost" className="-ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Class
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">
              {error || "Assignment Not Found"}
            </h1>
          </div>
        </main>
      </div>
    )
  }

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
    <div className="flex flex-col h-screen">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <Link href={`/student/class/${classId}`}>
          <Button variant="ghost" className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Button>
        </Link>
      </header>
      <StudentWorkspace problem={problem} assignmentId={assignmentId} classId={classId} />
    </div>
  )
}