"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

type Student = {
  id: string
  name: string
  email: string
  problemTitle: string
  status: "completed" | "in-progress" | "not-started"
  attempts: number
  testsPassed: number
  testsTotal: number
  timeSpent: number
  code: string
}

export function StudentDetail({ student }: { student: Student }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  const successRate = Math.round((student.testsPassed / student.testsTotal) * 100)

  useEffect(() => {
    const loadChatMessages = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, data, created_at")
        .eq("student_id", student.id)
        .eq("problem_title", student.problemTitle)
        .eq("action", "chat")
        .order("created_at", { ascending: true }) // oldest first from Supabase

      if (error) {
        console.error("Failed to load chat messages:", error)
      } else if (data) {
        const messages: ChatMessage[] = data
          .map((log: any) => ({
            id: log.id,
            role: log.data.role,
            content: log.data.message,
            timestamp: log.created_at,
          }))
          // sort just in case and reverse so newest first
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .reverse() // now newest is first

        setChatMessages(messages)
      }

      setLoading(false)
    }

    loadChatMessages()
  }, [student.id, student.problemTitle])

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{student.name}</h2>
        <p className="text-(--color-muted-foreground)">Problem: {student.problemTitle}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-(--color-card)">
          <p className="text-xs text-(--color-muted-foreground) mb-1">Attempts</p>
          <p className="text-2xl font-bold">{student.attempts}</p>
        </Card>
        <Card className="p-4 bg-(--color-card)">
          <p className="text-xs text-(--color-muted-foreground) mb-1">Success Rate</p>
          <p className="text-2xl font-bold">{successRate}%</p>
        </Card>
        <Card className="p-4 bg-(--color-card)">
          <p className="text-xs text-(--color-muted-foreground) mb-1">Time Spent</p>
          <p className="text-2xl font-bold">{student.timeSpent}m</p>
        </Card>
        <Card className="p-4 bg-(--color-card)">
          <p className="text-xs text-(--color-muted-foreground) mb-1">AI Messages</p>
          <p className="text-2xl font-bold">{chatMessages.length}</p>
        </Card>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="chat" className="flex-1">
            AI Chat Log
          </TabsTrigger>
          <TabsTrigger value="code" className="flex-1">
            Submitted Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card className="p-4 max-h-[500px] overflow-y-auto">
            {loading ? (
              <p className="text-sm text-(--color-muted-foreground)">Loading chat messages...</p>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-50 border-l-4 border-(--color-primary-blue)"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        {message.role === "user" ? student.name : "AI Assistant"}
                      </span>
                      <span className="text-xs text-(--color-muted-foreground)">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="p-4 bg-[#1e1e1e]">
            <div className="mb-2 text-sm text-gray-300">solution.js</div>
            <pre className="text-white font-mono text-sm overflow-x-auto">
              <code>{student.code}</code>
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
