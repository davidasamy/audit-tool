import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Clock } from "lucide-react"

const mockClasses = [
  {
    id: "cs101",
    name: "Introduction to Computer Science",
    instructor: "Dr. Sarah Johnson",
    term: "Fall 2024",
    color: "bg-red-500",
    assignmentCount: 8,
    completedCount: 5,
  },
  {
    id: "cs201",
    name: "Data Structures and Algorithms",
    instructor: "Prof. Michael Chen",
    term: "Fall 2024",
    color: "bg-blue-500",
    assignmentCount: 12,
    completedCount: 7,
  },
  {
    id: "cs301",
    name: "Machine Learning Fundamentals",
    instructor: "Dr. Emily Rodriguez",
    term: "Fall 2024",
    color: "bg-yellow-500",
    assignmentCount: 10,
    completedCount: 3,
  },
]

export default function StudentPage() {
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
          {mockClasses.map((classItem) => (
            <Link key={classItem.id} href={`/student/class/${classItem.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg ${classItem.color} p-3`}>
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {classItem.term}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-xl group-hover:text-blue-600 transition-colors">
                    {classItem.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    {classItem.instructor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {classItem.completedCount}/{classItem.assignmentCount} completed
                      </span>
                    </div>
                    <div className="text-blue-600 font-medium">
                      {Math.round((classItem.completedCount / classItem.assignmentCount) * 100)}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${(classItem.completedCount / classItem.assignmentCount) * 100}%`,
                      }}
                    />
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
