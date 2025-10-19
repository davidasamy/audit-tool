"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: "student" | "instructor" | null
  signUp: (email: string, password: string, role: "student" | "instructor") => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<"student" | "instructor" | null>(null)

  // Prevent duplicate fetches when onAuthStateChange emits repeatedly
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  async function fetchUserRole(userId: string): Promise<"student" | "instructor" | null> {
    try {
      // If we already fetched this user's role, reuse it
      if (lastFetchedUserIdRef.current === userId && userRole) {
        return userRole
      }

      // ensure session is fresh so client can make queries
      try {
        // refreshSession is available on clients, but if not, this is a no-op
        // We call getSession to ensure client state is settled
        await supabase.auth.getSession()
      } catch (e) {
        // ignore - we still attempt the select below
        console.warn("Warning while ensuring session:", e)
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single()

      if (error) {
        console.warn("Error fetching user role:", error.message ?? error)
        return null
      }

      const role = data?.role ?? null
      lastFetchedUserIdRef.current = userId
      return role
    } catch (err) {
      console.warn("Failed to fetch user role:", err instanceof Error ? err.message : err)
      return null
    }
  }

  useEffect(() => {
    mountedRef.current = true

    const initializeAuth = async () => {
      try {
        const { data: sessionResp, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session:", error)
          if (mountedRef.current) setLoading(false)
          return
        }

        if (!mountedRef.current) return

        setSession(sessionResp.session ?? null)
        setUser(sessionResp.session?.user ?? null)
        setLoading(false)

        if (sessionResp.session?.user) {
          const role = await fetchUserRole(sessionResp.session.user.id)
          if (mountedRef.current) setUserRole(role)
        }
      } catch (error) {
        console.error("Session initialization error:", error)
        if (mountedRef.current) setLoading(false)
      }
    }

    initializeAuth()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mountedRef.current) return

      // Update basic state immediately
      setSession(newSession ?? null)
      setUser(newSession?.user ?? null)

      // Stop loading right away
      setLoading(false)

      // Only fetch role if user present and different from last fetched
      if (newSession?.user) {
        const uid = newSession.user.id
        if (lastFetchedUserIdRef.current !== uid) {
          const role = await fetchUserRole(uid)
          if (mountedRef.current) setUserRole(role)
        }
      } else {
        // user signed out
        lastFetchedUserIdRef.current = null
        if (mountedRef.current) setUserRole(null)
      }
    })

    return () => {
      mountedRef.current = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  const signUp = async (email: string, password: string, role: "student" | "instructor") => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        role,
      })

      if (insertError) {
        console.error("Error creating user record:", insertError)
        throw new Error("Failed to create user profile. Please try again.")
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
        console.error("Supabase sign out error:", error)
      }
    } finally {
      // clear local state regardless
      lastFetchedUserIdRef.current = null
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
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
