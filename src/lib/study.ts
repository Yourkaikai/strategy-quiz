import type { AnswerLabel, QuestionRecord, SessionExamMode } from '../app/types'
import { getChapterSummaries, getQuestionsByChapter } from './questions'

export type ExamMode = SessionExamMode

export interface ExamConfig {
  mode: ExamMode
  chapterIds: string[]
  questionCount: number
  timerMinutes: number | null
}

export interface ExamResultState {
  examId: string
  mode: ExamMode
  chapterIds: string[]
  questionIds: string[]
  answers: Record<string, AnswerLabel>
  score: number
  totalQuestions: number
  wrongQuestionIds: string[]
  timerMinutes: number | null
  completionReason: 'submitted' | 'time-expired'
}

function hashValue(value: string): number {
  return Array.from(value).reduce((sum, character, index) => {
    return sum + character.charCodeAt(0) * (index + 1)
  }, 0)
}

function getOrderedQuestions(chapterIds: string[]): QuestionRecord[] {
  const chapterSet = new Set(chapterIds)

  return getChapterSummaries().flatMap((chapter) => {
    if (!chapterSet.has(chapter.chapterId)) {
      return []
    }

    return getQuestionsByChapter(chapter.chapterId)
  })
}

function getRandomizedQuestions(questions: QuestionRecord[]): QuestionRecord[] {
  return [...questions].sort((left, right) => {
    return hashValue(left.id) - hashValue(right.id)
  })
}

export function buildExamQuestions(config: ExamConfig): QuestionRecord[] {
  const orderedQuestions = getOrderedQuestions(config.chapterIds)
  const sourceQuestions = config.mode === 'random' ? getRandomizedQuestions(orderedQuestions) : orderedQuestions

  return sourceQuestions.slice(0, config.questionCount)
}

export function clampQuestionCount(value: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return 0
  }

  return Math.min(Math.max(1, value), totalQuestions)
}

export function normalizeTimerMinutes(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  return Math.min(Math.max(1, Math.round(value)), 180)
}

export function formatTimerLabel(timerMinutes: number | null): string {
  if (timerMinutes == null) {
    return 'No timer'
  }

  return `Timer: ${timerMinutes} minute${timerMinutes === 1 ? '' : 's'}`
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
