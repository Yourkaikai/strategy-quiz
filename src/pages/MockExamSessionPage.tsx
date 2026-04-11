import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAppState } from '../app/state'
import { type MockExamResultState, getMockExamQuestionById, scoreMockExam } from '../lib/mockExam'

export function MockExamSessionPage() {
	const {
		recordMockExamResult,
		setMockExamAnswer,
		setMockExamQuestionIndex,
		userState,
	} = useAppState()
	const session = userState.activeSession?.mode === 'mock-exam' ? userState.activeSession : null
	const [resultState, setResultState] = useState<MockExamResultState | null>(null)
	const [submitted, setSubmitted] = useState(false)

	const questions = useMemo(() => {
		return session?.questionIds
			.map((questionId) => getMockExamQuestionById(questionId))
			.filter((question) => question != null)
	}, [session?.questionIds])

	if (resultState) {
		return <Navigate to="/mock/results" replace state={resultState} />
	}

	if (!session || !questions || questions.length === 0) {
		return <Navigate to="/mock/overview" replace />
	}

	const question = questions[session.currentIndex]
	const selectedAnswer = session.answers[question.id]
	const isLastQuestion = session.currentIndex === questions.length - 1

	const handleSubmit = () => {
		if (submitted) return
		setSubmitted(true)
		const summary = scoreMockExam(questions, session.answers)
		const resultState: MockExamResultState = {
			...summary,
			answers: session.answers,
			examId: `mock-exam-${Date.now()}`,
			questionIds: questions.map((currentQuestion) => currentQuestion.id),
		}

		setResultState(resultState)
		recordMockExamResult(resultState)
	}

	return (
		<section className="page-stack" aria-labelledby="mock-session-heading">
			<div className="page-header split-header">
				<div>
					<p className="section-kicker">Teacher mock exam</p>
					<h2 id="mock-session-heading">Ultimate Test</h2>
				</div>
				<div className="status-chip accent-chip">{questions.length} questions · no answer reveal</div>
			</div>

			<section className="content-panel question-card exam-card">
				<div className="question-meta-row">
					<span className="status-pill">
						{session.currentIndex + 1} / {questions.length}
					</span>
					<div className="question-panel-notes">
						<span className="panel-note">Answers hidden until submit</span>
						<span className="panel-note">Skip allowed · unanswered = 0</span>
					</div>
				</div>
				<h3 className="question-title">{question.stem}</h3>
				<ul className="option-list" aria-label="Ultimate Test answer choices">
					{question.options.map((option) => {
						const selected = selectedAnswer === option.label

						return (
							<li key={option.label}>
								<button
									className={selected ? 'option-card is-selected' : 'option-card'}
									type="button"
									aria-label={`${option.label} ${option.text}`}
									onClick={() => setMockExamAnswer(question.id, option.label)}
								>
									<span className="option-key">{option.label}</span>
									<span>{option.text}</span>
								</button>
							</li>
						)
					})}
				</ul>
			</section>

			<div className="sticky-actions">
				<button
					className="ghost-button"
					type="button"
					onClick={() => setMockExamQuestionIndex(Math.max(0, session.currentIndex - 1))}
					disabled={session.currentIndex === 0}
				>
					Previous
				</button>
				{isLastQuestion ? (
					<button className="primary-button" type="button" onClick={handleSubmit}>
						Submit Ultimate Test
					</button>
				) : (
					<button
						className="primary-button"
						type="button"
						onClick={() =>
							setMockExamQuestionIndex(Math.min(questions.length - 1, session.currentIndex + 1))
						}
					>
						Next question
					</button>
				)}
			</div>
		</section>
	)
}
