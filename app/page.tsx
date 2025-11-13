"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  createStudents,
  generateSingleSeats,
  generatePairSeats,
  parseCSV,
  type SeatingConfig,
  type GenderPattern,
} from "@/lib/seating-engine"
import { SeatingGrid } from "@/components/seating-grid"
import { FixedStudentsPanel } from "@/components/fixed-students-panel"

interface FormData extends SeatingConfig {}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<FormData>>({})

  const handleStepZeroSubmit = (data: any) => {
    setFormData({ ...formData, ...data })
    
    // 1명씩 앉기인 경우 성별 패턴 설정 없이 바로 StepThree로 이동
    if (data.seatingType === "single") {
      // 기본 성별 패턴 설정 (odd-even, 하지만 실제로는 사용 안 함)
      setFormData({ 
        ...formData, 
        ...data,
        genderPattern: { type: "odd-even" },
        randomizeNumbers: data.arrangementType === "ordered" ? false : true,
      })
      setCurrentStep(3)
    } else if (data.arrangementType === "ordered") {
      // 2명씩 짝앉기에서 번호대로 배치를 선택한 경우 바로 StepThree로 이동
      setFormData({ 
        ...formData, 
        ...data,
        genderPattern: { type: "odd-even" },
        randomizeNumbers: false,
      })
      setCurrentStep(3)
    } else {
      // 2명씩 짝앉기에서 랜덤 배치인 경우 기존 플로우 유지
      // 지정좌석이 체크되어 있으면 StepOne으로, 없으면 StepTwo로
      if (data.useFixedSeats) {
        setCurrentStep(1)
      } else {
        setCurrentStep(2)
      }
    }
  }

  const handleStepOneSubmit = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(2)
  }

  const handleStepTwoSubmit = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(3)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setFormData({})
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {currentStep === 0 && <StepZero onNext={handleStepZeroSubmit} />}
        {currentStep === 1 && (
          <StepOne formData={formData} onNext={handleStepOneSubmit} onBack={() => setCurrentStep(0)} />
        )}
        {currentStep === 2 && (
          <StepTwo formData={formData} onNext={handleStepTwoSubmit} onBack={() => setCurrentStep(formData.useFixedSeats ? 1 : 0)} />
        )}
        {currentStep === 3 && (
          <StepThree 
            formData={formData as FormData} 
            onBack={() => {
              // 1명씩 앉기이거나 번호대로 배치인 경우 StepZero로, 그 외에는 StepTwo로
              if (formData.seatingType === "single" || formData.arrangementType === "ordered") {
                setCurrentStep(0)
              } else {
                setCurrentStep(2)
              }
            }} 
            onReset={handleReset} 
          />
        )}
      </div>
    </main>
  )
}

