import { useNavigate } from 'react-router-dom'

import { useAppState } from '../app/state'
import { getMockExamQuestions } from '../lib/mockExam'

export function MockExamOverviewPage() {
	const navigate = useNavigate()
	const { startMockExamSession } = useAppState()
	const questions = getMockExamQuestions()

	const handleStart = () => {
		startMockExamSession({
			questionIds: questions.map((question) => question.id),
		})
		navigate('/mock/session')
	}

	return (
		<section className="page-stack" aria-labelledby="mock-overview-heading">
			<div className="page-header">
				<p className="section-kicker">Ultimate Test</p>
				<h2 id="mock-overview-heading">Ultimate Test</h2>
				<p className="muted-copy">SM 2026 Practice Exam v2</p>
			</div>

			<section className="content-panel mock-scoreboard">
				<p className="card-title">Teacher mock exam</p>
				<p className="muted-copy">{questions.length} questions · half-length final rehearsal · fixed source order</p>
				<ul className="mock-result-list" aria-label="Ultimate Test scoring rules">
					<li className="mock-result-line">Correct = +1</li>
					<li className="mock-result-line">Wrong = -1</li>
					<li className="mock-result-line">Unanswered = 0</li>
				</ul>
			</section>

			<div className="sticky-actions">
				<button className="primary-button" type="button" onClick={handleStart}>
					Start Ultimate Test
				</button>
			</div>
		</section>
	)
}
