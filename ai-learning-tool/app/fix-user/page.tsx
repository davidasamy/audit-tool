'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function FixUserPage() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor'>('student')
  const router = useRouter()

  const createUserProfile = async () => {
    if (!user) {
      setError('No authenticated user found')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error: insertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email || '',
        role: selectedRole,
      })

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
        window.location.reload()
      }, 2000)
    } catch (err) {
      console.error('Error creating user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Not Signed In</h1>
          <p className="text-gray-600 mb-4">Please sign in to fix your user profile.</p>
          <Button onClick={() => router.push('/auth/login')} className="w-full">
            Go to Sign In
          </Button>
        </Card>
      </div>
    )
  }

  if (userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Profile OK</h1>
            <p className="text-gray-600 mb-4">Your user profile is set up correctly.</p>
            <p className="text-sm text-gray-500 mb-4">Role: <strong>{userRole}</strong></p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-yellow-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Fix User Profile</h1>
        
        <div className="mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
            <p className="text-sm text-yellow-700">
              Your account exists but doesn't have a user profile. This can happen if there was an error during signup.
            </p>
          </div>

          <p className="text-gray-600 mb-4">
            Email: <strong>{user.email}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
            Profile created successfully! Redirecting...
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Your Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as 'student' | 'instructor')}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || success}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <Button
          onClick={createUserProfile}
          disabled={loading || success}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          {loading ? 'Creating Profile...' : 'Create User Profile'}
        </Button>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm text-blue-500 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </Card>
    </div>
  )
}