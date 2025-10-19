import { supabase } from './supabase'

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

// Class utilities
export async function createClass(
  name: string,
  instructorId: string,
  description: string
): Promise<Class | null> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          name,
          instructor_id: instructorId,
          description,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return data?.[0] ? mapClass(data[0]) : null
  } catch (error) {
    console.error('Error creating class:', error)
    return null
  }
}

export async function getClass(classId: string): Promise<Class | null> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single()

    if (error) throw error
    return data ? mapClass(data) : null
  } catch (error) {
    console.error('Error fetching class:', error)
    return null
  }
}

export async function getInstructorClasses(instructorId: string): Promise<Class[]> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', instructorId)

    if (error) throw error
    return data?.map(mapClass) ?? []
  } catch (error) {
    console.error('Error fetching instructor classes:', error)
    return []
  }
}

// Assignment utilities
export async function createAssignment(
  classId: string,
  problemId: string,
  title: string,
  difficulty: "Easy" | "Medium" | "Hard",
  description: string,
  examples: Array<{ input: string; output: string; explanation: string }>,
  constraints: string[],
  starterCode: string,
  testCases: Array<{ input: Record<string, any>; expected: any }>,
  dueDate: Date
): Promise<Assignment | null> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert([
        {
          class_id: classId,
          problem_id: problemId,
          title,
          difficulty,
          description,
          examples,
          constraints,
          starter_code: starterCode,
          test_cases: testCases,
          due_date: dueDate.toISOString(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return data?.[0] ? mapAssignment(data[0]) : null
  } catch (error) {
    console.error('Error creating assignment:', error)
    return null
  }
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: true })

    if (error) throw error
    return data?.map(mapAssignment) ?? []
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return []
  }
}

export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (error) throw error
    return data ? mapAssignment(data) : null
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return null
  }
}

// Student enrollment utilities
export async function enrollStudent(
  userId: string,
  classId: string,
  name: string,
  email: string
): Promise<Student | null> {
  try {
    const { data, error } = await supabase
      .from('class_students')
      .insert([
        {
          user_id: userId,
          class_id: classId,
          name,
          email,
          enrolled_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    return data?.[0] ? mapStudent(data[0]) : null
  } catch (error) {
    console.error('Error enrolling student:', error)
    return null
  }
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('class_students')
      .select('*')
      .eq('class_id', classId)

    if (error) throw error
    return data?.map(mapStudent) ?? []
  } catch (error) {
    console.error('Error fetching students:', error)
    return []
  }
}

export async function getStudentClasses(userId: string): Promise<Class[]> {
  try {
    // First, get all class IDs the student is enrolled in
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('user_id', userId)

    if (enrollmentError) throw enrollmentError

    if (!enrollments || enrollments.length === 0) {
      return []
    }

    // Extract class IDs
    const classIds = enrollments.map((e: any) => e.class_id)

    // Then fetch the actual class data for those IDs
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .in('id', classIds)

    if (classesError) throw classesError

    return classesData?.map(mapClass) ?? []
  } catch (error) {
    console.error('Error fetching student classes:', error)
    return []
  }
}

// Helper mappers
function mapClass(data: any): Class {
  return {
    id: data.id,
    name: data.name,
    instructorId: data.instructor_id,
    description: data.description,
    createdAt: new Date(data.created_at),
  }
}

function mapAssignment(data: any): Assignment {
  return {
    id: data.id,
    classId: data.class_id,
    problemId: data.problem_id,
    title: data.title,
    difficulty: data.difficulty,
    description: data.description,
    examples: data.examples,
    constraints: data.constraints,
    starterCode: data.starter_code,
    testCases: data.test_cases,
    dueDate: new Date(data.due_date),
    createdAt: new Date(data.created_at),
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