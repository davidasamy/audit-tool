"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { StudentList } from "@/components/student-list"
import { StudentDetail } from "@/components/student-detail"
import {
  getClassSettings,
  upsertClassSettings,
  uploadLectureNotes,
  getLectureNotes,
  deleteLectureNote,
  type ClassSettings,
} from "@/lib/class-settings-utils"
import { AlertCircle, Loader2, Trash2, Upload } from "lucide-react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Student = {
  id: string
  name: string
  email: string
  problemId: string
  problemTitle: string
  status: "completed" | "in-progress" | "not-started"
  attempts: number
  testsPassed: number
  testsTotal: number
  timeSpent: number
  lastActivity: Date
  chatMessages: ChatMessage[]
  code: string
}

type ClassInfo = {
  id: string
  name: string
}

type AssignmentInfo = {
  id: string
  title: string
}

export function InstructorDashboard({
  students,
  classes,
  assignments,
}: {
  students: Student[]
  classes: ClassInfo[]
  assignments: AssignmentInfo[]
}) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(
    classes.length > 0 ? classes[0] : null
  )
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentInfo | null>(
    assignments.length > 0 ? assignments[0] : null
  )

  const completedCount = students.filter((s) => s.status === "completed").length
  const avgTimeSpent =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + s.timeSpent, 0) / students.length)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-yellow-50">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
              <p className="text-gray-600">Monitor student progress and AI interactions</p>
            </div>

            {/* Class & Assignment Dropdowns */}
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Select Class</label>
                <select
                  value={selectedClass?.id || ""}
                  onChange={(e) => {
                    const found = classes.find((c) => c.id === e.target.value)
                    setSelectedClass(found || null)
                  }}
                  className="mt-1 block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Select Assignment</label>
                <select
                  value={selectedAssignment?.id || ""}
                  onChange={(e) => {
                    const found = assignments.find((a) => a.id === e.target.value)
                    setSelectedAssignment(found || null)
                  }}
                  className="mt-1 block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-2 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-4xl font-bold">{students.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-4xl font-bold">{completedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Time Spent</p>
                {/* <p className="text-4xl font-bold">{avgTimeSpent}m</p> */}
                <p className="text-4xl font-bold">34m</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Student List */}
          <div className="lg:col-span-1">
            <StudentList
              students={students}
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
            />
          </div>

          {/* Right: split into 3/4 and 1/4 */}
          <div className="lg:col-span-3 grid grid-cols-4 gap-6">
            {/* Student Detail (3/4 width) */}
            <div className="col-span-3">
              {selectedStudent ? (
                <StudentDetail student={selectedStudent} />
              ) : (
                <Card className="p-12 text-center">
                  <h3 className="text-xl font-bold mb-2">Select a Student</h3>
                  <p className="text-gray-600">
                    Choose a student from the list to view their progress and AI interactions
                  </p>
                </Card>
              )}
            </div>

            {/* Class Settings (1/4 width) */}
            <div className="col-span-1">
              {selectedClass && <ClassSettingsPanel classInfo={selectedClass} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------
// Class Settings Component
// ---------------------------------
function ClassSettingsPanel({ classInfo }: { classInfo: ClassInfo }) {
  const [cooldown, setCooldown] = useState(0)
  const [restricted, setRestricted] = useState(false)
  const [lectureNotes, setLectureNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load settings when class changes
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      setError(null)

      const settings = await getClassSettings(classInfo.id)

      if (settings) {
        setCooldown(settings.cooldownSeconds)
        setRestricted(settings.restrictedMode)
        setLectureNotes(settings.lectureNoteFiles)
      } else {
        // No settings yet, use defaults
        setCooldown(0)
        setRestricted(false)
        const files = await getLectureNotes(classInfo.id)
        setLectureNotes(files)
      }

      setLoading(false)
    }

    loadSettings()
  }, [classInfo.id])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const files = Array.from(e.target.files)
    const result = await uploadLectureNotes(classInfo.id, files)

    if (result.success) {
      setSuccess(`Successfully uploaded ${result.uploadedFiles.length} file(s)`)
      // Refresh the file list
      const updatedFiles = await getLectureNotes(classInfo.id)
      setLectureNotes(updatedFiles)
    } else {
      setError(`Upload errors: ${result.errors.join(", ")}`)
    }

    setUploading(false)

    // Clear the input
    e.target.value = ""
  }

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    const success = await deleteLectureNote(filePath)

    if (success) {
      setSuccess("File deleted successfully")
      // Refresh the file list
      const updatedFiles = await getLectureNotes(classInfo.id)
      setLectureNotes(updatedFiles)
    } else {
      setError("Failed to delete file")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const result = await upsertClassSettings(classInfo.id, {
      cooldownSeconds: cooldown,
      restrictedMode: restricted,
    })

    if (result) {
      setSuccess("Settings saved successfully!")
    } else {
      setError("Failed to save settings")
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold mb-4">Settings</h3>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Cooldown */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700 text-sm">
          Chat Cooldown (seconds)
        </label>
        <input
          type="number"
          min={0}
          value={cooldown}
          onChange={(e) => setCooldown(Number(e.target.value))}
          className="w-24 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum time between student chat messages
        </p>
      </div>

      {/* Lecture Notes Upload */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700 text-sm">
          Lecture Notes (PDF)
        </label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-3 cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400" />
          )}
          <span className="text-xs text-gray-500 mt-1">
            {uploading ? "Uploading..." : "Click to upload PDFs"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {lectureNotes.length > 0 && (
          <div className="mt-2 space-y-1">
            {lectureNotes.map((filePath) => {
              const fileName = filePath.split("/").pop() || filePath
              return (
                <div
                  key={filePath}
                  className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded"
                >
                  <span className="truncate flex-1">{fileName}</span>
                  <button
                    onClick={() => handleDeleteFile(filePath)}
                    className="ml-2 text-red-600 hover:text-red-800"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Restricted Mode */}
      <div className="mb-4 flex items-start gap-2">
        <input
          type="checkbox"
          checked={restricted}
          onChange={(e) => setRestricted(e.target.checked)}
          id={`restricted-${classInfo.id}`}
          className="mt-1"
        />
        <label htmlFor={`restricted-${classInfo.id}`} className="text-sm">
          <span className="font-medium text-gray-700">Restricted Mode</span>
          <p className="text-xs text-gray-500">
            AI only provides hints based on uploaded lecture notes
          </p>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </button>
    </Card>
  )
}