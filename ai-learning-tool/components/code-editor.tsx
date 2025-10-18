"use client"

import { useEffect, useRef } from "react"

type CodeEditorProps = {
  code: string
  onChange: (code: string) => void
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [code])

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] text-white">
      <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e] text-sm text-gray-300">solution.js</div>
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
