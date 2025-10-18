"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { InstructorDashboard } from "@/components/instructor-dashboard"
import { AccessDeniedToast } from "@/components/access-denied-toast"
import { useAuth } from "@/lib/auth-context"
import { studentLogger, type LogEntry } from "@/lib/student-logger"

// Mock student data
const mockStudentData = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    problemId: "1",
    problemTitle: "Two Sum",
    status: "completed" as const,
    attempts: 3,
    testsPassed: 3,
    testsTotal: 3,
    timeSpent: 45,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    chatMessages: [
      {
        role: "user" as const,
        content: "Can you help me understand what approach I should use for this problem?",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        role: "assistant" as const,
        content:
          "Great question! Let's think about what we need to do. We're looking for two numbers that add up to a target. What data structure might help us quickly check if we've seen a number before?",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        role: "user" as const,
        content: "Maybe a hash map?",
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        role: "assistant" as const,
        content: "Excellent thinking! A hash map is perfect for this. Can you explain why it would be useful here?",
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
    ],
    code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    problemId: "1",
    problemTitle: "Two Sum",
    status: "in-progress" as const,
    attempts: 5,
    testsPassed: 1,
    testsTotal: 3,
    timeSpent: 62,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    chatMessages: [
      {
        role: "user" as const,
        content: "I'm stuck. Can you just show me the solution?",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        role: "assistant" as const,
        content:
          "I understand it's frustrating, but I'm here to help you learn! Let's break this down together. What have you tried so far?",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        role: "user" as const,
        content: "I tried using two loops but it's not working",
        timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000),
      },
      {
        role: "assistant" as const,
        content:
          "Two loops is a good start! That's the brute force approach. Can you show me your code so we can debug it together?",
        timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000),
      },
    ],
    code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}`,
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@example.com",
    problemId: "1",
    problemTitle: "Two Sum",
    status: "completed" as const,
    attempts: 2,
    testsPassed: 3,
    testsTotal: 3,
    timeSpent: 28,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    chatMessages: [
      {
        role: "user" as const,
        content: "What's the time complexity of using a hash map?",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        role: "assistant" as const,
        content:
          "Great question! Hash map lookups are typically O(1) on average. If you're iterating through the array once and doing a hash map lookup for each element, what would the overall time complexity be?",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ],
    code: `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (diff in seen) {
      return [seen[diff], i];
    }
    seen[nums[i]] = i;
  }
}`,
  },
]

export default function InstructorPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState(mockStudentData)

  useEffect(() => {
    // No redirect needed - just let component handle it
  }, [])

  useEffect(() => {
    const logs = studentLogger.getLogs()

    // Group logs by student
    const studentMap = new Map()

    logs.forEach((log: LogEntry) => {
      if (!studentMap.has(log.studentId)) {
        studentMap.set(log.studentId, {
          id: log.studentId,
          name: log.studentName,
          email: log.studentEmail,
          problemId: log.problemId,
          problemTitle: log.problemTitle,
          status: "in-progress",
          attempts: 0,
          testsPassed: 0,
          testsTotal: 3,
          timeSpent: 0,
          lastActivity: log.timestamp,
          chatMessages: [],
          code: "",
        })
      }

      const student = studentMap.get(log.studentId)

      if (log.action === "chat") {
        student.chatMessages.push({
          role: log.data.role,
          content: log.data.message,
          timestamp: new Date(log.timestamp),
        })
      } else if (log.action === "code_run") {
        student.attempts++
        student.code = log.data.code
      } else if (log.action === "code_submit") {
        student.status = "completed"
        student.testsPassed = log.data.results.filter((r: any) => r.passed).length
        student.code = log.data.code
      }

      student.lastActivity = new Date(log.timestamp)
    })

    // Merge with mock data
    const liveStudents = Array.from(studentMap.values())
    if (liveStudents.length > 0) {
      setStudents([...liveStudents, ...mockStudentData])
    }
  }, [])

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

  if (!user || userRole !== "instructor") {
    return <AccessDeniedToast role="instructor" />
  }

  return <InstructorDashboard students={students} />
}