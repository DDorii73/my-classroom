"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Student } from "@/lib/seating-engine"

interface FixedStudentsPanelProps {
  fixedStudents: Set<number>
  students: Student[]
  onClearAll: () => void
  onRemove: (studentId: number) => void
}

export function FixedStudentsPanel({ fixedStudents, students, onClearAll, onRemove }: FixedStudentsPanelProps) {
  if (fixedStudents.size === 0) {
    return null
  }

  const fixedStudentDetails = Array.from(fixedStudents)
    .map((id) => students.find((s) => s.id === id))
    .filter(Boolean)

  return (
    <Card className="p-4 bg-yellow-50 border-2 border-yellow-300 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">고정된 자리: {fixedStudents.size}명</h3>
        <Button onClick={onClearAll} size="sm" variant="outline" className="text-xs bg-transparent">
          모두 해제
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {fixedStudentDetails.map((student) => (
          <div
            key={student!.id}
            className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-yellow-400"
          >
            <span className="font-semibold text-gray-800">{student!.id}번</span>
            <button onClick={() => onRemove(student!.id)} className="text-gray-600 hover:text-red-600 font-bold">
              ×
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
