import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppState } from '../app/state'
import { type ExamMode, buildExamQuestions, clampQuestionCount, formatTimerLabel, normalizeTimerMinutes } from '../lib/study'
import { getChapterSummaries } from '../lib/questions'

/* ── Icons ── */
function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 3 21 3 21 8"/>
      <line x1="4" y1="20" x2="21" y2="3"/>
      <polyline points="21 16 21 21 16 21"/>
      <line x1="15" y1="15" x2="21" y2="21"/>
      <line x1="4" y1="4" x2="9" y2="9"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}

export function ExamSetupPage() {
	const { startExamSession } = useAppState()
	const navigate = useNavigate()
	const chapters = getChapterSummaries()
	const [mode, setMode] = useState<ExamMode>('sequential')
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(
    chapters.map((chapter) => chapter.chapterId),
  )

  const totalQuestions = useMemo(() => {
    return chapters.reduce((sum, chapter) => {
      return selectedChapterIds.includes(chapter.chapterId) ? sum + chapter.questionCount : sum
    }, 0)
  }, [chapters, selectedChapterIds])

	const [questionCount, setQuestionCount] = useState(() => Math.min(10, Math.max(1, totalQuestions)))

	useEffect(() => {
		setQuestionCount((current) => Math.min(current, Math.max(1, totalQuestions)))
	}, [totalQuestions])
	const [timerMinutesInput, setTimerMinutesInput] = useState(0)

	const normalizedCount = clampQuestionCount(questionCount, totalQuestions)
	const timerMinutes = normalizeTimerMinutes(timerMinutesInput)

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((currentChapterIds) => {
      if (currentChapterIds.includes(chapterId)) {
        return currentChapterIds.length === 1
          ? currentChapterIds
          : currentChapterIds.filter((currentChapterId) => currentChapterId !== chapterId)
      }

      return [...currentChapterIds, chapterId]
    })
  }

	const handleStartExam = () => {
		const config = {
			mode,
			chapterIds: selectedChapterIds,
			questionCount: normalizedCount,
			timerMinutes,
		}
		const questions = buildExamQuestions({
			...config,
		})

		startExamSession({
			config,
			questionIds: questions.map((question) => question.id),
		})

		navigate('/exam/session', {
			state: {
				config,
				questionIds: questions.map((question) => question.id),
			},
		})
  }

  const allSelected = selectedChapterIds.length === chapters.length

  return (
    <section className="page-stack" aria-labelledby="exam-setup-heading">
      <div className="page-header">
        <p className="section-kicker">Exam mode</p>
        <h2 id="exam-setup-heading">Exam Setup</h2>
        <p className="muted-copy">
          Pick chapter scope, sequence strategy, and a compact question count before starting.
        </p>
      </div>

      <section className="content-panel form-grid">
        {/* Mode */}
        <article className="field-card">
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-brand)' }}>{mode === 'sequential' ? <ListIcon /> : <ShuffleIcon />}</span>
            Mode
          </p>
          <fieldset className="segment-row exam-mode-group">
            <legend className="sr-only">Exam mode options</legend>
            {(['sequential', 'random'] as const).map((value) => (
              <button
                key={value}
                className={mode === value ? 'segment-chip is-selected' : 'segment-chip'}
                type="button"
                onClick={() => setMode(value)}
              >
                <span className="action-inner">
                  {value === 'sequential' ? <ListIcon /> : <ShuffleIcon />}
                  {value === 'sequential' ? 'Sequential' : 'Random'}
                </span>
              </button>
            ))}
          </fieldset>
        </article>

        {/* Chapter scope */}
        <article className="field-card">
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Chapter scope</span>
            <button
              type="button"
              style={{
                font: 'inherit',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-brand)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 var(--space-1)',
                letterSpacing: '0.02em',
              }}
              onClick={() => setSelectedChapterIds(
                allSelected ? [chapters[0].chapterId] : chapters.map(c => c.chapterId)
              )}
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </p>
          <div className="chapter-scope-row">
            {chapters.map((chapter) => {
              const selected = selectedChapterIds.includes(chapter.chapterId)

              return (
                <button
                  key={chapter.chapterId}
                  className={selected ? 'segment-chip is-selected' : 'segment-chip'}
                  type="button"
                  onClick={() => toggleChapter(chapter.chapterId)}
                  aria-pressed={selected}
                >
                  {chapter.chapterTitle}
                </button>
              )
            })}
          </div>
          <p className="muted-copy" style={{ marginTop: 'var(--space-2)', fontSize: '0.78rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <InfoIcon />
              {selectedChapterIds.length} of {chapters.length} selected
            </span>
          </p>
        </article>

        {/* Question count */}
			<article className="field-card">
				<label className="card-title" htmlFor="question-count">
					Question count
        </label>
        <input
          id="question-count"
          className="count-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(1, totalQuestions)}
          value={normalizedCount}
          onChange={(event) => setQuestionCount(Number(event.target.value) || 1)}
        />
				<p className="muted-copy">{totalQuestions} questions available in selected scope.</p>
			</article>

      {/* Timer */}
			<article className="field-card">
				<label className="card-title" htmlFor="timer-minutes" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-brand)' }}><TimerIcon /></span>
					Timer minutes
				</label>
				<input
					id="timer-minutes"
					className="count-input"
					type="number"
					inputMode="numeric"
					min={0}
					max={180}
					value={timerMinutesInput}
					onChange={(event) => setTimerMinutesInput(Number(event.target.value) || 0)}
				/>
				<p className="muted-copy">
          {timerMinutes === 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <InfoIcon /> Untimed — no countdown
            </span>
          ) : formatTimerLabel(timerMinutes)}
        </p>
			</article>

      {/* Summary */}
			<article className="field-card is-summary">
				<p className="card-title">Summary</p>
				<p className="field-value" style={{ fontWeight: 700 }}>
					{mode === 'sequential' ? 'Sequential' : 'Random'} · {normalizedCount} questions · {selectedChapterIds.length} chapter{selectedChapterIds.length !== 1 ? 's' : ''}
				</p>
				<p className="muted-copy">{formatTimerLabel(timerMinutes)}</p>
			</article>
      </section>

      <div className="sticky-actions">
        <button className="ghost-button" type="button" onClick={() => setMode('sequential')}>
          <span className="action-inner">
            <ResetIcon />
            Reset mode
          </span>
        </button>
        <button className="primary-button" type="button" onClick={handleStartExam}>
          <span className="action-inner">
            <PlayIcon />
            Start exam
          </span>
        </button>
      </div>
    </section>
  )
}
