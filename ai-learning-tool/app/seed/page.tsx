'use client'

import { seedMockData } from '@/lib/seed-mock-data'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      const data = await seedMockData()
      setResult(data)
      console.log('Seeding complete:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seeding failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Database Seeder</h1>
          <p className="text-gray-600 mb-6">
            This will populate your database with sample data including an instructor account, 
            student accounts, a class, assignments, and activity logs.
          </p>
          
          <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 mb-6"
          >
            {loading ? 'Seeding Database...' : 'Seed Database'}
          </Button>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
              <div className="flex">
                <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {result && (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-green-800 font-semibold text-lg mb-4">Seeding Successful!</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Instructor Account</h4>
                      <div className="bg-white rounded p-3 font-mono text-xs">
                        <div>Email: <span className="text-blue-600">{result.instructorEmail}</span></div>
                        <div>Password: <span className="text-blue-600">instructor123</span></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Student Accounts</h4>
                      <div className="bg-white rounded p-3 space-y-2">
                        {result.studentEmails.map((email: string) => (
                          <div key={email} className="font-mono text-xs">
                            <div>Email: <span className="text-blue-600">{email}</span></div>
                            <div>Password: <span className="text-blue-600">password123</span></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Class Created</h4>
                      <div className="bg-white rounded p-3 font-mono text-xs">
                        <div>Class ID: <code className="text-purple-600">{result.classId}</code></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Assignments ({result.assignments.length})</h4>
                      <div className="bg-white rounded p-3 space-y-1">
                        {result.assignments.map((assignment: any) => (
                          <div key={assignment.id} className="font-mono text-xs">
                            <span className="text-gray-600">{assignment.title}</span>
                            <span className="text-gray-400 ml-2">({assignment.id})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-green-200">
                      <p className="text-green-800 text-sm">
                        ✅ You can now sign in with any of the accounts above to test the application!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">What gets created:</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>1 instructor account (instructor@example.com)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>3 student accounts (alice@student.com, bob@student.com, carol@student.com)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>1 class (Introduction to Algorithms)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>2 coding assignments (Two Sum, Reverse String)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Student enrollments and sample activity logs</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}