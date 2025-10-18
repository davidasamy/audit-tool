"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProblemDescription } from "@/components/problem-description"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { AIChatbot } from "@/components/ai-chatbot"
import { studentLogger } from "@/lib/student-logger"

type Problem = {
  id: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  description: string
  examples: Array<{ input: string; output: string; explanation: string }>
  constraints: string[]
  starterCode: string
  testCases: Array<{ input: any; expected: any }>
}

type TestResult = {
  passed: boolean
  input: any
  expected: any
  actual: any
  error?: string
}

export function StudentWorkspace({ problem }: { problem: Problem }) {
  const [code, setCode] = useState(problem.starterCode)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const studentInfo = {
    studentId: "demo-student",
    studentName: "Demo Student",
    studentEmail: "demo@example.com",
  }

  const runTests = () => {
    setIsRunning(true)

    studentLogger.log({
      ...studentInfo,
      problemId: problem.id,
      problemTitle: problem.title,
      action: "code_run",
      data: { code, timestamp: new Date() },
    })

    // Simulate test execution
    setTimeout(() => {
      try {
        // eslint-disable-next-line no-eval
        const userFunction = eval(`(${code})`)

        const results = problem.testCases.map((testCase) => {
          try {
            const actual = userFunction(testCase.input.nums, testCase.input.target)
            const passed = JSON.stringify(actual?.sort()) === JSON.stringify(testCase.expected.sort())

            return {
              passed,
              input: testCase.input,
              expected: testCase.expected,
              actual,
            }
          } catch (error) {
            return {
              passed: false,
              input: testCase.input,
              expected: testCase.expected,
              actual: null,
              error: (error as Error).message,
            }
          }
        })

        setTestResults(results)

        const allPassed = results.every((r) => r.passed)
        if (allPassed) {
          studentLogger.log({
            ...studentInfo,
            problemId: problem.id,
            problemTitle: problem.title,
            action: "code_submit",
            data: { code, results, timestamp: new Date() },
          })
        }
      } catch (error) {
        setTestResults([
          {
            passed: false,
            input: {},
            expected: null,
            actual: null,
            error: (error as Error).message,
          },
        ])
      }

      setIsRunning(false)
    }, 500)
  }

  return (
    <div className="flex h-screen bg-(--color-background)">
      {/* Left Panel - Problem Description */}
      <div className="w-1/2 border-r border-(--color-border) overflow-y-auto">
        <div className="p-6">
          <ProblemDescription problem={problem} />
        </div>
      </div>

      {/* Right Panel - Code Editor & Chat */}
      <div className="w-1/2 flex flex-col">
        <Tabs defaultValue="code" className="flex-1 flex flex-col">
          <div className="border-b border-(--color-border) px-6 pt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="code" className="flex-1">
                Code Editor
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                AI Assistant
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="code" className="flex-1 flex flex-col m-0 p-0">
            <div className="flex-1 flex flex-col">
              <CodeEditor code={code} onChange={setCode} />

              <div className="border-t border-(--color-border) p-4 bg-(--color-card)">
                <Button
                  onClick={runTests}
                  disabled={isRunning}
                  className="bg-(--color-primary-blue) hover:bg-(--color-primary-blue)/90"
                >
                  {isRunning ? "Running Tests..." : "Run Tests"}
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="border-t border-(--color-border) overflow-y-auto max-h-64">
                  <TestResults results={testResults} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 m-0 p-0">
            <AIChatbot problemContext={problem} studentInfo={studentInfo} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
