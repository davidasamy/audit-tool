"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react"
import { getAssignmentsByClass, type Assignment } from "@/lib/supabase-utils"
import { supabaseLogger } from "@/lib/supabase-logger"
import { useAuth } from "@/lib/auth-context"

const difficultyColors = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
}

interface AssignmentWithStatus extends Assignment {
  status: "completed" | "in-progress" | "not-started"
}

export default function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params)
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([])
  const [className, setClassName] = useState<string>("Assignments")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch assignments for this class
        const classAssignments = await getAssignmentsByClass(classId)

        // Get activity logs to determine completion status
        const logs = await supabaseLogger.getLogs(classId, user.id)

        // Create a map of completed assignment IDs
        const completedAssignmentIds = new Set(
          logs
            .filter((log) => log.action === "code_submit")
            .map((log) => log.assignmentId)
        )

        // Add status to each assignment
        const assignmentsWithStatus: AssignmentWithStatus[] = classAssignments.map(
          (assignment) => {
            const status = completedAssignmentIds.has(assignment.id)
              ? "completed"
              : logs.some((log) => log.assignmentId === assignment.id)
                ? "in-progress"
                : "not-started"

            return {
              ...assignment,
              status,
            }
          }
        )

        setAssignments(assignmentsWithStatus)
      } catch (err) {
        console.error("Error fetching class data:", err)
        setError("Failed to load assignments")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [classId, user])

  const statusIcons = {
    completed: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    "in-progress": <Clock className="h-5 w-5 text-blue-600" />,
    "not-started": <Circle className="h-5 w-5 text-gray-400" />,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Link href="/student">
              <Button variant="ghost" className="-ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Classes
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="max-w-md">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/student">
            <Button variant="ghost" className="-ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classes
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold text-black mb-2">{className}</h1>
        <p className="text-gray-600 mb-8">Select an assignment to begin working</p>

        {/* Increased spacing and fixed spacing issue */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
              <p className="text-sm text-yellow-700">No assignments in this class yet.</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/student/class/${classId}/assignment/${assignment.id}`}
                className="block"
              >
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-blue-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{statusIcons[assignment.status]}</div>
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                            {assignment.title}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {assignment.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="outline"
                          className={difficultyColors[assignment.difficulty]}
                        >
                          {assignment.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                      <span
                        className={`font-medium ${
                          assignment.status === "completed"
                            ? "text-green-600"
                            : assignment.status === "in-progress"
                              ? "text-blue-600"
                              : "text-gray-500"
                        }`}
                      >
                        {assignment.status === "completed"
                          ? "Completed"
                          : assignment.status === "in-progress"
                            ? "In Progress"
                            : "Not Started"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
