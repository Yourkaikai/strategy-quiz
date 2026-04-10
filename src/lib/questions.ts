import { questionBank } from '../data/questionBank'
import { mockExamQuestions } from '../data/mockExam'
import type { ChapterSummary, QuestionRecord } from '../app/types'

function isIncludedQuestion(question: QuestionRecord): boolean {
	return question.isExcluded !== true
}

export function getAllQuestions(): QuestionRecord[] {
  return [...questionBank.filter(isIncludedQuestion), ...mockExamQuestions]
}

export function getQuestionsByChapter(chapterId: string): QuestionRecord[] {
  return questionBank.filter((question) => question.chapterId === chapterId && isIncludedQuestion(question))
}

export function getQuestionById(questionId: string): QuestionRecord | undefined {
  return (
    questionBank.find((question) => question.id === questionId && isIncludedQuestion(question)) ??
    mockExamQuestions.find((question) => question.id === questionId)
  )
}

export function getChapterSummaries(): ChapterSummary[] {
  const orderedChapters: ChapterSummary[] = []
  const seenChapterIds = new Set<string>()

  for (const question of questionBank) {
    if (seenChapterIds.has(question.chapterId)) {
      continue
    }

    seenChapterIds.add(question.chapterId)
    orderedChapters.push({
      chapterId: question.chapterId,
      chapterTitle: question.chapterTitle,
      questionCount: getQuestionsByChapter(question.chapterId).length,
    })
  }

  return orderedChapters
}
