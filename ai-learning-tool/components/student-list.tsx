"use client"

import { Card } from "@/components/ui/card"

type Student = {
  id: string
  name: string
  email: string
  status: "completed" | "in-progress" | "not-started"
  testsPassed: number
  testsTotal: number
  lastActivity: Date
}

const statusColors = {
  completed: "bg-(--color-success) text-white",
  "in-progress": "bg-(--color-primary-yellow) text-white",
  "not-started": "bg-(--color-muted) text-(--color-muted-foreground)",
}

const statusLabels = {
  completed: "Completed",
  "in-progress": "In Progress",
  "not-started": "Not Started",
}

export function StudentList({
  students,
  selectedStudent,
  onSelectStudent,
}: {
  students: Student[]
  selectedStudent: Student | null
  onSelectStudent: (student: Student) => void
}) {
  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Students</h2>
      <div className="space-y-2">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => onSelectStudent(student)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              selectedStudent?.id === student.id
                ? "border-(--color-primary-blue) bg-blue-50"
                : "border-(--color-border) hover:border-(--color-primary-blue)/50"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold">{student.name}</h3>
                <p className="text-xs text-(--color-muted-foreground)">{student.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[student.status]}`}>
                {statusLabels[student.status]}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-(--color-muted-foreground)">
                Tests: {student.testsPassed}/{student.testsTotal}
              </span>
              <span className="text-xs text-(--color-muted-foreground)">
                {Math.round((Date.now() - student.lastActivity.getTime()) / (1000 * 60))}m ago
              </span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
