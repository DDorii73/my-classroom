export interface Student {
  id: number
  gender: "male" | "female"
  originalNumber?: number
}

export interface GenderPattern {
  type: "odd-even" | "custom" | "file"
  maleRanges?: string[]
  femaleRanges?: string[]
  csvData?: Array<{ number: number; gender: "male" | "female" }>
}

export interface SeatingConfig {
  studentCount: number
  seatingType: "single" | "pair"
  genderPattern: GenderPattern
  pairStructure?: "different" | "same"
  columns?: number
  randomizeNumbers?: boolean
  boardPosition: "top" | "bottom"
  lines: number
  pairOrder?: "male-left" | "female-left" | "alternate" | "random"
}

export function parseNumberRange(rangeStr: string): number[] {
  const result: number[] = []
  const parts = rangeStr.split(",").map((s) => s.trim())

  parts.forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => Number.parseInt(n, 10))
      for (let i = start; i <= end; i++) {
        result.push(i)
      }
    } else {
      result.push(Number.parseInt(part, 10))
    }
  })

  return result
}

export function createStudents(count: number, pattern: GenderPattern, randomizeNumbers = false): Student[] {
  if (pattern.type === "file" && pattern.csvData) {
    let students = pattern.csvData.map((item) => ({
      id: item.number,
      gender: item.gender,
      originalNumber: item.number,
    }))

    if (randomizeNumbers) {
      const numbers = shuffleArray(Array.from({ length: count }, (_, i) => i + 1))
      students = students.map((s, idx) => ({
        ...s,
        id: numbers[idx],
      }))
    }

    return students
  }

  return Array.from({ length: count }, (_, i) => {
    const num = i + 1
    let gender: "male" | "female" = "male"

    if (pattern.type === "odd-even") {
      gender = num % 2 === 1 ? "male" : "female"
    } else if (pattern.type === "custom" && pattern.maleRanges) {
      const maleNumbers = pattern.maleRanges.flatMap(parseNumberRange)
      gender = maleNumbers.includes(num) ? "male" : "female"
    }

    const student: Student = { id: num, gender, originalNumber: num }

    if (randomizeNumbers) {
      student.id = i + 1
    }

    return student
  })
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateSingleSeats(
  students: Student[],
  fixedStudents: Map<number, number>,
  teamsPerLine?: number,
  fixedSeats?: Map<number, number>, // seatIndex -> studentNumber
  rows?: number, // 총 행 수
  randomizeNumbers: boolean = true, // true면 랜덤 배치, false면 번호 순서대로
): Student[] {
  // rows가 있으면 rows * teamsPerLine으로 총 자리 수 계산, 없으면 teamsPerLine 또는 학생 수
  const totalSeats = rows && teamsPerLine 
    ? rows * teamsPerLine 
    : teamsPerLine || students.length
  const result: Student[] = new Array(totalSeats).fill(null)
  
  // 고정된 자리 처리
  const usedStudentIds = new Set<number>()
  if (fixedSeats) {
    fixedSeats.forEach((studentNumber, seatIndex) => {
      if (seatIndex < result.length) {
        const student = students.find((s) => s.id === studentNumber)
        if (student) {
          result[seatIndex] = student
          usedStudentIds.add(student.id)
        }
      }
    })
  }

  // 고정된 학생 처리
  fixedStudents.forEach((seatIndex, studentId) => {
    if (seatIndex < result.length && !result[seatIndex]) {
      const student = students.find((s) => s.id === studentId)
      if (student) {
        result[seatIndex] = student
        usedStudentIds.add(student.id)
      }
    }
  })

  // 남은 학생들을 배치 (랜덤 또는 순서대로)
  const unfixed = students.filter((s) => !usedStudentIds.has(s.id))
  // randomizeNumbers가 false이면 번호 순서대로, true이면 랜덤
  const toPlace = randomizeNumbers
    ? shuffleArray(unfixed)
    : unfixed.sort((a, b) => (a.originalNumber || a.id) - (b.originalNumber || b.id))
  const shuffled = toPlace
  
  // 모든 빈 자리를 채우기
  let shuffledIdx = 0
  for (let i = 0; i < result.length; i++) {
    if (!result[i] && shuffledIdx < shuffled.length) {
      result[i] = shuffled[shuffledIdx++]
    }
  }

  return result.filter((s) => s !== null) as Student[]
}

export function generatePairSeats(
  students: Student[],
  fixedStudents: Map<number, number>,
  teamsPerLine?: number,
  pairOrder: "male-left" | "female-left" | "alternate" | "random" = "male-left",
  fixedSeats?: Map<number, number | number[]>, // seatIndex (pairIndex) -> studentNumber or studentNumbers[]
  rows?: number, // 총 행 수
  randomizeNumbers: boolean = true, // true면 랜덤 배치, false면 번호 순서대로
): Student[][] {
  // teamsPerLine이 있으면 rows * teamsPerLine으로 총 팀 수 계산, 없으면 학생 수 기준으로 계산
  const totalPairs = teamsPerLine && rows 
    ? teamsPerLine * rows 
    : teamsPerLine || Math.ceil(students.length / 2)
  const pairs: Student[][] = new Array(totalPairs).fill(null).map(() => [])
  
  // 고정된 자리 처리
  const usedStudentIds = new Set<number>()
  if (fixedSeats) {
    fixedSeats.forEach((studentNumberOrNumbers, pairIndex) => {
      if (pairIndex < pairs.length) {
        const numbers = Array.isArray(studentNumberOrNumbers) 
          ? studentNumberOrNumbers 
          : [studentNumberOrNumbers]
        
        const fixedStudentsInPair: Student[] = []
        numbers.forEach(num => {
          const student = students.find((s) => s.id === num)
          if (student && !usedStudentIds.has(student.id)) {
            fixedStudentsInPair.push(student)
            usedStudentIds.add(student.id)
          }
        })
        
        if (fixedStudentsInPair.length > 0) {
          pairs[pairIndex] = fixedStudentsInPair
        }
      }
    })
  }

  // 고정된 학생 처리
  fixedStudents.forEach((pairIndex, studentId) => {
    if (pairIndex < pairs.length && pairs[pairIndex].length === 0) {
      const student = students.find((s) => s.id === studentId)
      if (student) {
        pairs[pairIndex] = [student]
        usedStudentIds.add(student.id)
      }
    }
  })

  // 남은 학생들을 배치 (랜덤 또는 순서대로)
  const unfixed = students.filter((s) => !usedStudentIds.has(s.id))
  const shuffled = randomizeNumbers
    ? shuffleArray(unfixed)
    : unfixed.sort((a, b) => (a.originalNumber || a.id) - (b.originalNumber || b.id))

  // 다른 성별끼리 짝짓기 (남-녀 또는 여-남 상관없음)
  const males = shuffled.filter((s) => s.gender === "male")
  const females = shuffled.filter((s) => s.gender === "female")

  // 모든 팀의 빈 자리를 채우기
  for (let pairIdx = 0; pairIdx < pairs.length; pairIdx++) {
    const currentPair = pairs[pairIdx]
    
    // 이미 2명이 채워진 자리는 건너뛰기
    if (currentPair.length >= 2) {
      continue
    }

    // 이미 고정된 학생이 있으면 나머지 자리만 채우기
    const pair: Student[] = [...currentPair]

    // 남은 자리 수만큼 학생 배치
    while (pair.length < 2) {
      let studentToAdd: Student | null = null

      if (pairOrder === "male-left") {
        // 남학생을 우선 배치
        const availableMale = males.find(m => !usedStudentIds.has(m.id) && !pair.includes(m))
        const availableFemale = females.find(f => !usedStudentIds.has(f.id) && !pair.includes(f))
        
        if (availableMale && pair.length < 2) {
          studentToAdd = availableMale
        } else if (availableFemale && pair.length < 2) {
          studentToAdd = availableFemale
        }
      } else if (pairOrder === "female-left") {
        // 여학생을 우선 배치
        const availableFemale = females.find(f => !usedStudentIds.has(f.id) && !pair.includes(f))
        const availableMale = males.find(m => !usedStudentIds.has(m.id) && !pair.includes(m))
        
        if (availableFemale && pair.length < 2) {
          studentToAdd = availableFemale
        } else if (availableMale && pair.length < 2) {
          studentToAdd = availableMale
        }
      } else if (pairOrder === "random") {
        // 랜덤: 남은 학생 중 랜덤으로 선택
        const remaining = shuffled.filter(s => !usedStudentIds.has(s.id) && !pair.includes(s))
        if (remaining.length > 0) {
          studentToAdd = shuffleArray(remaining)[0]
        }
      } else {
        // alternate: 팀 인덱스에 따라 교대로
        const availableMale = males.find(m => !usedStudentIds.has(m.id) && !pair.includes(m))
        const availableFemale = females.find(f => !usedStudentIds.has(f.id) && !pair.includes(f))
        
        if (pairIdx % 2 === 0) {
          if (availableMale && pair.length < 2) {
            studentToAdd = availableMale
          } else if (availableFemale && pair.length < 2) {
            studentToAdd = availableFemale
          }
        } else {
          if (availableFemale && pair.length < 2) {
            studentToAdd = availableFemale
          } else if (availableMale && pair.length < 2) {
            studentToAdd = availableMale
          }
        }
      }

      // 남녀가 없으면 남은 학생 중 아무나
      if (!studentToAdd) {
        const remaining = shuffled.filter(s => !usedStudentIds.has(s.id) && !pair.includes(s))
        if (remaining.length > 0) {
          studentToAdd = remaining[0]
        } else {
          break // 더 이상 배치할 학생이 없음
        }
      }

      if (studentToAdd) {
        pair.push(studentToAdd)
        usedStudentIds.add(studentToAdd.id)
      } else {
        break
      }
    }

    if (pair.length > 0) {
      pairs[pairIdx] = pair
    }
  }

  return pairs.filter((p) => p.length > 0)
}

export function parseCSV(csvContent: string): Array<{ number: number; gender: "male" | "female" }> {
  const lines = csvContent.trim().split("\n")
  const result: Array<{ number: number; gender: "male" | "female" }> = []

  lines.forEach((line) => {
    const parts = line.split(",").map((p) => p.trim())
    if (parts.length >= 2) {
      const number = Number.parseInt(parts[0], 10)
      const genderStr = parts[1].toLowerCase()
      const gender = genderStr.includes("남") || genderStr === "m" || genderStr === "male" ? "male" : "female"

      if (!Number.isNaN(number)) {
        result.push({ number, gender })
      }
    }
  })

  return result
}

