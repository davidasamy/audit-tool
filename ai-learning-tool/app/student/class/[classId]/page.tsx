// app/student/class/[classId]/page.tsx
import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react"

const mockAssignments = {
  cs101: [
    {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "Easy" as const,
      dueDate: "2024-10-25",
      status: "in-progress" as const,
      points: 100,
      description: "Find two numbers that add up to a target value",
    },
    {
      id: "reverse-string",
      title: "Reverse String",
      difficulty: "Easy" as const,
      dueDate: "2024-10-28",
      status: "completed" as const,
      points: 100,
      description: "Reverse a string in-place",
    },
    {
      id: "palindrome",
      title: "Valid Palindrome",
      difficulty: "Easy" as const,
      dueDate: "2024-11-01",
      status: "not-started" as const,
      points: 100,
      description: "Check if a string is a valid palindrome",
    },
  ],
  cs201: [
    {
      id: "binary-search",
      title: "Binary Search",
      difficulty: "Medium" as const,
      dueDate: "2024-10-26",
      status: "in-progress" as const,
      points: 150,
      description: "Implement binary search algorithm",
    },
  ],
  cs301: [
    {
      id: "linear-regression",
      title: "Linear Regression",
      difficulty: "Hard" as const,
      dueDate: "2024-10-30",
      status: "not-started" as const,
      points: 200,
      description: "Implement linear regression from scratch",
    },
  ],
}

const classNames = {
  cs101: "Introduction to Computer Science",
  cs201: "Data Structures and Algorithms",
  cs301: "Machine Learning Fundamentals",
}

const difficultyColors = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
}

const statusIcons = {
  completed: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  "in-progress": <Clock className="h-5 w-5 text-blue-600" />,
  "not-started": <Circle className="h-5 w-5 text-gray-400" />,
}

export default function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params)
  const assignments = mockAssignments[classId as keyof typeof mockAssignments] || []
  const className = classNames[classId as keyof typeof classNames] || "Unknown Class"

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link href="/student">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classes
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-black">{className}</h1>
          <p className="mt-2 text-gray-600">Select an assignment to begin working</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Link key={assignment.id} href={`/student/class/${classId}/assignment/${assignment.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-blue-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">{statusIcons[assignment.status]}</div>
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                          {assignment.title}
                        </CardTitle>
                        <CardDescription className="mt-1">{assignment.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={difficultyColors[assignment.difficulty]}>
                        {assignment.difficulty}
                      </Badge>
                      <span className="text-sm text-gray-600">{assignment.points} pts</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Due: {assignment.dueDate}</span>
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
          ))}
        </div>
      </main>
    </div>
  )
}