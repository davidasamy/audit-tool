// components/access-denied-toast.tsx
'use client'

import { useEffect, useState } from 'react'

interface AccessDeniedToastProps {
  role: 'student' | 'instructor'
}

export function AccessDeniedToast({ role }: AccessDeniedToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000) // Disappear after 5 seconds

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 flex items-end justify-end p-6 pointer-events-none">
      <div
        className={`max-w-sm w-full bg-red-50 border-l-4 border-red-500 p-6 rounded shadow-lg transform transition-all duration-500 ease-in-out pointer-events-auto ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
            <p className="mt-2 text-sm text-red-700">
              You don't have permission to access this page. Only {role}s can view this {role} {role === 'student' ? 'workspace' : 'dashboard'}.
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-3 text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}