function StepZero({ onNext }: { onNext: (data: any) => void }) {
  const [studentCount, setStudentCount] = useState("")
  const [seatingType, setSeatingType] = useState<"single" | "pair" | "">("")
  const [teamsPerLine, setTeamsPerLine] = useState("") // "lines"를 "teamsPerLine"으로 변경 및 의미 명확화
  const [pairOrder, setPairOrder] = useState<"male-left" | "female-left" | "alternate" | "random">("male-left")
  const [useFixedSeats, setUseFixedSeats] = useState(false)
  const [arrangementType, setArrangementType] = useState<"ordered" | "random" | "">("") // "ordered": 번호대로, "random": 랜덤

  const handleNext = () => {
    if (teamsPerLine && studentCount && seatingType && arrangementType) {
      onNext({
        boardPosition: "top", // 칠판 위치 상단으로 고정
        lines: Number.parseInt(teamsPerLine),
        studentCount: Number.parseInt(studentCount),
        seatingType,
        ...(seatingType === "pair" && { pairOrder }),
        useFixedSeats: arrangementType === "random" ? useFixedSeats : false,
        arrangementType, // "ordered" 또는 "random"
        randomizeNumbers: arrangementType === "random",
      })
    }
  }

  return (
    <Card className="p-8 shadow-lg animate-in fade-in duration-300">
      <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">교실 자리 배치 설정</h1>
      <p className="text-gray-600 text-center mb-8">학생 수와 자리 배치 방식을 설정해주세요</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">학생 수</label>
          <Input
            type="number"
            min="1"
            max="100"
            placeholder="예: 30"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
            className="w-full px-4 py-3 text-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">자리 배치 방식</label>
          <div className="space-y-2">
            <button
              onClick={() => setSeatingType("single")}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                seatingType === "single"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="font-semibold text-gray-800">1명씩 앉기</div>
              <div className="text-sm text-gray-600">칠판 기준으로 배치할 줄 수를 입력</div>
            </button>
            <button
              onClick={() => setSeatingType("pair")}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                seatingType === "pair"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="font-semibold text-gray-800">2명씩 짝 앉기</div>
              <div className="text-sm text-gray-600">칠판 기준으로 배치할 팀(짝)의 수를 입력</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {seatingType === "pair"
              ? "칠판 기준 1행에 배치할 팀 개수"
              : seatingType === "single"
                ? "칠판 기준 배치 줄 수"
                : "설정 필요"}
          </label>
          <Input
            type="number"
            min="1"
            max="15"
            placeholder={
              seatingType === "pair"
                ? "예: 3 (칠판 기준 1행에 3팀)"
                : seatingType === "single"
                  ? "예: 6 (칠판 기준 6줄)"
                  : "배치 방식을 먼저 선택하세요"
            }
            value={teamsPerLine}
            onChange={(e) => setTeamsPerLine(e.target.value)}
            className="w-full px-4 py-3 text-lg"
            disabled={!seatingType}
          />
          <p className="text-xs text-gray-500 mt-1">
            {seatingType === "pair"
              ? "칠판을 기준으로 1행에 몇 개의 팀을 배치할지 입력하세요"
              : seatingType === "single"
                ? "1명씩 몇 줄에 걸쳐 배치할지 입력하세요"
                : ""}
          </p>
        </div>

        {seatingType === "pair" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">남-여 좌우 배치 순서</label>
            <div className="space-y-2">
              <button
                onClick={() => setPairOrder("male-left")}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                  pairOrder === "male-left"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-semibold text-gray-800">남학생 왼쪽</div>
                <div className="text-sm text-gray-600">모든 팀에서 남학생이 왼쪽, 여학생이 오른쪽</div>
              </button>
              <button
                onClick={() => setPairOrder("female-left")}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                  pairOrder === "female-left"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-semibold text-gray-800">여학생 왼쪽</div>
                <div className="text-sm text-gray-600">모든 팀에서 여학생이 왼쪽, 남학생이 오른쪽</div>
              </button>
              <button
                onClick={() => setPairOrder("alternate")}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                  pairOrder === "alternate"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-semibold text-gray-800">교대로 배치</div>
                <div className="text-sm text-gray-600">팀마다 남-여 순서가 교대로 바뀜</div>
              </button>
              <button
                onClick={() => setPairOrder("random")}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                  pairOrder === "random"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-semibold text-gray-800">랜덤 배치</div>
                <div className="text-sm text-gray-600">각 팀마다 남-여 순서가 랜덤으로 배치</div>
              </button>
            </div>
          </div>
        )}

        {seatingType && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">배치 방식</label>
            <div className="space-y-2">
              <button
                onClick={() => setArrangementType("ordered")}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                  arrangementType === "ordered"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-semibold text-gray-800">번호대로 배치</div>
                <div className="text-sm text-gray-600">학생 번호 순서대로 배치합니다</div>
              </button>
              <button
                onClick={() => setArrangementType("random")}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98] ${
                  arrangementType === "random"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="font-semibold text-gray-800">랜덤 배치</div>
                <div className="text-sm text-gray-600">학생을 랜덤으로 배치합니다</div>
              </button>
            </div>
          </div>
        )}

        {arrangementType === "random" && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useFixedSeats}
                onChange={(e) => setUseFixedSeats(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-semibold text-gray-700">지정좌석 사용하기</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">체크하면 특정 자리를 고정할 수 있습니다</p>
          </div>
        )}

        <Button
          onClick={handleNext}
          disabled={!teamsPerLine || !studentCount || !seatingType || !arrangementType}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {arrangementType === "ordered" ? "배치표 보기" : "다음 단계로 →"}
        </Button>
      </div>
    </Card>
  )
}

