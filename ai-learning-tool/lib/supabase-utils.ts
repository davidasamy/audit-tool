import { supabase } from "./supabase"

export type Class = {
  id: string
  name: string
  instructorId: string
  description: string
  createdAt: Date
}

export type Assignment = {
  id: string
  classId: string
  problemId: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  description: string
  examples: Array<{
    input: string
    output: string
    explanation: string
  }>
  constraints: string[]
  starterCode: string
  testCases: Array<{
    input: Record<string, any>
    expected: any
  }>
  dueDate: Date
  createdAt: Date
}

export type Student = {
  id: string
  userId: string
  classId: string
  name: string
  email: string
  enrolledAt: Date
}

// simple opts object for cancellation guard
type FetchOpts = { isCanceled?: () => boolean }

export async function getStudentClasses(userId: string, opts?: FetchOpts): Promise<Class[]> {
  try {
    if (!userId) return []

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("user_id", userId)

    if (enrollmentError) throw enrollmentError

    if (opts?.isCanceled?.()) return []

    if (!enrollments || enrollments.length === 0) {
      return []
    }

    const classIds = enrollments.map((e: any) => e.class_id)

    const { data: classesData, error: classesError } = await supabase
      .from("classes")
      .select("*")
      .in("id", classIds)

    if (classesError) throw classesError
    if (opts?.isCanceled?.()) return []

    return classesData?.map(mapClass) ?? []
  } catch (error) {
    console.error("Error fetching student classes:", error)
    return []
  }
}

// ✅ FIX: Add this function
export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .single()

    if (error) {
      console.error("Supabase error fetching assignment:", error)
      return null
    }

    return data ? mapAssignment(data) : null
  } catch (err) {
    console.error("Unexpected error fetching assignment:", err)
    return null
  }
}

export async function getAssignmentsByClass(classId: string, opts?: FetchOpts): Promise<Assignment[]> {
  try {
    if (!classId) return []
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("due_date", { ascending: true })

    if (error) throw error
    if (opts?.isCanceled?.()) return []

    return data?.map(mapAssignment) ?? []
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return []
  }
}

// other helpers (createClass, getClass, enrollStudent, etc) can remain same
// mapping helpers:

function mapClass(data: any): Class {
  return {
    id: data.id,
    name: data.name,
    instructorId: data.instructor_id,
    description: data.description,
    createdAt: new Date(data.created_at),
  }
}

// Helper to map DB rows to the Assignment interface
function mapAssignment(data: any): Assignment {
  return {
    id: data.id,
    classId: data.class_id,
    problemId: data.problem_id,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,
    examples: data.examples,
    constraints: data.constraints,
    starterCode: data.starter_code,
    testCases: data.test_cases,
    dueDate: data.due_date,
    createdAt: data.created_at,
  }
}

function mapStudent(data: any): Student {
  return {
    id: data.id,
    userId: data.user_id,
    classId: data.class_id,
    name: data.name,
    email: data.email,
    enrolledAt: new Date(data.enrolled_at),
  }
}
