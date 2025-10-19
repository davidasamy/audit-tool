// app/student/class/[classId]/assignment/[assignmentId]/page.tsx
"use client"

import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { StudentWorkspace } from "@/components/student-workspace"

// Mock problem data - maps assignmentId to problem details
const problemData = {
  "two-sum": {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy" as const,
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    starterCode: `def solution(nums, target):
    # Write your code here
    pass`,
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] }
    ]
  },
  "reverse-string": {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy" as const,
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "The string is reversed in-place."
      }
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character."
    ],
    starterCode: `def solution(s):
    # Write your code here
    # Modify s in-place and return it
    pass`,
    testCases: [
      { input: { s: ["h","e","l","l","o"] }, expected: ["o","l","l","e","h"] }
    ]
  },
  "palindrome": {
    id: "palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy" as const,
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" is a palindrome.'
      },
      {
        input: 's = "race a car"',
        output: "false",
        explanation: '"raceacar" is not a palindrome.'
      }
    ],
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters."
    ],
    starterCode: `def solution(s):
    # Write your code here
    pass`,
    testCases: [
      { input: { s: "A man, a plan, a canal: Panama" }, expected: true },
      { input: { s: "race a car" }, expected: false },
      { input: { s: " " }, expected: true }
    ]
  },
  "binary-search": {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Medium" as const,
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
        explanation: "9 exists in nums and its index is 4"
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        output: "-1",
        explanation: "2 does not exist in nums so return -1"
      }
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order."
    ],
    starterCode: `def solution(nums, target):
    # Write your code here
    pass`,
    testCases: [
      { input: { nums: [-1,0,3,5,9,12], target: 9 }, expected: 4 },
      { input: { nums: [-1,0,3,5,9,12], target: 2 }, expected: -1 }
    ]
  },
  "linear-regression": {
    id: "linear-regression",
    title: "Linear Regression",
    difficulty: "Hard" as const,
    description: "Implement a simple linear regression model from scratch. Given arrays of x and y values, calculate the slope and intercept of the best-fit line using the least squares method.\n\nReturn a tuple (slope, intercept) rounded to 2 decimal places.",
    examples: [
      {
        input: "x = [1, 2, 3, 4, 5], y = [2, 4, 5, 4, 5]",
        output: "(0.60, 2.20)",
        explanation: "The best-fit line has slope 0.60 and intercept 2.20"
      }
    ],
    constraints: [
      "2 <= len(x) == len(y) <= 1000",
      "-1000 <= x[i], y[i] <= 1000"
    ],
    starterCode: `def solution(x, y):
    # Implement linear regression from scratch
    # Return (slope, intercept) rounded to 2 decimal places
    pass`,
    testCases: [
      { input: { x: [1, 2, 3, 4, 5], y: [2, 4, 5, 4, 5] }, expected: [0.60, 2.20] }
    ]
  }
}

const classNames = {
  cs101: "Introduction to Computer Science",
  cs201: "Data Structures and Algorithms",
  cs301: "Machine Learning Fundamentals",
}

export default function AssignmentPage({ 
  params 
}: { 
  params: Promise<{ classId: string; assignmentId: string }> 
}) {
  const { classId, assignmentId } = use(params)
  const problem = problemData[assignmentId as keyof typeof problemData]
  const className = classNames[classId as keyof typeof classNames] || "Unknown Class"

  if (!problem) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Assignment Not Found</h1>
          <Link href={`/student/class/${classId}`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <Link href={`/student/class/${classId}`}>
          <Button variant="ghost" className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {className}
          </Button>
        </Link>
      </header>
      <StudentWorkspace problem={problem} />
    </div>
  )
}