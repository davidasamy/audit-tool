"use client"

import { useEffect, useRef, useState } from "react"

type CodeEditorProps = {
  code: string
  onChange: (code: string) => void
  onExecute?: (output: string, error?: string) => void
}

export function CodeEditor({ code, onChange, onExecute }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pyodideRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        const pyodide = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        })
        pyodideRef.current = pyodide
        setIsReady(true)
      } catch (error) {
        console.error("Failed to load Pyodide:", error)
      }
    }

    // Load Pyodide script if not already loaded
    if (!(window as any).loadPyodide) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
      script.onload = initPyodide
      document.body.appendChild(script)
    } else {
      initPyodide()
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [code])

  const executeCode = async () => {
    if (!isReady || !pyodideRef.current) return

    setIsRunning(true)
    try {
      // Capture stdout
      const output: string[] = []
      const pyodide = pyodideRef.current

      // Redirect print to capture output
      pyodide.globals.get("print")

      // Run the code
      const result = await pyodide.runPythonAsync(code)

      onExecute?.(result?.toString() || "Code executed successfully", undefined)
    } catch (error) {
      onExecute?.(
        "",
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] text-white">
      <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e] text-sm text-gray-300 flex justify-between items-center">
        <span>solution.py</span>
        <button
          onClick={executeCode}
          disabled={!isReady || isRunning}
          className="px-3 py-1 text-xs bg-[#007acc] hover:bg-[#005a9e] disabled:bg-[#3e3e3e] text-white rounded transition-colors"
        >
          {!isReady ? "Loading..." : isRunning ? "Running..." : "Run"}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-4 bg-[#1e1e1e] text-white font-mono text-sm resize-none focus:outline-none"
        spellCheck={false}
        style={{
          minHeight: "400px",
          lineHeight: "1.5",
          tabSize: 2,
        }}
      />
    </div>
  )
}