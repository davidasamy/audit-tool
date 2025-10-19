import { supabase } from "./supabase"

export type LogEntry = {
  id?: string
  studentId: string
  studentName: string
  studentEmail: string
  classId: string
  assignmentId: string
  problemId: string
  problemTitle: string
  action: "chat" | "code_run" | "code_submit"
  data: any
  timestamp: Date
}

class SupabaseLogger {
  async log(entry: Omit<LogEntry, "id" | "timestamp">): Promise<void> {
    try {
      const logEntry = {
        student_id: entry.studentId,
        student_name: entry.studentName,
        student_email: entry.studentEmail,
        class_id: entry.classId,
        assignment_id: entry.assignmentId,
        problem_id: entry.problemId,
        problem_title: entry.problemTitle,
        action: entry.action,
        data: entry.data,
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("activity_logs").insert([logEntry])

      if (error) {
        // do not throw up to caller, just warn
        console.warn("Error logging activity:", error)
        return
      }

      // debug log
      console.debug("[SupabaseLogger] Student activity logged:", logEntry)
    } catch (error) {
      console.warn("Failed to log activity:", error)
    }
  }

  async getLogs(classId?: string, studentId?: string, opts?: { isCanceled?: () => boolean }) {
    try {
      let query = supabase.from("activity_logs").select("*")

      if (classId) query = query.eq("class_id", classId)
      if (studentId) query = query.eq("student_id", studentId)

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      if (opts?.isCanceled?.()) return []

      return (
        data?.map((log: any) => ({
          id: log.id,
          studentId: log.student_id,
          studentName: log.student_name,
          studentEmail: log.student_email,
          classId: log.class_id,
          assignmentId: log.assignment_id,
          problemId: log.problem_id,
          problemTitle: log.problem_title,
          action: log.action,
          data: log.data,
          timestamp: new Date(log.created_at),
        })) ?? []
      )
    } catch (error) {
      console.error("Error fetching logs:", error)
      return []
    }
  }

  async clearLogs(classId?: string) {
    try {
      let query = supabase.from("activity_logs").delete()

      if (classId) query = query.eq("class_id", classId)

      const { error } = await query

      if (error) throw error
      console.log("Logs cleared successfully")
    } catch (error) {
      console.error("Error clearing logs:", error)
    }
  }
}

export const supabaseLogger = new SupabaseLogger()
