'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: 'student' | 'instructor' | null
  signUp: (email: string, password: string, role: 'student' | 'instructor') => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'student' | 'instructor' | null>(null)

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (!mounted) return

          if (roleError) {
            // If user doesn't exist in users table, this is an orphaned auth user
            console.warn('User not found in users table:', session.user.id)
            console.error('Error details:', roleError)
            // Set role to null and let them sign up again or contact support
            setUserRole(null)
          } else {
            setUserRole(data?.role ?? null)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Session error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (mounted) {
            if (roleError) {
              console.warn('User not found in users table:', session.user.id)
              setUserRole(null)
            } else {
              setUserRole(data?.role ?? null)
            }
          }
        } else {
          setUserRole(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, role: 'student' | 'instructor') => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Store user role in database
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        role,
      })

      if (insertError) {
        console.error('Error creating user record:', insertError)
        throw new Error('Failed to create user profile. Please try again.')
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
        // Continue anyway to clear local state
      }
      
      // Clear local state
      setUser(null)
      setSession(null)
      setUserRole(null)
    } catch (error) {
      console.error('Sign out exception:', error)
      // Clear local state even if there's an error
      setUser(null)
      setSession(null)
      setUserRole(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}