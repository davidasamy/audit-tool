"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabaseLogger } from "@/lib/supabase-logger"

type Problem = {
  id: string
  title: string
  description: string
}

type StudentInfo = {
  studentId: string
  studentName: string
  studentEmail: string
  classId: string
  assignmentId: string
}

export function AIChatbot({
  problemContext,
  studentInfo,
}: {
  problemContext: Problem
  studentInfo?: StudentInfo
}) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { problemContext },
    }),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || status === "streaming") return

    if (studentInfo) {
      // Log to Supabase
      await supabaseLogger.log({
        studentId: studentInfo.studentId,
        studentName: studentInfo.studentName,
        studentEmail: studentInfo.studentEmail,
        classId: studentInfo.classId,
        assignmentId: studentInfo.assignmentId,
        problemId: problemContext.id,
        problemTitle: problemContext.title,
        action: "chat",
        data: { message: input, role: "user" },
      })
    }

    // Send message with proper format for ai-sdk
    sendMessage({
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: input }],
    })
    setInput("")
  }

  useEffect(() => {
    if (messages.length > 0 && studentInfo) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        const text =
          (lastMessage as any).parts?.find((p: any) => p.type === "text")?.text ??
          (lastMessage as any).content ??
          ""
        if (text) {
          // Log assistant response to Supabase
          supabaseLogger.log({
            studentId: studentInfo.studentId,
            studentName: studentInfo.studentName,
            studentEmail: studentInfo.studentEmail,
            classId: studentInfo.classId,
            assignmentId: studentInfo.assignmentId,
            problemId: problemContext.id,
            problemTitle: problemContext.title,
            action: "chat",
            data: { message: text, role: "assistant" },
          })
        }
      }
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-(--color-background)">
      {/* Chat Header */}
      <div className="p-4 border-b border-(--color-border) bg-(--color-card)">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-(--color-primary-blue) to-(--color-primary-yellow) flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold">AI Learning Assistant</h3>
            <p className="text-xs text-(--color-muted-foreground)">Here to guide your learning</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === "user"
                  ? "bg-(--color-primary-blue) text-white"
                  : "bg-(--color-card)"
              }`}
            >
              {/* Handle both parts-based and content-based messages */}
              {Array.isArray((message as any).parts) && (message as any).parts.length > 0 ? (
                (message as any).parts.map((part: any, index: number) =>
                  part?.type === "text" && typeof part?.text === "string" ? (
                    <p key={index} className="text-sm whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  ) : null
                )
              ) : typeof (message as any).content === "string" ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {(message as any).content}
                </p>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed italic opacity-70">
                  (no displayable text)
                </p>
              )}
              <span
                className={`text-xs mt-2 block ${
                  message.role === "user" ? "text-blue-100" : "text-(--color-muted-foreground)"
                }`}
              >
                {new Date().toLocaleTimeString()}
              </span>
            </Card>
          </div>
        ))}
        {status === "streaming" && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-(--color-card)">
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-(--color-primary-blue) animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-(--color-primary-yellow) animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-(--color-primary-red) animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-(--color-border) bg-(--color-card)">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the problem..."
            className="flex-1 px-4 py-2 rounded-lg border border-(--color-border) focus:outline-none focus:ring-2 focus:ring-(--color-primary-blue)"
            disabled={status === "streaming"}
          />
          <Button
            type="submit"
            disabled={!input.trim() || status === "streaming"}
            className="bg-(--color-primary-blue) hover:bg-(--color-primary-blue)/90"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}