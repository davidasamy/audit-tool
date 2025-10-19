import { useEffect, useRef, useState } from "react"

type CodeEditorProps = {
  code: string
  onChange: (code: string) => void
  pyodide?: any
}

declare global {
  interface Window {
    ace: any
  }
}

export function CodeEditor({ code, onChange, pyodide }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<any>(null)
  const outputRef = useRef<HTMLDivElement>(null)
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
      if (outputRef.current) {
        outputRef.current.textContent = ""
      }

      const editorCode = editorInstanceRef.current.getValue()
      
      // Clear the output buffer before running
      await pyodide.runPythonAsync("_output_buffer.truncate(0); _output_buffer.seek(0)")
      
      // Run user code
      const result = await pyodide.runPythonAsync(editorCode)

      // Get captured output
      const output = await pyodide.runPythonAsync("_output_buffer.getvalue()")
      
      if (outputRef.current) {
        outputRef.current.textContent = output || ""
        
        // Also append return value if there is one
        if (result !== undefined) {
          outputRef.current.textContent += String(result)
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (outputRef.current) {
        outputRef.current.textContent = errorMsg
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
    <div className="flex flex-col h-2/3 bg-white text-gray-900">
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

      {/* Editor and Output Container */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Ace Editor */}
        <div
          ref={editorRef}
          className="flex-1 min-h-0 ace_editor"
          style={{ height: "100%" }}
        />

        {/* Output Panel */}
        <div className="h-1/4 border-t border-gray-300 flex flex-col min-h-0">
          <div className="px-3 py-2 text-xs text-gray-600 bg-gray-100 border-b border-gray-300 font-semibold">
            Output
          </div>
          <div
            ref={outputRef}
            className="flex-1 overflow-auto bg-white text-gray-900 font-mono text-sm p-3 whitespace-pre-wrap break-words border border-gray-200"
          />
        </div>
      </div>
    </div>
  )
}