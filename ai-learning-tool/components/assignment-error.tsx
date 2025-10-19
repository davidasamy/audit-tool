import { AssignmentHeader } from "@/components/assignment-header"

interface AssignmentErrorProps {
  error: string
  classId: string
}

export function AssignmentError({ error, classId }: AssignmentErrorProps) {
  return (
    <div className="min-h-screen bg-white">
      <AssignmentHeader classId={classId} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">{error}</h1>
        </div>
      </main>
    </div>
  )
}
