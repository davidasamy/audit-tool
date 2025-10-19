"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getStudentClasses, getAssignmentsByClass } from "@/lib/supabase-utils"
import { supabaseLogger } from "@/lib/supabase-logger"

interface ClassData {
  id: string
  name: string
  instructorId: string
  description: string
  createdAt: Date
  instructorEmail?: string
  assignmentCount: number
  completedCount: number
}

const colorMap: Record<number, string> = {
  0: "bg-red-500",
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-purple-500",
  4: "bg-green-500",
  5: "bg-pink-500",
}

export default function StudentClassesPage() {
  const { user, loading: authLoading } = useAuth()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch all classes the student is enrolled in
        const studentClasses = await getStudentClasses(user.id)

        if (studentClasses.length === 0) {
          setClasses([])
          return
        }

        // For each class, get the assignment count and completion status
        const classesWithStats = await Promise.all(
          studentClasses.map(async (classItem) => {
            try {
              const assignments = await getAssignmentsByClass(classItem.id)

              // Get activity logs to determine completion status
              const logs = await supabaseLogger.getLogs(classItem.id, user.id)

              // Count completed assignments (those with code_submit action)
              const completedAssignmentIds = new Set(
                logs
                  .filter((log) => log.action === "code_submit")
                  .map((log) => log.assignmentId)
              )

              return {
                ...classItem,
                assignmentCount: assignments.length,
                completedCount: completedAssignmentIds.size,
              }
            } catch (err) {
              console.error(`Error fetching stats for class ${classItem.id}:`, err)
              return {
                ...classItem,
                assignmentCount: 0,
                completedCount: 0,
              }
            }
          })
        )

        setClasses(classesWithStats)
      } catch (err) {
        console.error("Error fetching classes:", err)
        setError("Failed to load classes. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchClasses()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your classes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <h1 className="text-3xl font-bold text-black">My Classes</h1>
            <p className="mt-2 text-gray-600">Select a class to view assignments</p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
            <p className="text-sm text-yellow-700">
              You are not enrolled in any classes yet. Contact your instructor to get started.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-3xl font-bold text-black">My Classes</h1>
          <p className="mt-2 text-gray-600">Select a class to view assignments</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem, index) => (
            <Link key={classItem.id} href={`/student/class/${classItem.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg ${colorMap[index % 6]} p-3`}>
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl group-hover:text-blue-600 transition-colors">
                    {classItem.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    Instructor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {classItem.description || "No description available"}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {classItem.completedCount}/{classItem.assignmentCount} completed
                        </span>
                      </div>
                      <div className="text-blue-600 font-medium">
                        {classItem.assignmentCount > 0
                          ? Math.round((classItem.completedCount / classItem.assignmentCount) * 100)
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: classItem.assignmentCount > 0
                            ? `${(classItem.completedCount / classItem.assignmentCount) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}