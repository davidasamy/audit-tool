import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-white via-blue-50 to-yellow-50">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-balance">
            Learn to Code with <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-xl text-gray-600 text-pretty max-w-2xl mx-auto">
            A transparent learning platform where students solve problems with AI assistance, and instructors can
            monitor progress and understand how AI is being used.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-8">
          <Card className="p-8 hover:shadow-lg transition-shadow border-2 hover:border-blue-600">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Student View</h2>
              <p className="text-gray-600">
                Solve coding problems with an AI assistant that helps you learn without giving away answers
              </p>
              <Link href="/student">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Learning
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow border-2 hover:border-red-500">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Instructor View</h2>
              <p className="text-gray-600">
                Monitor student progress, review AI interactions, and understand learning patterns
              </p>
              <Link href="/instructor">
                <Button className="w-full bg-red-500 hover:bg-red-600">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
