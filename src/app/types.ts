export type AnswerLabel = 'A' | 'B' | 'C' | 'D'

export interface QuestionOption {
  label: AnswerLabel
  text: string
  explanation?: string
}

export interface QuestionRecord {
  id: string
  chapterId: string
  chapterTitle: string
  questionNumberOriginal: string
  questionNumberNormalized: number
  stem: string
  options: QuestionOption[]
  correctAnswer: AnswerLabel | null
  hasAnswerKey: boolean
  sourcePdf: string
  sourcePage: {
    start: number
    end: number
  }
  ordinalInSource: number
  explanation?: string
  examTip?: string
  isExcluded?: boolean
  exclusionReason?: string
}

export interface ChapterSummary {
  chapterId: string
  chapterTitle: string
  questionCount: number
}

export interface WrongQuestionEntry {
  questionId: string
  attempts: number
  mastered: boolean
  lastAnsweredAt: string
}

export interface ProgressEntry {
  completedCount: number
  lastQuestionId: string | null
}

export interface ExamHistoryEntry {
  id: string
  score: number
  totalQuestions: number
  completedAt: string
  timerMinutes?: number | null
  completionReason?: 'submitted' | 'time-expired'
}

export interface MockExamHistoryEntry {
  id: string
  answers: Record<string, AnswerLabel>
  score: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  unansweredCount: number
  accuracy: number
  wrongQuestionIds: string[]
  completedAt: string
}

export type SessionExamMode = 'sequential' | 'random'

export interface PracticeSessionState {
  mode: 'practice'
  subset: 'all' | 'wrong' | 'chapter'
  chapterId?: string
  questionIds: string[]
  currentIndex: number
  answers: Record<string, AnswerLabel>
  startedAt: string
}

export interface ExamSessionState {
  mode: 'exam'
  config: {
    mode: SessionExamMode
    chapterIds: string[]
    questionCount: number
    timerMinutes: number | null
  }
  questionIds: string[]
  currentIndex: number
  answers: Record<string, AnswerLabel>
  startedAt: string
  expiresAt: string | null
}

export interface MockExamSessionState {
  mode: 'mock-exam'
  questionIds: string[]
  currentIndex: number
  answers: Record<string, AnswerLabel>
  startedAt: string
}

export type ActiveStudySession = PracticeSessionState | ExamSessionState | MockExamSessionState

export interface AppUserState {
  favorites: string[]
  wrongHistory: WrongQuestionEntry[]
  practiceProgress: Record<string, ProgressEntry>
  examHistory: ExamHistoryEntry[]
  mockExamHistory: MockExamHistoryEntry[]
  activeSession: ActiveStudySession | null
}
