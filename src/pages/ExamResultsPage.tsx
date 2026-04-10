import { Link, useLocation } from 'react-router-dom'

import { useAppState } from '../app/state'
import { type ExamResultState, formatTimerLabel } from '../lib/study'

export function ExamResultsPage() {
  const location = useLocation()
  const { userState } = useAppState()
  const resultState = location.state as ExamResultState | null
	const latestExam = userState.examHistory[0]
	const score = resultState?.score ?? latestExam?.score ?? 0
	const totalQuestions = resultState?.totalQuestions ?? latestExam?.totalQuestions ?? 0
	const wrongQuestionCount = resultState?.wrongQuestionIds.length ?? Math.max(totalQuestions - score, 0)
	const accuracy = totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100)
	const timerMinutes = resultState?.timerMinutes ?? latestExam?.timerMinutes ?? null
	const completionReason = resultState?.completionReason ?? latestExam?.completionReason ?? 'submitted'

  return (
    <section className="page-stack" aria-labelledby="exam-results-heading">
      <div className="page-header">
        <p className="section-kicker">Submission summary</p>
        <h2 id="exam-results-heading">Exam Results</h2>
        <p className="muted-copy">Review score, accuracy, and wrong-question carryover before retrying.</p>
      </div>

      <div className="metric-grid">
        <article className="metric-card feature-card">
          <span className="metric-label">Score</span>
          <strong>
            {score} / {totalQuestions}
          </strong>
        </article>
        <article className="metric-card feature-card">
          <span className="metric-label">Accuracy</span>
          <strong>{accuracy}%</strong>
        </article>
        <article className="metric-card feature-card">
          <span className="metric-label">Wrong questions</span>
          <strong>{wrongQuestionCount}</strong>
        </article>
      </div>

		<section className="content-panel">
			<div className="panel-heading">
				<div>
					<p className="section-kicker">Next actions</p>
					<h3>Post-exam workflow</h3>
				</div>
			</div>
			<div className="result-meta-row">
				<span className="panel-note">{formatTimerLabel(timerMinutes)}</span>
				{completionReason === 'time-expired' ? (
					<span className="panel-note">Time expired</span>
				) : null}
			</div>
			<div className="action-row">
          <Link className="primary-button" to="/review">
            Review answers
          </Link>
          <Link className="ghost-button" to="/exam/setup">
            Retry setup
          </Link>
        </div>
      </section>
    </section>
  )
}
