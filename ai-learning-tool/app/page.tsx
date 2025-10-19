"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && userRole) {
      // Redirect authenticated users to their respective dashboards
      if (userRole === "student") {
        router.push("/student")
      } else if (userRole === "instructor") {
        router.push("/instructor")
      }
    }
  }, [user, userRole, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the landing page if user is logged in (redirect in progress)
  if (user && userRole) {
    return null
  }

  return (
    
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-white via-blue-50 to-yellow-50">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-balance">
            Welcome to <span className="text-blue-600">Code Angel</span>
          </h1>
          <p className="text-xl text-gray-600 text-pretty max-w-2xl mx-auto">
            Your AI-powered coding companion. A transparent learning platform where students solve problems with AI assistance, and instructors can
            monitor progress and understand how AI is being used.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <p className="text-gray-600">Get started by signing in or creating an account</p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login" className="inline-block">
              <Button className="bg-blue-600 hover:bg-blue-700 px-8">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" className="inline-block">
              <Button variant="outline" className="px-8 border-2">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
