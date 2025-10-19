import { supabase } from "./supabase"

export type ClassSettings = {
  id: string
  classId: string
  cooldownSeconds: number
  restrictedMode: boolean
  lectureNoteFiles: string[] // Array of file paths in storage
  createdAt: Date
  updatedAt: Date
}

/**
 * Get settings for a specific class
 */
export async function getClassSettings(classId: string): Promise<ClassSettings | null> {
  try {
    const { data, error } = await supabase
      .from("class_settings")
      .select("*")
      .eq("class_id", classId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, return defaults
        return null
      }
      throw error
    }

    // Get list of lecture note files from storage
    const { data: files } = await supabase.storage
      .from("lecture-notes")
      .list(classId)

    const lectureNoteFiles = files?.map((file) => `${classId}/${file.name}`) || []

    return {
      id: data.id,
      classId: data.class_id,
      cooldownSeconds: data.cooldown_seconds,
      restrictedMode: data.restricted_mode,
      lectureNoteFiles,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error("Error fetching class settings:", error)
    return null
  }
}

/**
 * Update or create class settings
 */
export async function upsertClassSettings(
  classId: string,
  settings: {
    cooldownSeconds: number
    restrictedMode: boolean
  }
): Promise<ClassSettings | null> {
  try {
    const { data, error } = await supabase
      .from("class_settings")
      .upsert(
        {
          class_id: classId,
          cooldown_seconds: settings.cooldownSeconds,
          restricted_mode: settings.restrictedMode,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "class_id",
        }
      )
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      classId: data.class_id,
      cooldownSeconds: data.cooldown_seconds,
      restrictedMode: data.restricted_mode,
      lectureNoteFiles: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error("Error upserting class settings:", error)
    return null
  }
}

/**
 * Upload lecture notes to storage
 */
export async function uploadLectureNotes(
  classId: string,
  files: File[]
): Promise<{ success: boolean; uploadedFiles: string[]; errors: string[] }> {
  const uploadedFiles: string[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      const filePath = `${classId}/${file.name}`

      const { error } = await supabase.storage
        .from("lecture-notes")
        .upload(filePath, file, {
          upsert: true, // Overwrite if exists
          contentType: file.type,
        })

      if (error) {
        errors.push(`${file.name}: ${error.message}`)
      } else {
        uploadedFiles.push(filePath)
      }
    } catch (error) {
      errors.push(`${file.name}: ${(error as Error).message}`)
    }
  }

  return {
    success: errors.length === 0,
    uploadedFiles,
    errors,
  }
}

/**
 * Get all lecture note files for a class
 */
export async function getLectureNotes(classId: string): Promise<string[]> {
  try {
    const { data: files, error } = await supabase.storage
      .from("lecture-notes")
      .list(classId)

    if (error) throw error

    return files?.map((file) => `${classId}/${file.name}`) || []
  } catch (error) {
    console.error("Error fetching lecture notes:", error)
    return []
  }
}

/**
 * Delete a lecture note file
 */
export async function deleteLectureNote(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from("lecture-notes").remove([filePath])

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting lecture note:", error)
    return false
  }
}

/**
 * Download a lecture note file
 */
export async function downloadLectureNote(filePath: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage.from("lecture-notes").download(filePath)

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error downloading lecture note:", error)
    return null
  }
}

/**
 * Get public URL for a lecture note (for viewing)
 */
export async function getLectureNoteUrl(filePath: string): Promise<string | null> {
  try {
    const { data } = supabase.storage.from("lecture-notes").getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error("Error getting lecture note URL:", error)
    return null
  }
}

/**
 * Check if student can send a chat message based on cooldown
 */
export async function canSendChatMessage(
  classId: string,
  studentId: string
): Promise<{ canSend: boolean; waitTime: number }> {
  try {
    const settings = await getClassSettings(classId)

    if (!settings || settings.cooldownSeconds === 0) {
      return { canSend: true, waitTime: 0 }
    }

    // Get the last chat message from this student in this class
    const { data: lastMessage, error } = await supabase
      .from("activity_logs")
      .select("created_at")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("action", "chat")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // Error other than "no rows returned"
      throw error
    }

    if (!lastMessage) {
      // No previous messages, can send
      return { canSend: true, waitTime: 0 }
    }

    const lastMessageTime = new Date(lastMessage.created_at).getTime()
    const now = Date.now()
    const elapsedSeconds = (now - lastMessageTime) / 1000

    if (elapsedSeconds >= settings.cooldownSeconds) {
      return { canSend: true, waitTime: 0 }
    }

    const waitTime = Math.ceil(settings.cooldownSeconds - elapsedSeconds)
    return { canSend: false, waitTime }
  } catch (error) {
    console.error("Error checking cooldown:", error)
    // On error, allow the message
    return { canSend: true, waitTime: 0 }
  }
}