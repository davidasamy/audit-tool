import { useEffect, useRef, useState } from "react"

type CodeEditorProps = {
  code: string
  onChange: (code: string) => void
  pyodide?: any
  onOutput?: (output: string) => void
}

declare global {
  interface Window {
    ace: any
  }
}

export function CodeEditor({ code, onChange, pyodide, onOutput }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Load Ace editor script
  useEffect(() => {
    if (!window.ace) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/ace/1.43.0/ace.js"
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  // Initialize Ace editor (once)
  useEffect(() => {
    const init = async () => {
      try {
        // Wait for Ace to load
        let attempts = 0
        while (!window.ace && attempts < 50) {
          await new Promise((r) => setTimeout(r, 100))
          attempts++
        }

        if (!window.ace) throw new Error("Ace editor failed to load")

        const ace = window.ace
        const editor = ace.edit(editorRef.current, {
          mode: "ace/mode/python",
          theme: "ace/theme/monokai",
          fontSize: "14px",
          wrap: true,
        })
        editor.session.setTabSize(4)
        editor.session.setUseSoftTabs(true)
        editor.setValue(code, -1)
        editor.navigateFileEnd()

        // Sync changes back
        editor.session.on("change", () => {
          onChange(editor.getValue())
        })

        editorInstanceRef.current = editor
      } catch (error) {
        console.error("Failed to initialize Ace:", error)
      }
    }

    init()
  }, [])

  const executeCode = async () => {
    if (!pyodide || !editorInstanceRef.current) return

    setIsRunning(true)

    try {
      // Clear output through callback
      if (onOutput) {
        onOutput("")
      }

      const editorCode = editorInstanceRef.current.getValue()
      
      // Set up output capture
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
_captured_output = StringIO()
_original_stdout = sys.stdout
sys.stdout = _captured_output
      `)
      
      // Run user code
      let result
      try {
        result = await pyodide.runPythonAsync(editorCode)
      } finally {
        // Restore stdout and get captured output
        const output = await pyodide.runPythonAsync(`
sys.stdout = _original_stdout
_captured_output.getvalue()
        `)
        
        let displayText = output || ""
        
        // Also append return value if there is one and it's not None
        if (result !== undefined && result !== null) {
          const resultStr = String(result)
          if (resultStr !== "None" && resultStr !== "") {
            if (displayText) displayText += "\n"
            displayText += resultStr
          }
        }
        
        // Send output to parent component
        if (onOutput) {
          onOutput(displayText)
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      // Send error to parent component
      if (onOutput) {
        onOutput(errorMsg)
      }
      
      // Ensure stdout is restored even on error
      try {
        await pyodide.runPythonAsync("sys.stdout = _original_stdout")
      } catch (e) {
        // ignore restoration errors
      }
    } finally {
      setIsRunning(false)
    }
  }

  // Handle keyboard shortcut (Shift+Enter)
  useEffect(() => {
    if (!editorInstanceRef.current) return

    editorInstanceRef.current.commands.addCommand({
      name: "run",
      bindKey: { win: "Shift-Enter", mac: "Shift-Enter" },
      exec: executeCode,
    })
  }, [pyodide])

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-300">
        <span className="text-sm text-gray-700 font-medium">solution.py</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {!pyodide ? "Loading..." : isRunning ? "Running..." : "Ready"}
          </span>
          <button
            onClick={executeCode}
            disabled={!pyodide || isRunning}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors font-medium"
          >
            {isRunning ? "Running..." : "Run (Shift+Enter)"}
          </button>
        </div>
      </div>

      {/* Editor Container - Full height */}
      <div className="flex-1 min-h-0">
        {/* Ace Editor */}
        <div
          ref={editorRef}
          className="h-full ace_editor"
          style={{ height: "100%" }}
        />
      </div>
    </div>
  )
}
