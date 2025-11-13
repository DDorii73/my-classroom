"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Student } from "@/lib/seating-engine"

interface SeatingGridProps {
  seats: Student[] | Student[][]
  seatingType: "single" | "pair"
  fixedStudents: Set<number>
  fixedSeats: Map<number, number> // seatIndex -> studentNumber
  onToggleFix: (studentId: number, seatIndex: number) => void
  onFixSeat: (seatIndex: number, studentNumber: number) => void
  onUnfixSeat: (seatIndex: number) => void
  onPrint: () => void
  columns?: number
  boardPosition: "top" | "bottom"
  rows: number
  teamsPerLine?: number
  totalSeats: number
}

export function SeatingGrid({
  seats,
  seatingType,
  fixedStudents,
  fixedSeats,
  onToggleFix,
  onFixSeat,
  onUnfixSeat,
  onPrint,
  columns,
  boardPosition,
  rows,
  teamsPerLine,
  totalSeats,
}: SeatingGridProps) {
  const getGenderLabel = (gender: "male" | "female") => (gender === "male" ? "남" : "여")

  const handleSeatClick = (seatIndex: number, studentId?: number) => {
    if (studentId) {
      // 기존 학생이 있는 경우 기존 로직 (고정 토글)
      onToggleFix(studentId, seatIndex)
    }
    // 빈 자리 클릭 기능 제거 - 마지막 페이지에서는 랜덤 배치된 모습만 표시
  }

  const BoardDisplay = () => (
    <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-4 rounded-lg text-center font-bold text-xl mb-4 shadow-lg">
      📋 칠판
    </div>
  )

  if (seatingType === "pair") {
    const totalPairs = (seats as Student[][]).length
    const pairsPerLine = teamsPerLine || Math.ceil(totalPairs / rows)

    return (
      <div className="space-y-4">
        {boardPosition === "top" && <BoardDisplay />}

        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const startIdx = rowIndex * pairsPerLine

            return (
              <div key={rowIndex} className="border-l-4 border-blue-400 pl-3">
                <p className="text-xs text-gray-500 font-semibold mb-2">{rowIndex + 1}번 줄</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${pairsPerLine}, minmax(0, 1fr))` }}>
                  {Array.from({ length: pairsPerLine }).map((_, pairIdx) => {
                    const actualPairIdx = startIdx + pairIdx
                    const pair = (seats as Student[][])[actualPairIdx] || []
                    const fixedStudentNumber = fixedSeats.get(actualPairIdx)

                    return (
                      <Card
                        key={actualPairIdx}
                        className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 printable-seat transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="flex gap-2">
                          {pair.length > 0 ? (
                            pair.map((student, idx) => {
                              const isFixedSeat = fixedSeats.has(actualPairIdx)
                              return (
                                <button
                                  key={student.id}
                                  onClick={() => handleSeatClick(actualPairIdx, student.id)}
                                  className={`flex-1 p-3 rounded text-center transition-all duration-200 no-print hover:scale-105 active:scale-95 ${
                                    fixedStudents.has(student.id)
                                      ? "bg-yellow-300 border-2 border-yellow-500 shadow-md"
                                      : isFixedSeat
                                        ? "bg-white border-4 border-purple-500 shadow-lg animate-pulse"
                                        : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md"
                                  }`}
                                >
                                  <div className="font-bold text-lg text-gray-800">{student.id}번</div>
                                  <div className="text-sm text-gray-600 font-semibold">{getGenderLabel(student.gender)}</div>
                                </button>
                              )
                            })
                          ) : (
                            // 빈 자리 표시 (학생 수가 부족한 경우)
                            [0, 1].map((pos) => (
                              <div
                                key={pos}
                                className="flex-1 p-3 rounded text-center bg-gray-100 border border-gray-300"
                              >
                                <div className="text-gray-400 text-sm">빈 자리</div>
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {boardPosition === "bottom" && <BoardDisplay />}

        <Button onClick={onPrint} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
          인쇄하기
        </Button>
      </div>
    )
  }

  // 1명씩 앉기일 때는 teamsPerLine (1행에 배치할 학생 수)를 그대로 사용
  const studentsPerLine = seatingType === "single" 
    ? teamsPerLine || Math.ceil(totalSeats / rows)
    : teamsPerLine || Math.ceil((seats as Student[]).length / rows)
  
  // 1명씩 앉기일 때는 totalSeats를 사용하여 모든 자리 표시 (빈 자리 포함)
  const totalStudents = seatingType === "single" 
    ? totalSeats 
    : (seats as Student[]).length

  return (
    <div className="space-y-4">
      {boardPosition === "top" && <BoardDisplay />}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => {
          const startIdx = rowIndex * studentsPerLine
          const endIdx = Math.min(startIdx + studentsPerLine, totalStudents)
          const studentsInRow = seatingType === "single"
            ? (seats as (Student | null)[]).slice(startIdx, endIdx)
            : (seats as Student[]).slice(startIdx, endIdx)

          return (
            <div key={rowIndex} className="border-l-4 border-blue-400 pl-3">
              <p className="text-xs text-gray-500 font-semibold mb-2">{rowIndex + 1}번 줄</p>
              <div
                className={`grid gap-2`}
                style={{ gridTemplateColumns: `repeat(${studentsPerLine}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: studentsPerLine }).map((_, idx) => {
                  const actualIdx = startIdx + idx
                  const student = studentsInRow[idx]
                  const fixedStudentNumber = fixedSeats.get(actualIdx)

                  return (
                    <div key={actualIdx}>
                      {student ? (
                        <button
                          onClick={() => handleSeatClick(actualIdx, student.id)}
                          className={`w-full p-3 rounded text-center transition-all duration-200 no-print hover:scale-105 active:scale-95 ${
                            fixedStudents.has(student.id)
                              ? "bg-yellow-300 border-2 border-yellow-500 shadow-md"
                              : fixedSeats.has(actualIdx)
                                ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-purple-500 shadow-lg"
                                : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                          }`}
                        >
                          <div className="font-bold text-lg text-gray-800">{student.id}번</div>
                          <div className="text-sm text-gray-600 font-semibold">{getGenderLabel(student.gender)}</div>
                        </button>
                      ) : (
                        // 빈 자리 표시 (학생 수가 부족한 경우)
                        <div className="w-full p-3 rounded text-center bg-gray-100 border border-gray-300">
                          <div className="text-gray-400 text-sm">빈 자리</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {boardPosition === "bottom" && <BoardDisplay />}

      <Button onClick={onPrint} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
        인쇄하기
      </Button>
    </div>
  )
}
