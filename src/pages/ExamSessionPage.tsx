import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAppState } from '../app/state'
import type { AnswerLabel } from '../app/types'
import { getQuestionById } from '../lib/questions'
import { type ExamConfig, type ExamResultState, formatCountdown, formatTimerLabel } from '../lib/study'

interface ExamSessionLocationState {
  config: ExamConfig
  questionIds: string[]
}

export function ExamSessionPage() {
	const location = useLocation()
	const navigate = useNavigate()
	const {
		clearActiveSession,
		recordExamResult,
		setExamAnswer,
		setExamQuestionIndex,
		startExamSession,
		userState,
	} = useAppState()
	const sessionState = location.state as ExamSessionLocationState | null
	const examSession = userState.activeSession?.mode === 'exam' ? userState.activeSession : null
	const fallbackSession = sessionState
		? {
				mode: 'exam' as const,
				config: sessionState.config,
				questionIds: sessionState.questionIds,
				currentIndex: 0,
				answers: {} as Record<string, AnswerLabel>,
				startedAt: new Date().toISOString(),
				expiresAt:
					sessionState.config.timerMinutes == null
						? null
						: new Date(Date.now() + sessionState.config.timerMinutes * 60_000).toISOString(),
			}
		: null
	const sessionModel = examSession ?? fallbackSession
	const [hasSubmitted, setHasSubmitted] = useState(false)
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (examSession || !sessionState) {
			return
		}

		startExamSession({
			config: sessionState.config,
			questionIds: sessionState.questionIds,
		})
	}, [examSession, sessionState, startExamSession])

	const questions = useMemo(() => {
		return sessionModel?.questionIds
			.map((questionId) => getQuestionById(questionId))
			.filter((question) => question != null)
	}, [sessionModel?.questionIds])

	useEffect(() => {
		if (!sessionModel?.expiresAt) {
			return
		}

		const intervalId = window.setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => window.clearInterval(intervalId)
	}, [sessionModel?.expiresAt])

	const handleSubmit = useCallback(
		(completionReason: 'submitted' | 'time-expired') => {
			if (!examSession || !questions || hasSubmitted) {
				return
			}

			setHasSubmitted(true)

			const score = questions.reduce((sum, currentQuestion) => {
				return examSession.answers[currentQuestion.id] === currentQuestion.correctAnswer ? sum + 1 : sum
			}, 0)
			const wrongQuestionIds = questions
				.filter((currentQuestion) => examSession.answers[currentQuestion.id] !== currentQuestion.correctAnswer)
				.map((currentQuestion) => currentQuestion.id)
			const resultState: ExamResultState = {
				examId: `exam-${Date.now()}`,
				mode: examSession.config.mode,
				chapterIds: examSession.config.chapterIds,
				questionIds: questions.map((currentQuestion) => currentQuestion.id),
				answers: examSession.answers,
				score,
				totalQuestions: questions.length,
				wrongQuestionIds,
				timerMinutes: examSession.config.timerMinutes,
				completionReason,
			}

			recordExamResult({
				examId: resultState.examId,
				completionReason,
				score,
				timerMinutes: examSession.config.timerMinutes,
				totalQuestions: questions.length,
				wrongQuestionIds,
			})

			clearActiveSession()
			navigate('/exam/results', { state: resultState })
		},
		[clearActiveSession, examSession, hasSubmitted, navigate, questions, recordExamResult],
	)

	const hasSubmittedRef = useRef(hasSubmitted)
	useEffect(() => {
		hasSubmittedRef.current = hasSubmitted
	}, [hasSubmitted])

	const remainingMs = sessionModel?.expiresAt
		? Math.max(0, Date.parse(sessionModel.expiresAt) - now)
		: null

	useEffect(() => {
		if (remainingMs !== 0 || hasSubmittedRef.current) {
			return
		}

		handleSubmit('time-expired')
	}, [handleSubmit, remainingMs])

	if (!sessionModel) {
		return <Navigate to="/exam/setup" replace />
	}

	if (!questions || questions.length === 0) {
		return <Navigate to="/exam/setup" replace />
	}

	const question = questions[sessionModel.currentIndex]
	const selectedAnswer = sessionModel.answers[question.id]
	const isLastQuestion = sessionModel.currentIndex === questions.length - 1

	return (
    <section className="page-stack" aria-labelledby="exam-session-heading">
		<div className="page-header split-header exam-page-header">
			<div>
				<p className="section-kicker">Live exam</p>
				<h2 id="exam-session-heading">Exam Session</h2>
			</div>
			<div className="status-chip accent-chip">
				{sessionModel.config.mode === 'sequential' ? 'Sequential' : 'Random'} · {questions.length}{' '}
				questions
			</div>
		</div>

      <section className="content-panel question-card exam-card exam-question-card">
			<div className="question-meta-row">
				<span className="status-pill">
					Question {sessionModel.currentIndex + 1} / {questions.length}
				</span>
				<div className="question-panel-notes">
					<span className="panel-note">Answers hidden until submit</span>
					{remainingMs != null ? (
						<span className="panel-note">{formatCountdown(remainingMs)} remaining</span>
					) : (
						<span className="panel-note">{formatTimerLabel(sessionModel.config.timerMinutes)}</span>
					)}
				</div>
			</div>
        <h3 className="question-title">{question.stem}</h3>
        <ul className="option-list" aria-label="Exam answer choices">
          {question.options.map((option) => {
            const selected = selectedAnswer === option.label

            return (
              <li key={option.label}>
                <button
                  className={selected ? 'option-card is-selected' : 'option-card'}
                  type="button"
						aria-label={`${option.label} ${option.text}`}
						onClick={() => setExamAnswer(question.id, option.label)}
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
				onClick={() => setExamQuestionIndex(Math.max(0, sessionModel.currentIndex - 1))}
				disabled={sessionModel.currentIndex === 0}
			>
				Previous
			</button>
			{isLastQuestion ? (
				<button
					className="primary-button"
					type="button"
					onClick={() => handleSubmit('submitted')}
					disabled={selectedAnswer == null}
				>
					Submit exam
          </button>
        ) : (
				<button
					className="primary-button"
					type="button"
					onClick={() =>
						setExamQuestionIndex(Math.min(questions.length - 1, sessionModel.currentIndex + 1))
					}
				>
            Next question
          </button>
        )}
      </div>
    </section>
  )
}
