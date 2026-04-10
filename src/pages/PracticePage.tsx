import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAppState } from '../app/state'
import type { AnswerLabel } from '../app/types'
import { getAllQuestions, getQuestionsByChapter } from '../lib/questions'
import { getTheme, setTheme } from '../app/storage'

/* ── Icons ── */
function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ color: 'var(--color-rose, #e11d48)' }}>
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  )
}

function RotateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/>
      <line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/>
      <line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export function PracticePage() {
	const navigate = useNavigate()
	const location = useLocation()
	const [darkMode, setDarkMode] = useState(getTheme() === 'dark')
	const allQuestions = getAllQuestions()
	const {
		recordPracticeAnswer,
		clearPracticeAnswer,
		setPracticeQuestionIndex,
		startPracticeSession,
		toggleFavorite,
		userState,
		hydrated,
	} = useAppState()
	const session = userState.activeSession?.mode === 'practice' ? userState.activeSession : null

	// ── Start full-bank session if none exists or if not a drill ──
	// - Drills (chapter, wrong) are started by HomePage/ReviewPage before
	//   navigating here with { state: { drill: true } } — keep those.
	// - Direct nav bar "Practice" click has no drill state → always full bank.
	useEffect(() => {
		if (!hydrated || allQuestions.length === 0) return

		if (session) return // keep any existing session (drill or full bank)

		// No session yet → start full bank
		startPracticeSession({
			questionIds: allQuestions.map((question) => question.id),
			subset: 'all',
		})
	}, [hydrated, allQuestions, session, startPracticeSession, location.state])

	const questions = useMemo(() => {
		if (!session) {
			return allQuestions
		}

		return session.questionIds
			.map((questionId) => allQuestions.find((question) => question.id === questionId))
			.filter((question) => question != null)
	}, [allQuestions, session])

	const currentIndex = Math.min(session?.currentIndex ?? 0, Math.max(questions.length - 1, 0))
	const selectedAnswers = session?.answers ?? {}
	const sessionLabel =
		session?.subset === 'wrong'
			? 'Wrong drill'
			: session?.subset === 'chapter'
				? 'Chapter drill'
				: 'Full bank'

	const question = questions[currentIndex]

	// ── Scroll to question card top whenever the question changes ──
	// scrollIntoView respects scroll-margin-top (set in CSS) so the sticky
	// header doesn't cover the first line of the question stem.
	const questionCardRef = useRef<HTMLElement | null>(null)
	useEffect(() => {
		// Use requestAnimationFrame to ensure the DOM has updated before scrolling
		const frame = requestAnimationFrame(() => {
			if (questionCardRef.current) {
				questionCardRef.current.scrollIntoView({ behavior: 'instant', block: 'start' })
			} else {
				window.scrollTo({ top: 0, behavior: 'instant' })
			}
		})
		return () => cancelAnimationFrame(frame)
	}, [currentIndex])
	const chapterQuestions = useMemo(
		() => (question ? getQuestionsByChapter(question.chapterId) : []),
		[question],
	)

	if (!question) {
		return null
	}

	const selectedAnswer = selectedAnswers[question.id]
	const chapterQuestionIndex = chapterQuestions.findIndex((entry) => entry.id === question.id)
	const isFavorite = userState.favorites.includes(question.id)
	const hasAnswerKey = question.correctAnswer !== null
	// null = no answer key, true = correct, false = wrong
	const isCorrect: boolean | null = !hasAnswerKey
		? null
		: selectedAnswer != null
			? selectedAnswer === question.correctAnswer
			: null
	const progressPct = questions.length === 0 ? 0 : Math.round(((currentIndex + 1) / questions.length) * 100)

	const handleAnswerSelect = (answer: AnswerLabel) => {
		if (selectedAnswers[question.id] != null) {
			return
		}

		recordPracticeAnswer({
			answer,
			questionId: question.id,
			chapterId: question.chapterId,
			chapterQuestionIndex,
			currentIndex,
			// No answer key → treat as correct so it doesn't pollute wrongHistory
			isCorrect: hasAnswerKey ? answer === question.correctAnswer : true,
		})
	}

	const isResumed = location.state && typeof location.state === 'object' && 'resumed' in location.state

	const handleToggleDarkMode = () => {
		const next = darkMode ? 'light' : 'dark'
		setDarkMode(!darkMode)
		setTheme(next)
		if (next === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark')
		} else {
			document.documentElement.removeAttribute('data-theme')
		}
	}

	// ── Completion detection: last question answered ──
	const isLastQuestion = currentIndex === questions.length - 1
	const lastAnswered = isLastQuestion && selectedAnswers[question.id] != null
	const answeredCount = Object.keys(selectedAnswers).length

  return (
    <section className="page-stack" aria-labelledby="practice-heading">

      <div className="page-header practice-page-header">
        <p className="section-kicker">Practice mode</p>
        <h2 id="practice-heading">Practice</h2>
        <p className="muted-copy">
          Work through the imported bank with immediate feedback, lightweight progress tracking, and
          quick favorite capture.
        </p>
      </div>

      {/* Slim progress bar at top of question card */}
      <div style={{ marginBottom: 'calc(var(--space-6) * -1)', paddingBottom: 0 }}>
        <div
          className="practice-progress-bar"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progressPct}% through session`}
        >
          <div className="practice-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

		<section className="question-card content-panel" ref={questionCardRef}>
			<div className="question-meta-row">
				<span className="status-pill">
					{sessionLabel} · {question.chapterId} · Q{question.questionNumberOriginal}
				</span>

				<div className="question-toolbar">
					<span className="question-counter">
						{currentIndex + 1}
						<span className="question-counter-sep">/</span>
						<span className="question-counter-total">{questions.length}</span>
					</span>
					{!hasAnswerKey && (
						<span className="question-toolbar-tag question-toolbar-tag--warning" title="No answer key available for this chapter">No key</span>
					)}
					{isResumed && (
						<span className="question-toolbar-tag">Resumed</span>
					)}
					<div className="question-toolbar-divider" aria-hidden="true" />
					<button
						className="question-toolbar-btn"
						onClick={() => navigate('/')}
						aria-label="Back to home"
						title="Back to home"
					>
						<HomeIcon />
					</button>
					<button
						className="question-toolbar-btn"
						onClick={handleToggleDarkMode}
						aria-label={darkMode ? 'Light mode' : 'Dark mode'}
						title={darkMode ? 'Light mode' : 'Dark mode'}
					>
						{darkMode ? <SunIcon /> : <MoonIcon />}
					</button>
				</div>
			</div>
      <h3 className="question-title">{question.stem}</h3>
      <ul className="option-list" aria-label="Practice answer choices">
        {question.options.map((option) => {
          const selected = selectedAnswer === option.label
          const isThisCorrect = hasAnswerKey && selectedAnswer != null && option.label === question.correctAnswer
          const isThisWrong = hasAnswerKey && selected && option.label !== question.correctAnswer

          let cardClass = 'option-card'
          if (selected && isCorrect === true) cardClass += ' is-correct'
          else if (isThisWrong) cardClass += ' is-wrong'
          else if (selected) cardClass += ' is-selected'
          else if (isThisCorrect) cardClass += ' is-correct'

          return (
            <li key={option.label}>
              <button
                className={cardClass}
                type="button"
                onClick={() => handleAnswerSelect(option.label)}
                aria-label={`${option.label}: ${option.text}`}
                aria-pressed={selected}
              >
                <span className="option-key">{option.label}</span>
                <span>{option.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {selectedAnswer ? (
        !hasAnswerKey ? (
          <div className="feedback-panel feedback-panel--no-key" role="alert">
            <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <InfoIcon />
              No answer key
            </p>
            <p className="muted-copy" style={{ marginTop: 'var(--space-1)' }}>
              This chapter's PDF doesn't include answer keys. Your selection has been recorded.
            </p>
          </div>
        ) : (
          <div className={isCorrect ? 'feedback-panel success-panel' : 'feedback-panel'} role="alert">
            <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {isCorrect ? <CheckCircleIcon /> : <XCircleIcon />}
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            <p className="muted-copy" style={{ marginTop: 'var(--space-1)' }}>
              Correct answer: <strong style={{ color: 'var(--color-ink)', fontWeight: 700 }}>{question.correctAnswer}</strong>
              {' · '}
              {question.options.find((option) => option.label === question.correctAnswer)?.text}
            </p>
            {!isCorrect && (
              <button
                className="retry-btn"
                type="button"
                onClick={() => clearPracticeAnswer(question.id)}
              >
                <RotateIcon />
                Retry this question
              </button>
            )}
          </div>
        )
      ) : null}
      </section>

		<div className="sticky-actions">
			{lastAnswered ? (
				<div className="practice-complete">
					<p className="complete-message">
						{session?.subset === 'chapter'
							? `Unit complete — ${answeredCount} of ${questions.length} answered.`
							: session?.subset === 'wrong'
								? `Wrong drill complete — ${answeredCount} of ${questions.length} answered.`
								: `All done — ${answeredCount} of ${questions.length} answered.`}
					</p>
					<Link to="/" className="primary-button" aria-label="Back to home">
						<span className="action-inner">Back to home</span>
					</Link>
				</div>
			) : (
				<>
					<button
						className="ghost-button"
						type="button"
						onClick={() => setPracticeQuestionIndex(Math.max(0, currentIndex - 1))}
						disabled={currentIndex === 0}
						aria-label="Previous question"
					>
						<span className="action-inner">
							<ChevronLeftIcon />
							Previous
						</span>
					</button>
					<button
						className="ghost-button save-btn"
						type="button"
						onClick={() => toggleFavorite(question.id)}
						aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
						aria-pressed={isFavorite}
					>
						<span className="action-inner">
							<HeartIcon filled={isFavorite} />
							<span className="save-label">{isFavorite ? 'Saved' : 'Save'}</span>
						</span>
					</button>
					{currentIndex === questions.length - 1 && selectedAnswer != null ? (
						<button
							className="primary-button"
							type="button"
							onClick={() => navigate('/')}
							aria-label="Finish and return home"
						>
							<span className="action-inner">
								Return Home
								<HomeIcon />
							</span>
						</button>
					) : (
						<button
							className="primary-button"
							type="button"
							onClick={() => setPracticeQuestionIndex(Math.min(questions.length - 1, currentIndex + 1))}
							disabled={currentIndex === questions.length - 1}
							aria-label="Next question"
						>
							<span className="action-inner">
								Next
								<ChevronRightIcon />
							</span>
						</button>
					)}
				</>
			)}
      </div>
    </section>
  )
}
