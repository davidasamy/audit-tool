import { supabase } from './supabase'
import { 
  createClass, 
  createAssignment, 
  enrollStudent,
} from './supabase-utils'
import { supabaseLogger } from './supabase-logger'

const mockProblems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy" as const,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    starterCode: `def solution(nums, target):
    # write your solution here
    pass

print(solution([2,7,11,15], 9))`,
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy" as const,
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "The string is reversed in-place.",
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: "The string is reversed in-place.",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character.",
    ],
    starterCode: `def solution(s):
    # write your solution here
    pass

s = ["h","e","l","l","o"]
solution(s)
print(s)`,
    testCases: [
      { input: { s: ["h","e","l","l","o"] }, expected: ["o","l","l","e","h"] },
      { input: { s: ["H","a","n","n","a","h"] }, expected: ["h","a","n","n","a","H"] },
    ],
  },
]

const mockStudents = [
  {
    name: "Alice Johnson",
    email: "alice@student.com",
    password: "password123",
  },
  {
    name: "Bob Smith",
    email: "bob@student.com",
    password: "password123",
  },
  {
    name: "Carol Davis",
    email: "carol@student.com",
    password: "password123",
  },
]

const mockInstructor = {
  email: "instructor@gmail.com",
  password: "instructor123",
}

const mockCode = {
  incomplete: `def solution(nums, target):
    # write your solution here
    pass`,
  correct: `def solution(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
  partial: `def solution(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
}

export async function seedMockData() {
  try {
    console.log('🌱 Starting database seed...')

    // Step 1: Create instructor account
    console.log('Creating instructor account...')
    const { data: instructorAuth, error: instructorAuthError } = await supabase.auth.signUp({
      email: mockInstructor.email,
      password: mockInstructor.password,
    })

    if (instructorAuthError) {
      if (instructorAuthError.message.includes('already registered')) {
        console.log('Instructor already exists, signing in...')
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: mockInstructor.email,
          password: mockInstructor.password,
        })
        if (!signInData.user) throw new Error('Failed to sign in as instructor')
        var instructorId = signInData.user.id
      } else {
        throw instructorAuthError
      }
    } else {
      if (!instructorAuth.user) throw new Error('Failed to create instructor')
      instructorId = instructorAuth.user.id
      
      // Insert into users table
      await supabase.from('users').insert({
        id: instructorId,
        email: mockInstructor.email,
        role: 'instructor',
      })
    }

    console.log('✅ Instructor created:', instructorId)

    // Step 2: Create student accounts
    console.log('Creating student accounts...')
    const studentIds: string[] = []

    for (const student of mockStudents) {
      const { data: studentAuth, error: studentAuthError } = await supabase.auth.signUp({
        email: student.email,
        password: student.password,
      })

      if (studentAuthError) {
        if (studentAuthError.message.includes('already registered')) {
          console.log(`Student ${student.email} already exists, fetching ID...`)
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('email', student.email)
            .single()
          if (data) studentIds.push(data.id)
        } else {
          throw studentAuthError
        }
      } else {
        if (!studentAuth.user) throw new Error(`Failed to create student ${student.email}`)
        studentIds.push(studentAuth.user.id)
        
        await supabase.from('users').insert({
          id: studentAuth.user.id,
          email: student.email,
          role: 'student',
        })
      }
    }

    console.log('✅ Students created:', studentIds.length)

    // Step 3: Create class
    console.log('Creating class...')
    const classData = await createClass(
      "Introduction to Algorithms",
      instructorId!,
      "Learn fundamental algorithms and data structures through hands-on coding problems"
    )

    if (!classData) throw new Error('Failed to create class')
    console.log('✅ Class created:', classData.id)

    // Step 4: Create assignments
    console.log('Creating assignments...')
    const assignments = []
    
    for (const problem of mockProblems) {
      const assignment = await createAssignment(
        classData.id,
        problem.id,
        problem.title,
        problem.difficulty,
        problem.description,
        problem.examples,
        problem.constraints,
        problem.starterCode,
        problem.testCases,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Due in 14 days
      )

      if (assignment) {
        assignments.push(assignment)
        console.log(`✅ Assignment created: ${assignment.title}`)
      }
    }

    if (assignments.length === 0) throw new Error('Failed to create any assignments')

    // Step 5: Enroll students
    console.log('Enrolling students...')
    for (let i = 0; i < studentIds.length; i++) {
      await enrollStudent(
        studentIds[i],
        classData.id,
        mockStudents[i].name,
        mockStudents[i].email
      )
    }
    console.log(`✅ Enrolled ${studentIds.length} students`)

    // Step 6: Create activity logs for first assignment
    console.log('Creating activity logs...')
    const firstAssignment = assignments[0]

    // Alice - completed with correct solution
    await supabaseLogger.log({
      studentId: studentIds[0],
      studentName: mockStudents[0].name,
      studentEmail: mockStudents[0].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "chat",
      data: {
        role: "user",
        message: "Can you help me understand the optimal approach for this problem?",
      },
    })

    await supabaseLogger.log({
      studentId: studentIds[0],
      studentName: mockStudents[0].name,
      studentEmail: mockStudents[0].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "chat",
      data: {
        role: "assistant",
        message: "Great question! For this problem, we need to find two numbers that add up to the target. What data structure could help us check if we've seen a complement number before?",
      },
    })

    await supabaseLogger.log({
      studentId: studentIds[0],
      studentName: mockStudents[0].name,
      studentEmail: mockStudents[0].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "code_run",
      data: {
        code: mockCode.correct,
      },
    })

    await supabaseLogger.log({
      studentId: studentIds[0],
      studentName: mockStudents[0].name,
      studentEmail: mockStudents[0].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "code_submit",
      data: {
        code: mockCode.correct,
        results: [
          { passed: true },
          { passed: true },
          { passed: true },
        ],
      },
    })

    // Bob - in progress with partial solution
    await supabaseLogger.log({
      studentId: studentIds[1],
      studentName: mockStudents[1].name,
      studentEmail: mockStudents[1].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "chat",
      data: {
        role: "user",
        message: "I'm using a nested loop but it seems slow. Is there a better way?",
      },
    })

    await supabaseLogger.log({
      studentId: studentIds[1],
      studentName: mockStudents[1].name,
      studentEmail: mockStudents[1].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "code_run",
      data: {
        code: mockCode.partial,
      },
    })

    await supabaseLogger.log({
      studentId: studentIds[1],
      studentName: mockStudents[1].name,
      studentEmail: mockStudents[1].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "code_submit",
      data: {
        code: mockCode.partial,
        results: [
          { passed: true },
          { passed: true },
          { passed: false },
        ],
      },
    })

    // Carol - just started
    await supabaseLogger.log({
      studentId: studentIds[2],
      studentName: mockStudents[2].name,
      studentEmail: mockStudents[2].email,
      classId: classData.id,
      assignmentId: firstAssignment.id,
      problemId: firstAssignment.problemId,
      problemTitle: firstAssignment.title,
      action: "code_run",
      data: {
        code: mockCode.incomplete,
      },
    })

    console.log('✅ Activity logs created')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   Instructor: ${mockInstructor.email} / ${mockInstructor.password}`)
    console.log(`   Class ID: ${classData.id}`)
    console.log(`   Assignments: ${assignments.length}`)
    console.log(`   Students: ${studentIds.length}`)
    console.log('\n👥 Student accounts:')
    mockStudents.forEach(s => console.log(`   ${s.email} / ${s.password}`))
    
    return { 
      classId: classData.id, 
      assignments: assignments.map(a => ({ id: a.id, title: a.title })),
      instructorEmail: mockInstructor.email,
      studentEmails: mockStudents.map(s => s.email),
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}