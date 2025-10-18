"use client"

import { useState, useEffect, useRef } from "react"
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
  const [pyodideReady, setPyodideReady] = useState(false)
  const pyodideRef = useRef<any>(null)

  const studentInfo = {
    studentId: "demo-student",
    studentName: "Demo Student",
    studentEmail: "demo@example.com",
  }

  // Initialize Pyodide on component mount
  useEffect(() => {
    const initPyodide = async () => {
      try {
        const pyodide = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        })
        pyodideRef.current = pyodide
        setPyodideReady(true)
      } catch (error) {
        console.error("Failed to load Pyodide:", error)
        setTestResults([
          {
            passed: false,
            input: {},
            expected: null,
            actual: null,
            error: "Failed to load Python environment",
          },
        ])
      }
    }

    if (!(window as any).loadPyodide) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
      script.async = true
      script.onload = initPyodide
      script.onerror = () => {
        console.error("Failed to load Pyodide script")
        setPyodideReady(false)
      }
      document.body.appendChild(script)
    } else {
      initPyodide()
    }
  }, [])

  const runTests = async () => {
    if (!pyodideReady || !pyodideRef.current) {
      setTestResults([
        {
          passed: false,
          input: {},
          expected: null,
          actual: null,
          error: "Python environment is not ready. Please wait...",
        },
      ])
      return
    }

    setIsRunning(true)

    studentLogger.log({
      ...studentInfo,
      problemId: problem.id,
      problemTitle: problem.title,
      action: "code_run",
      data: { code, timestamp: new Date() },
    })

    try {
      const pyodide = pyodideRef.current

      // Execute user code to define the solution function
      await pyodide.runPythonAsync(code)

      // Get the solution function from Python globals
      const userFunction = pyodide.globals.get("solution")

      if (!userFunction) {
        throw new Error('Function "solution" not found. Please define a function named "solution".')
      }

      const results: TestResult[] = []

      // Run each test case
      for (const testCase of problem.testCases) {
        try {
          // Call the Python function with test inputs
          const actual = await pyodide.runPythonAsync(
            `solution(${JSON.stringify(testCase.input.nums)}, ${testCase.input.target})`
          )

          // Convert Python result to JavaScript
          const actualValue = actual.toJs ? actual.toJs() : actual

          // Sort if arrays for comparison
          const actualSorted = Array.isArray(actualValue)
            ? [...actualValue].sort((a, b) => a - b)
            : actualValue
          const expectedSorted = Array.isArray(testCase.expected)
            ? [...testCase.expected].sort((a, b) => a - b)
            : testCase.expected

          const passed = JSON.stringify(actualSorted) === JSON.stringify(expectedSorted)

          results.push({
            passed,
            input: testCase.input,
            expected: testCase.expected,
            actual: actualValue,
          })
        } catch (error) {
          results.push({
            passed: false,
            input: testCase.input,
            expected: testCase.expected,
            actual: null,
            error: (error as Error).message,
          })
        }
      }

      setTestResults(results)

      // Log successful submission
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
    } finally {
      setIsRunning(false)
    }
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
                  disabled={isRunning || !pyodideReady}
                  className="bg-(--color-primary-blue) hover:bg-(--color-primary-blue)/90"
                >
                  {!pyodideReady ? "Loading Python..." : isRunning ? "Running Tests..." : "Run Tests"}
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