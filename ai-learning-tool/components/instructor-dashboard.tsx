"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { StudentList } from "@/components/student-list"
import { StudentDetail } from "@/components/student-detail"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Student = {
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
  chatMessages: ChatMessage[]
  code: string
}

type ClassInfo = {
  id: string
  name: string
}

type AssignmentInfo = {
  id: string
  title: string
}

export function InstructorDashboard({
  students,
  classes,
  assignments,
}: {
  students: Student[]
  classes: ClassInfo[]
  assignments: AssignmentInfo[]
}) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(
    classes.length > 0 ? classes[0] : null
  )
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentInfo | null>(
    assignments.length > 0 ? assignments[0] : null
  )

  const completedCount = students.filter((s) => s.status === "completed").length
  const inProgressCount = students.filter((s) => s.status === "in-progress").length
  const avgTimeSpent =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + s.timeSpent, 0) / students.length)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-yellow-50">
      {/* Header */}
      <div className="border-b border-(--color-border) bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">Instructor Dashboard</h1>
              <p className="text-(--color-muted-foreground)">
                Monitor student progress and AI interactions
              </p>
            </div>

            {/* Class & Assignment Dropdowns */}
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Select Class</label>
                <select
                  value={selectedClass?.id || ""}
                  onChange={(e) => {
                    const found = classes.find((c) => c.id === e.target.value)
                    setSelectedClass(found || null)
                  }}
                  className="mt-1 block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Select Assignment</label>
                <select
                  value={selectedAssignment?.id || ""}
                  onChange={(e) => {
                    const found = assignments.find((a) => a.id === e.target.value)
                    setSelectedAssignment(found || null)
                  }}
                  className="mt-1 block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Students */}
<Card className="p-6 border-2 border-(--color-primary-blue)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-(--color-muted-foreground) mb-1">Total Students</p>
                <p className="text-4xl font-bold">{students.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-(--color-primary-blue) flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-(--color-success)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-(--color-muted-foreground) mb-1">Completed</p>
                <p className="text-4xl font-bold">{completedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-(--color-success) flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-(--color-primary-yellow)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-(--color-muted-foreground) mb-1">Avg. Time Spent</p>
                <p className="text-4xl font-bold">{avgTimeSpent}m</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-(--color-primary-yellow) flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StudentList
              students={students}
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
            />
          </div>

          <div className="lg:col-span-2">
            {selectedStudent ? (
              <StudentDetail student={selectedStudent} />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Select a Student</h3>
                <p className="text-(--color-muted-foreground)">
                  Choose a student from the list to view their progress and AI interactions
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
