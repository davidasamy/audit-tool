import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface AssignmentHeaderProps {
  classId: string
}

export function AssignmentHeader({ classId }: AssignmentHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <Link href={`/student/class/${classId}`}>
        <Button variant="ghost" className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Class
        </Button>
      </Link>
    </header>
  )
}
