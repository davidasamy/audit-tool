// Client-side logger for tracking student activity
export type LogEntry = {
  studentId: string
  studentName: string
  studentEmail: string
  problemId: string
  problemTitle: string
  action: "chat" | "code_run" | "code_submit"
  data: any
  timestamp: Date
}

class StudentLogger {
  private logs: LogEntry[] = []

  log(entry: Omit<LogEntry, "timestamp">) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    }
    this.logs.push(logEntry)

    // In a real app, this would send to a backend API
    console.log("[v0] Student activity logged:", logEntry)

    // Store in localStorage for demo purposes
    if (typeof window !== "undefined") {
      const existingLogs = localStorage.getItem("student_logs")
      const allLogs = existingLogs ? JSON.parse(existingLogs) : []
      allLogs.push(logEntry)
      localStorage.setItem("student_logs", JSON.stringify(allLogs))
    }
  }

  getLogs(): LogEntry[] {
    if (typeof window !== "undefined") {
      const existingLogs = localStorage.getItem("student_logs")
      return existingLogs ? JSON.parse(existingLogs) : []
    }
    return this.logs
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== "undefined") {
      localStorage.removeItem("student_logs")
    }
  }
}

export const studentLogger = new StudentLogger()
