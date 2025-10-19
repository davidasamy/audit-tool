"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ProblemDescription } from "@/components/problem-description"
import { CodeEditor } from "@/components/code-editor"
import { TestResults } from "@/components/test-results"
import { AIChatbot } from "@/components/ai-chatbot"
import { supabaseLogger } from "@/lib/supabase-logger"
import { useAuth } from "@/lib/auth-context"
import { Code2, PlayCircle, Sparkles, Terminal, CheckCircle } from "lucide-react"

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

interface StudentWorkspaceProps {
  problem: Problem
  assignmentId: string
  classId: string
}

export function StudentWorkspace({ problem, assignmentId, classId }: StudentWorkspaceProps) {
  const [code, setCode] = useState(problem.starterCode)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [output, setOutput] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [activeView, setActiveView] = useState<"problem" | "chat">("problem")
  const [activeBottomTab, setActiveBottomTab] = useState<"output" | "tests">("output")
  const pyodideRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const { user } = useAuth()

  const studentInfo = user
    ? {
        studentId: user.id,
        studentName: user.email?.split("@")[0] || "Student",
        studentEmail: user.email || "",
        classId,
        assignmentId,
      }
    : undefined

  useEffect(() => {
    mountedRef.current = true

    const initPyodide = async () => {
      try {
        if (!(window as any).loadPyodide) {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
          script.async = true
          script.onload = async () => {
            if (!mountedRef.current) return
            const pyodide = await (window as any).loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            })
            pyodideRef.current = pyodide
            if (mountedRef.current) setPyodideReady(true)
          }
          script.onerror = () => {
            console.error("Failed to load Pyodide script")
            if (mountedRef.current) setPyodideReady(false)
          }
          document.body.appendChild(script)
        } else {
          const pyodide = await (window as any).loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          })
          pyodideRef.current = pyodide
          if (mountedRef.current) setPyodideReady(true)
        }
      } catch (error) {
        console.error("Failed to load Pyodide:", error)
        if (mountedRef.current) {
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
    }

    initPyodide()

    return () => {
      mountedRef.current = false
      try {
        if (pyodideRef.current && typeof pyodideRef.current.terminate === "function") {
          pyodideRef.current.terminate()
        }
      } catch (e) {
        // ignore
      }
      pyodideRef.current = null
    }
  }, [])

  const buildFunctionCall = (input: any): string => {
    const args = Object.entries(input).map(([, value]) => JSON.stringify(value))
    return `solution(${args.join(", ")})`
  }

  const runTests = async () => {
    if (isRunning) return
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

    if (studentInfo) {
      supabaseLogger
        .log({
          ...studentInfo,
          problemId: problem.id,
          problemTitle: problem.title,
          action: "code_run",
          data: { code, timestamp: new Date() },
        })
        .catch((e) => {
          console.warn("Logger failed (code_run):", e)
        })
    }

    try {
      const pyodide = pyodideRef.current

      // Capture stdout
      let capturedOutput = ""
      const originalStdout = pyodide.runPython(`
        import sys
        from io import StringIO
        
        # Create a StringIO object to capture stdout
        captured_output = StringIO()
        original_stdout = sys.stdout
        sys.stdout = captured_output
      `)

      await pyodide.runPythonAsync(code)

      // Get the captured output
      capturedOutput = pyodide.runPython(`
        # Get the captured output and restore stdout
        output_value = captured_output.getvalue()
        sys.stdout = original_stdout
        output_value
      `)

      if (mountedRef.current) {
        setOutput(capturedOutput || "No output")
      }

      const userFunction = pyodide.globals.get("solution")

      if (!userFunction) {
        throw new Error('Function "solution" not found. Please define a function named "solution".')
      }

      const results: TestResult[] = []

      for (const testCase of problem.testCases) {
        try {
          const functionCall = buildFunctionCall(testCase.input)
          const actual = await pyodide.runPythonAsync(functionCall)

          let actualValue = actual
          if (actual && typeof actual.toJs === "function") {
            actualValue = actual.toJs()
          }

          let passed = false
          if (Array.isArray(testCase.expected) && Array.isArray(actualValue)) {
            const actualSorted = [...actualValue].sort((a, b) => (a as any) - (b as any))
            const expectedSorted = [...testCase.expected].sort((a, b) => (a as any) - (b as any))
            passed = JSON.stringify(actualSorted) === JSON.stringify(expectedSorted)
          } else {
            passed = JSON.stringify(actualValue) === JSON.stringify(testCase.expected)
          }

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

      if (mountedRef.current) setTestResults(results)

      const allPassed = results.every((r) => r.passed)
      if (allPassed && studentInfo) {
        supabaseLogger.log({
          ...studentInfo,
          problemId: problem.id,
          problemTitle: problem.title,
          action: "code_submit",
          data: { code, results, timestamp: new Date() },
        })
      }
    } catch (error) {
      if (mountedRef.current) {
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
    } finally {
      if (mountedRef.current) setIsRunning(false)
    }
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Left Panel - Problem/Chat */}
      <div className="w-2/5 flex flex-col border-r border-gray-200 min-h-0">
        {/* Toggle Buttons */}
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => setActiveView("problem")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeView === "problem"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Problem
          </button>
          <button
            onClick={() => setActiveView("chat")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 relative ${
              activeView === "chat"
                ? "text-yellow-600 border-b-2 border-yellow-500 bg-yellow-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeView === "problem" ? (
            <div className="p-4">
              <ProblemDescription problem={problem} />
            </div>
          ) : (
            <AIChatbot problemContext={problem} studentInfo={studentInfo} />
          )}
        </div>
      </div>

      {/* Right Panel - Code Editor & Tests */}
      <div className="w-3/5 flex flex-col min-h-0">
        {/* Code Editor - Takes remaining space after test results */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeEditor 
            code={code} 
            onChange={setCode} 
            pyodide={pyodideRef.current} 
            onOutput={setOutput}
            onRunTests={runTests}
            isTestRunning={isRunning}
            pyodideReady={pyodideReady}
          />
        </div>

        {/* Bottom Section - Output/Tests Tabs */}
        <div className="h-64 flex flex-col border-t border-gray-200 flex-shrink-0">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setActiveBottomTab("output")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeBottomTab === "output"
                  ? "text-green-600 border-b-2 border-green-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Output
            </button>
            <button
              onClick={() => setActiveBottomTab("tests")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeBottomTab === "tests"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Tests {testResults.length > 0 && `(${testResults.filter(r => r.passed).length}/${testResults.length})`}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {activeBottomTab === "output" ? (
              <div className="p-4 font-mono text-sm">
                {output ? (
                  <pre className="whitespace-pre-wrap text-gray-800">{output}</pre>
                ) : (
                  <div className="text-gray-500 italic">
                    Run your code to see output here...
                  </div>
                )}
              </div>
            ) : (
              testResults.length > 0 ? (
                <TestResults results={testResults} />
              ) : (
                <div className="p-4 text-gray-500 italic">
                  Run your code to see test results here...
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
