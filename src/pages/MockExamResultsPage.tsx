import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAppState } from '../app/state'
import { getMockExamQuestionById } from '../lib/mockExam'
import type { MockExamResultState } from '../lib/mockExam'

export function MockExamResultsPage() {
	const location = useLocation()
	const navigate = useNavigate()
	const { startPracticeSession, userState } = useAppState()
	const resultState = location.state as MockExamResultState | null
	const latestAttempt = userState.mockExamHistory[0]
	const bestAttempt = userState.mockExamHistory.reduce<typeof latestAttempt | null>((best, attempt) => {
		if (!best || attempt.score > best.score) {
			return attempt
		}

		return best
	}, null)
	const score = resultState?.score ?? latestAttempt?.score ?? 0
	const correctCount = resultState?.correctCount ?? latestAttempt?.correctCount ?? 0
	const wrongCount = resultState?.wrongCount ?? latestAttempt?.wrongCount ?? 0
	const unansweredCount = resultState?.unansweredCount ?? latestAttempt?.unansweredCount ?? 0
	const accuracy = resultState?.accuracy ?? latestAttempt?.accuracy ?? 0
	const wrongQuestionIds = resultState?.wrongQuestionIds ?? latestAttempt?.wrongQuestionIds ?? []
	const answers = resultState?.answers ?? latestAttempt?.answers ?? {}
	const wrongQuestionEntries = wrongQuestionIds
		.map((questionId) => {
			const question = getMockExamQuestionById(questionId)
			if (!question) {
				return null
			}

			return {
				id: question.id,
				stem: question.stem,
				yourAnswer: answers[question.id] ?? null,
				correctAnswer: question.correctAnswer,
			}
		})
		.filter((entry) => entry != null)

	const handleRetryQuestion = (questionId: string) => {
		startPracticeSession({
			questionIds: [questionId],
			subset: 'wrong',
		})
		navigate('/practice', { state: { drill: true } })
	}

	const handleAddToPractice = () => {
		if (wrongQuestionIds.length === 0) {
			return
		}

		startPracticeSession({
			questionIds: wrongQuestionIds,
			subset: 'wrong',
		})
		navigate('/practice', { state: { drill: true } })
	}

	return (
		<section className="page-stack" aria-labelledby="mock-results-heading">
			<div className="page-header">
				<p className="section-kicker">Ultimate Test summary</p>
				<h2 id="mock-results-heading">Ultimate Test Results</h2>
				<p className="muted-copy">Final rehearsal score, latest run, and wrong-answer carryover.</p>
			</div>

			<div className="metric-grid">
				<article className="metric-card feature-card">
					<span className="metric-label">Final score</span>
					<strong>{score}</strong>
				</article>
				<article className="metric-card feature-card">
					<span className="metric-label">Latest</span>
					<strong>{latestAttempt?.score ?? score}</strong>
				</article>
				<article className="metric-card feature-card">
					<span className="metric-label">Best</span>
					<strong>{bestAttempt?.score ?? score}</strong>
				</article>
			</div>

			<section className="content-panel mock-scoreboard">
				<p className="card-title">Score breakdown</p>
				<ul className="mock-result-list">
					<li className="mock-result-line">{correctCount} correct</li>
					<li className="mock-result-line">{wrongCount} wrong</li>
					<li className="mock-result-line">{unansweredCount} unanswered</li>
					<li className="mock-result-line">{accuracy}% accuracy</li>
				</ul>
			</section>

			{wrongQuestionEntries.length > 0 ? (
				<section className="content-panel mock-scoreboard">
					<p className="card-title">Wrong-answer review list</p>
					<div className="review-list">
						{wrongQuestionEntries.map((entry) => (
							<article key={entry.id} className="review-card">
								<p className="card-title">{entry.stem}</p>
								<p className="muted-copy">Your answer: {entry.yourAnswer ?? 'Unanswered'}</p>
								<p className="muted-copy">Correct answer: {entry.correctAnswer ?? 'Not available'}</p>
								<div className="review-card-actions">
									<button
										type="button"
										className="ghost-button"
										onClick={() => handleRetryQuestion(entry.id)}
									>
										Retry this question
									</button>
									<button
										type="button"
										className="primary-button"
										onClick={handleAddToPractice}
									>
										Add to wrong-question practice
									</button>
								</div>
							</article>
						))}
					</div>
				</section>
			) : null}

			<div className="sticky-actions">
				<Link className="ghost-button" to="/mock/overview">
					Retake Ultimate Test
				</Link>
				<Link className="primary-button" to="/review">
					Review wrong questions
				</Link>
			</div>
		</section>
	)
}
