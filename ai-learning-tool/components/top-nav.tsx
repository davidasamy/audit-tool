"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function TopNav() {
  const { user, userRole, signOut } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent double-clicks
    
    try {
      setIsSigningOut(true)
      await signOut()
      
      // Force a hard redirect to clear all state
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
      
      // Even if there's an error, try to redirect
      window.location.href = '/auth/login'
    }
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Image 
              src="/wings.avif" 
              alt="Code Angel" 
              width={32} 
              height={32}
              className="rounded"
            />
            Code Angel
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Signed in as <span className="font-medium">{user.email}</span>
                  {userRole && <span className="ml-1">({userRole})</span>}
                </span>
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  size="sm"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">Not signed in</span>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