function StepOne({
  formData,
  onNext,
  onBack,
}: {
  formData: Partial<FormData>
  onNext: (data: any) => void
  onBack: () => void
}) {
  // pair 타입: Map<seatIndex, number[]> (각 팀에 여러 번호, 최대 2개)
  // single 타입: Map<seatIndex, number> (각 자리에 하나의 번호)
  const [fixedSeats, setFixedSeats] = useState<Map<number, number | number[]>>(new Map())
  const [inputNumbers, setInputNumbers] = useState<Map<string, string>>(new Map()) // 각 자리별 입력 필드: "seatIndex-position"
  const [errorMessages, setErrorMessages] = useState<Map<string, string>>(new Map()) // 각 자리별 에러 메시지: "seatIndex-position"

  const studentCount = formData.studentCount || 0
  const seatingType = formData.seatingType || "single"
  const rows = formData.lines || 1
  const teamsPerLine = formData.lines || 1

  // pair 타입일 때는 rows * teamsPerLine으로 총 팀 수 계산
  const totalPairs = seatingType === "pair" 
    ? rows * teamsPerLine
    : 0

  const studentsPerLine = seatingType === "pair"
    ? teamsPerLine
    : Math.ceil(studentCount / rows)

  const handleAddNumber = (seatIndex: number, numberStr: string, position?: number) => {
    const num = Number.parseInt(numberStr)
    const errorKey = position !== undefined ? `${seatIndex}-${position}` : String(seatIndex)
    const newErrorMessages = new Map(errorMessages)
    
    if (Number.isNaN(num) || num <= 0) {
      return
    }
    
    // 학생 수 초과 체크
    if (num > studentCount) {
      newErrorMessages.set(errorKey, `최대 입력 가능 수는 ${studentCount}번입니다`)
      setErrorMessages(newErrorMessages)
      // 3초 후 에러 메시지 제거
      setTimeout(() => {
        setErrorMessages((prev) => {
          const updated = new Map(prev)
          updated.delete(errorKey)
          return updated
        })
      }, 3000)
      return
    }

    // 전체 고정 좌석에서 중복 체크
    let isDuplicate = false
    fixedSeats.forEach((value, idx) => {
      if (idx === seatIndex) return // 같은 팀/자리는 제외
      
      if (Array.isArray(value)) {
        if (value.includes(num)) {
          isDuplicate = true
        }
      } else if (value === num) {
        isDuplicate = true
      }
    })
    
    // 같은 팀/자리 내에서도 중복 체크
    if (!isDuplicate) {
      const current = fixedSeats.get(seatIndex)
      if (seatingType === "pair" && Array.isArray(current)) {
        if (current.includes(num)) {
          isDuplicate = true
        }
      } else if (current === num) {
        isDuplicate = true
      }
    }

    if (isDuplicate) {
      newErrorMessages.set(errorKey, `${num}번은 이미 입력되었습니다`)
      setErrorMessages(newErrorMessages)
      // 3초 후 에러 메시지 제거
      setTimeout(() => {
        setErrorMessages((prev) => {
          const updated = new Map(prev)
          updated.delete(errorKey)
          return updated
        })
      }, 3000)
      return
    }

    // 에러 메시지 제거
    newErrorMessages.delete(errorKey)
    setErrorMessages(newErrorMessages)

    const newFixedSeats = new Map(fixedSeats)
    const current = newFixedSeats.get(seatIndex)
    
    if (seatingType === "pair") {
      // pair 타입: 배열로 관리 (최대 2개)
      const numbers = Array.isArray(current) ? [...current] : current ? [current] : []
      if (numbers.length < 2) {
        numbers.push(num)
        newFixedSeats.set(seatIndex, numbers)
      }
    } else {
      // single 타입: 단일 번호
      newFixedSeats.set(seatIndex, num)
    }
    
    setFixedSeats(newFixedSeats)
    // 입력 필드 초기화
    const newInputNumbers = new Map(inputNumbers)
    if (position !== undefined) {
      newInputNumbers.set(`${seatIndex}-${position}`, "")
    } else {
      newInputNumbers.set(String(seatIndex), "")
    }
    setInputNumbers(newInputNumbers)
  }

  const handleRemoveNumber = (seatIndex: number, numberToRemove: number) => {
    const newFixedSeats = new Map(fixedSeats)
    const current = newFixedSeats.get(seatIndex)
    
    if (seatingType === "pair" && Array.isArray(current)) {
      const numbers = current.filter(n => n !== numberToRemove)
      if (numbers.length > 0) {
        newFixedSeats.set(seatIndex, numbers)
      } else {
        newFixedSeats.delete(seatIndex)
      }
    } else {
      newFixedSeats.delete(seatIndex)
    }
    
    setFixedSeats(newFixedSeats)
  }

  const handleNext = () => {
    // 데이터 변환: Map을 배열로 변환
    const fixedSeatsArray: [number, number | number[]][] = Array.from(fixedSeats.entries())
    onNext({
      fixedSeats: fixedSeatsArray,
    })
  }

  const BoardDisplay = () => (
    <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-2 rounded text-center font-bold text-sm mb-2">
      📋 칠판
    </div>
  )

  return (
    <Card className="p-8 shadow-lg animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">지정좌석 설정</h1>
      <p className="text-gray-600 text-center mb-6">고정할 번호를 입력하고 자리를 클릭하세요</p>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto shadow-inner">
          <BoardDisplay />
          
          {seatingType === "pair" ? (
            <div className="space-y-3">
              {Array.from({ length: rows }).map((_, rowIndex) => {
                const startIdx = rowIndex * teamsPerLine
                return (
                  <div key={rowIndex} className="border-l-2 border-blue-300 pl-2">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">{rowIndex + 1}번 줄</p>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${teamsPerLine}, minmax(0, 1fr))` }}>
                      {Array.from({ length: teamsPerLine }).map((_, pairIdx) => {
                        const seatIndex = startIdx + pairIdx
                        const fixedNumbers = fixedSeats.get(seatIndex)
                        const numbers = Array.isArray(fixedNumbers) ? fixedNumbers : fixedNumbers ? [fixedNumbers] : []
                        const isFixed = fixedSeats.has(seatIndex)
                        const isEmpty = seatIndex >= totalPairs
                        const inputValue = inputNumbers.get(seatIndex) || ""
                        
                        return (
                          <div
                            key={seatIndex}
                            className={`p-2 rounded border-2 transition-all duration-200 ${
                              isEmpty
                                ? "bg-gray-100 border-gray-200 opacity-50"
                                : isFixed
                                  ? "bg-yellow-50 border-yellow-400 shadow-sm"
                                  : "bg-white border-gray-300 hover:border-blue-400 hover:shadow-sm"
                            }`}
                          >
                            <div className="text-xs text-gray-500 mb-1.5 font-semibold text-center">팀 {seatIndex + 1}</div>
                            
                            {!isEmpty && (
                              <>
                                {/* 각 팀의 2개 자리 표시 - 좌우로 나란히 */}
                                <div className="flex gap-1.5">
                                  {[0, 1].map((seatPosition) => {
                                    const seatKey = `${seatIndex}-${seatPosition}`
                                    const positionInputValue = inputNumbers.get(seatKey) || ""
                                    // 각 자리에 표시할 번호: 첫 번째 자리는 첫 번째 번호, 두 번째 자리는 두 번째 번호
                                    const positionNumber = numbers[seatPosition]
                                    
                                    const errorMessage = errorMessages.get(seatKey)
                                    
                                    return (
                                      <div 
                                        key={seatPosition} 
                                        className="flex-1 border border-gray-200 rounded p-1.5 bg-gray-50 min-w-0 flex flex-col transition-all duration-200 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          if (!positionNumber && !isEmpty && numbers.length < 2) {
                                            const inputRef = inputRefs.current.get(seatKey)
                                            if (inputRef) {
                                              inputRef.focus()
                                            }
                                          }
                                        }}
                                      >
                                        <div className="text-xs text-gray-500 mb-1 text-center font-semibold">자리{seatPosition + 1}</div>
                                        
                                        {positionNumber && (
                                          <div className="mb-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded text-xs border border-blue-200">
                                              <span className="font-bold text-gray-800 flex-1 text-center truncate">{positionNumber}번</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleRemoveNumber(seatIndex, positionNumber)
                                                }}
                                                className="text-red-500 hover:text-red-700 text-xs leading-none flex-shrink-0 transition-colors duration-150 hover:bg-red-100 rounded px-0.5"
                                                title="제거"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {!positionNumber && (
                                          <div className="space-y-1 flex-1 flex flex-col">
          <Input
            ref={(el) => {
              if (el) {
                inputRefs.current.set(seatKey, el)
              } else {
                inputRefs.current.delete(seatKey)
              }
            }}
            type="number"
            min="1"
                                              max={studentCount}
                                              placeholder="#"
                                              value={positionInputValue}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                e.stopPropagation()
                                                const value = e.target.value
                                                const newInputNumbers = new Map(inputNumbers)
                                                newInputNumbers.set(seatKey, value)
                                                setInputNumbers(newInputNumbers)
                                                
                                                // 입력 시 에러 메시지 제거
                                                if (errorMessages.has(seatKey)) {
                                                  const newErrorMessages = new Map(errorMessages)
                                                  newErrorMessages.delete(seatKey)
                                                  setErrorMessages(newErrorMessages)
                                                }
                                                
                                                // 실시간 검증: 학생 수 초과 시 경고
                                                const inputNum = Number.parseInt(value)
                                                if (!Number.isNaN(inputNum) && inputNum > studentCount) {
                                                  const newErrorMessages = new Map(errorMessages)
                                                  newErrorMessages.set(seatKey, `최대 입력 가능 수는 ${studentCount}번입니다`)
                                                  setErrorMessages(newErrorMessages)
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                e.stopPropagation()
                                                if (e.key === "Enter") {
                                                  handleAddNumber(seatIndex, positionInputValue, seatPosition)
                                                }
                                              }}
                                              className={`w-full text-xs h-6 px-1 text-center transition-all duration-200 ${
                                                errorMessage ? "border-red-500 border-2 animate-pulse" : "border-gray-300"
                                              }`}
                                              disabled={isEmpty || numbers.length >= 2}
                                            />
                                            {errorMessage && (
                                              <div className="text-xs text-red-500 text-center animate-in fade-in slide-in-from-top-1 duration-200">
                                                {errorMessage}
                                              </div>
                                            )}
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleAddNumber(seatIndex, positionInputValue, seatPosition)
                                              }}
                                              disabled={isEmpty || !positionInputValue || numbers.length >= 2}
                                              className="w-full text-xs h-5 px-1 py-0 transition-all duration-150 hover:scale-105 active:scale-95"
                                            >
                                              추가
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            )}
                            
                            {isEmpty && (
                              <div className="text-gray-300 text-xs text-center py-2">-</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
        </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: rows }).map((_, rowIndex) => {
                const startIdx = rowIndex * studentsPerLine
                return (
                  <div key={rowIndex} className="border-l-2 border-blue-300 pl-2">
                    <p className="text-xs text-gray-500 mb-1">{rowIndex + 1}번 줄</p>
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${studentsPerLine}, minmax(0, 1fr))` }}>
                      {Array.from({ length: studentsPerLine }).map((_, idx) => {
                        const seatIndex = startIdx + idx
                        const fixedNumber = fixedSeats.get(seatIndex)
                        const isFixed = fixedSeats.has(seatIndex)
                        const isEmpty = seatIndex >= studentCount
                        const errorKey = String(seatIndex)
                        const errorMessage = errorMessages.get(errorKey)
                        const inputValue = inputNumbers.get(errorKey) || ""
                        
                        return (
                          <div key={seatIndex} className="space-y-1">
                            {fixedNumber ? (
                              <button
                                onClick={() => handleRemoveNumber(seatIndex, fixedNumber as number)}
                                className={`w-full p-2 rounded text-center text-xs transition-all duration-200 border-2 hover:scale-105 active:scale-95 ${
                                  isFixed
                                    ? "bg-yellow-200 border-yellow-500 hover:bg-yellow-300"
                                    : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                }`}
                              >
                                <div className="font-bold text-gray-800">{fixedNumber}번</div>
                                <div className="text-xs text-gray-500">클릭하여 제거</div>
                              </button>
                            ) : (
                              <>
                                <Input
                                  type="number"
                                  min="1"
                                  max={studentCount}
                                  placeholder="#"
                                  value={inputValue}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    const newInputNumbers = new Map(inputNumbers)
                                    newInputNumbers.set(errorKey, value)
                                    setInputNumbers(newInputNumbers)
                                    
                                    // 입력 시 에러 메시지 제거
                                    if (errorMessages.has(errorKey)) {
                                      const newErrorMessages = new Map(errorMessages)
                                      newErrorMessages.delete(errorKey)
                                      setErrorMessages(newErrorMessages)
                                    }
                                    
                                    // 실시간 검증: 학생 수 초과 시 경고
                                    const inputNum = Number.parseInt(value)
                                    if (!Number.isNaN(inputNum) && inputNum > studentCount) {
                                      const newErrorMessages = new Map(errorMessages)
                                      newErrorMessages.set(errorKey, `최대 입력 가능 수는 ${studentCount}번입니다`)
                                      setErrorMessages(newErrorMessages)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddNumber(seatIndex, inputValue)
                                    }
                                  }}
                                  className={`w-full text-xs h-7 px-2 text-center transition-all duration-200 ${
                                    errorMessage ? "border-red-500 border-2 animate-pulse" : "border-gray-300"
                                  }`}
                                  disabled={isEmpty}
                                />
                                {errorMessage && (
                                  <div className="text-xs text-red-500 text-center animate-in fade-in slide-in-from-top-1 duration-200">
                                    {errorMessage}
                                  </div>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleAddNumber(seatIndex, inputValue)}
                                  disabled={isEmpty || !inputValue}
                                  className="w-full text-xs h-6 px-2 transition-all duration-150 hover:scale-105 active:scale-95"
                                >
                                  추가
                                </Button>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {fixedSeats.size > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                {seatingType === "pair" 
                  ? Array.from(fixedSeats.values()).reduce((sum, val) => sum + (Array.isArray(val) ? val.length : 1), 0)
                  : fixedSeats.size
                }명
              </span>
              {seatingType === "pair" ? "이 " : "이 "}
              <span className="font-semibold">{fixedSeats.size}개</span>의 {seatingType === "pair" ? "팀" : "자리"}에 고정되었습니다
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={onBack} 
            variant="outline" 
            className="flex-1 bg-transparent transition-all duration-200 hover:scale-105 active:scale-95"
          >
            이전
          </Button>
          <Button 
            onClick={handleNext} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
          다음 단계로 →
        </Button>
        </div>
      </div>
    </Card>
  )
}

function StepTwo({
  formData,
  onNext,
  onBack,
}: {
  formData: Partial<FormData>
  onNext: (data: any) => void
  onBack: () => void
}) {
  const [patternType, setPatternType] = useState<"odd-even" | "custom" | "file">("odd-even")
  const [maleNumbers, setMaleNumbers] = useState("1-5, 10-15")
  const [femaleNumbers, setFemaleNumbers] = useState("6-9, 16-20")
  const [csvData, setCsvData] = useState<Array<{ number: number; gender: "male" | "female" }> | null>(null)
  const [fileError, setFileError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 컴포넌트 마운트 시 파일 입력 및 데이터 초기화
  useEffect(() => {
    setCsvData(null)
    setFileError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setFileError("")
      
      // CSV 파일만 처리
      const text = await file.text()
      const data = parseCSV(text)

      if (data.length === 0) {
        setFileError("유효한 데이터가 없습니다. 형식을 확인해주세요.")
        return
      }

      setCsvData(data)
      setFileError("")
      setPatternType("file")
    } catch (err) {
      console.error("File upload error:", err)
      setFileError("파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.")
    }
  }

  const handleNext = () => {
    const genderPattern: GenderPattern = { type: patternType }

    if (patternType === "custom") {
      genderPattern.maleRanges = maleNumbers.split(",").map((s) => s.trim())
      genderPattern.femaleRanges = femaleNumbers.split(",").map((s) => s.trim())
    } else if (patternType === "file" && csvData) {
      genderPattern.csvData = csvData
    }

    onNext({
      genderPattern,
    })
  }

  return (
    <Card className="p-8 shadow-lg animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">성별 패턴 설정</h2>
      <p className="text-sm text-gray-600 mb-6">학생의 성별을 어떻게 구분할지 선택하세요</p>

      <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={() => setPatternType("odd-even")}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            patternType === "odd-even" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-gray-800">홀수/짝수 구분</div>
          <div className="text-sm text-gray-600">홀수 번호 = 남자, 짝수 번호 = 여자</div>
        </button>

        <button
          onClick={() => setPatternType("custom")}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            patternType === "custom" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-gray-800">직접 설정</div>
          <div className="text-sm text-gray-600">번호 범위를 직접 입력해서 구분</div>
        </button>

        <button
          onClick={() => setPatternType("file")}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            patternType === "file" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="font-semibold text-gray-800">파일 업로드</div>
          <div className="text-sm text-gray-600">CSV/엑셀 파일로 학생 정보 입력</div>
        </button>
      </div>

      {patternType === "custom" && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">남자 학생 번호 범위</label>
            <Input
              placeholder="예: 1-5, 10, 15-18"
              value={maleNumbers}
              onChange={(e) => setMaleNumbers(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">쉼표로 구분, 범위는 하이픈(-)으로 표시</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">여자 학생 번호 범위</label>
            <Input
              placeholder="예: 6-9, 11-14, 19-20"
              value={femaleNumbers}
              onChange={(e) => setFemaleNumbers(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">쉼표로 구분, 범위는 하이픈(-)으로 표시</p>
          </div>
        </div>
      )}

      {patternType === "file" && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">CSV 파일 선택</label>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="w-full" 
            />
            <p className="text-xs text-gray-500 mt-2">
              파일 형식: 번호, 성별 (각 줄마다)
              <br />
              예: 1, 남 / 2, 여 / 3, 남
            </p>
          </div>

          {fileError && <div className="text-sm text-red-600 mb-3">{fileError}</div>}

          {csvData && (
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-2">업로드된 학생 ({csvData.length}명)</p>
              <div className="max-h-32 overflow-y-auto text-xs">
                {csvData.slice(0, 5).map((item) => (
                  <div key={item.number} className="text-gray-600">
                    {item.number}번 - {item.gender === "male" ? "남" : "여"}
                  </div>
                ))}
                {csvData.length > 5 && <div className="text-gray-500 mt-1">... 외 {csvData.length - 5}명</div>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          onClick={onBack} 
          variant="outline" 
          className="flex-1 bg-transparent transition-all duration-200 hover:scale-105 active:scale-95"
        >
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={patternType === "file" && !csvData}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          배치하기 →
        </Button>
      </div>
    </Card>
  )
}

function StepThree({
  formData,
  onBack,
  onReset,
}: {
  formData: FormData
  onBack: () => void
  onReset: () => void
}) {
  const students = createStudents(
    formData.studentCount, 
    formData.genderPattern || { type: "odd-even" }, 
    formData.randomizeNumbers === true // 번호대로 배치일 때는 false, 랜덤 배치일 때는 true
  )
  
  // StepOne에서 설정한 고정 좌석을 Map으로 변환
  const initialFixedSeats = formData.fixedSeats 
    ? new Map(formData.fixedSeats as [number, number | number[]][])
    : new Map<number, number | number[]>()
  
  const [fixedSeats] = useState<Map<number, number | number[]>>(initialFixedSeats) // seatIndex -> studentNumber or studentNumbers[]
  const [seats, setSeats] = useState(() => {
    const fixedMap = new Map<number, number>() // studentId -> seatIndex

    if (formData.seatingType === "pair") {
      return generatePairSeats(students, fixedMap, formData.lines, formData.pairOrder || "male-left", initialFixedSeats, formData.lines, formData.randomizeNumbers === true)
    } else {
      return generateSingleSeats(students, fixedMap, formData.lines, initialFixedSeats, formData.lines, formData.randomizeNumbers === true)
    }
  })

  const [fixedStudents, setFixedStudents] = useState(new Set<number>())

  const handleShuffle = () => {
    const fixedMap = new Map(Array.from(fixedStudents).map((id) => [id, 0]))

    if (formData.seatingType === "pair") {
      setSeats(generatePairSeats(students, fixedMap, formData.lines, formData.pairOrder || "male-left", initialFixedSeats, formData.lines, formData.randomizeNumbers === true))
    } else {
      setSeats(generateSingleSeats(students, fixedMap, formData.lines, initialFixedSeats, formData.lines, formData.randomizeNumbers === true))
    }
  }

  const toggleFixStudent = (studentId: number, seatIndex: number) => {
    const newFixed = new Set(fixedStudents)
    if (newFixed.has(studentId)) {
      newFixed.delete(studentId)
    } else {
      newFixed.add(studentId)
    }
    setFixedStudents(newFixed)

    const fixedMap = new Map(Array.from(newFixed).map((id) => [id, seatIndex]))

    if (formData.seatingType === "pair") {
      setSeats(generatePairSeats(students, fixedMap, formData.lines, formData.pairOrder || "male-left", initialFixedSeats, formData.lines, formData.randomizeNumbers === true))
    } else {
      setSeats(generateSingleSeats(students, fixedMap, formData.lines, initialFixedSeats, formData.lines, formData.randomizeNumbers === true))
    }
  }

  const handleFixSeat = (seatIndex: number, studentNumber: number) => {
    // StepOne에서 설정한 고정 좌석은 변경 불가
    // 이 함수는 사용하지 않지만 SeatingGrid의 인터페이스를 위해 유지
  }

  const handleUnfixSeat = (seatIndex: number) => {
    // StepOne에서 설정한 고정 좌석은 변경 불가
    // 이 함수는 사용하지 않지만 SeatingGrid의 인터페이스를 위해 유지
  }

  const handlePrint = () => {
    window.print()
  }

  const clearAllFixed = () => {
    setFixedStudents(new Set())
    handleShuffle()
  }

  const removeFixed = (studentId: number) => {
    const newFixed = new Set(fixedStudents)
    newFixed.delete(studentId)
    setFixedStudents(newFixed)

    const fixedMap = new Map(Array.from(newFixed).map((id) => [id, 0]))

    if (formData.seatingType === "pair") {
      setSeats(generatePairSeats(students, fixedMap, formData.lines, formData.pairOrder || "male-left", initialFixedSeats, formData.lines, formData.randomizeNumbers === true))
    } else {
      setSeats(generateSingleSeats(students, fixedMap, formData.lines, initialFixedSeats, formData.lines, formData.randomizeNumbers === true))
    }
  }

  return (
    <Card className="p-8 shadow-lg animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold text-gray-800">자리 배치 완료!</h2>
        <Button onClick={onReset} size="sm" variant="outline">
          처음부터
        </Button>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        학생을 클릭하면 고정할 수 있습니다. 고정된 학생은 다시 배치할 때도 같은 자리에 앉습니다.
      </p>

      {fixedStudents.size > 0 && (
        <FixedStudentsPanel
          fixedStudents={fixedStudents}
          students={students}
          onClearAll={clearAllFixed}
          onRemove={removeFixed}
        />
      )}

      <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="animate-in fade-in duration-500">
        <SeatingGrid
          seats={seats}
          seatingType={formData.seatingType}
          fixedStudents={fixedStudents}
            fixedSeats={fixedSeats}
          onToggleFix={toggleFixStudent}
            onFixSeat={handleFixSeat}
            onUnfixSeat={handleUnfixSeat}
          onPrint={handlePrint}
          columns={formData.columns}
          boardPosition={formData.boardPosition}
          rows={formData.lines}
          teamsPerLine={formData.lines}
            totalSeats={formData.studentCount}
        />
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onBack} 
          variant="outline" 
          className="flex-1 bg-transparent transition-all duration-200 hover:scale-105 active:scale-95"
        >
          이전
        </Button>
        <Button 
          onClick={handleShuffle} 
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          다시 배치하기
        </Button>
      </div>
    </Card>
  )
}
