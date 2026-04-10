import type { AnswerLabel, QuestionRecord } from '../app/types'
import { mockExamQuestions } from '../data/mockExam'

export interface MockExamScoreSummary {
	accuracy: number
	correctCount: number
	score: number
	totalQuestions: number
	unansweredCount: number
	wrongCount: number
	wrongQuestionIds: string[]
}

export interface MockExamResultState extends MockExamScoreSummary {
	answers: Record<string, AnswerLabel>
	examId: string
	questionIds: string[]
}

export function getMockExamQuestions(): QuestionRecord[] {
	return mockExamQuestions
}

export function getMockExamQuestionById(questionId: string): QuestionRecord | undefined {
	return mockExamQuestions.find((question) => question.id === questionId)
}

export function scoreMockExam(
	questions: QuestionRecord[],
	answers: Record<string, AnswerLabel>,
): MockExamScoreSummary {
	let correctCount = 0
	let wrongCount = 0
	let unansweredCount = 0
	const wrongQuestionIds: string[] = []

	for (const question of questions) {
		const answer = answers[question.id]

		if (answer == null) {
			unansweredCount += 1
			continue
		}

		if (answer === question.correctAnswer) {
			correctCount += 1
			continue
		}

		wrongCount += 1
		wrongQuestionIds.push(question.id)
	}

	const totalQuestions = questions.length
	const score = correctCount - wrongCount

	return {
		accuracy: totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100),
		correctCount,
		score,
		totalQuestions,
		unansweredCount,
		wrongCount,
		wrongQuestionIds,
	}
}
