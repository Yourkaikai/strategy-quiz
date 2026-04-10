import { Link, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'

import { useAppState } from '../app/state'
import type { AppUserState } from '../app/types'
import {
	type GistSyncStatus,
	type SyncResult,
	downloadProgress,
	getSyncStatus,
	getToken,
	hasToken,
	removeToken,
	saveToken,
	uploadProgress,
} from '../app/gistSync'
import { getMockExamQuestions } from '../lib/mockExam'
import { getChapterSummaries, getQuestionsByChapter } from '../lib/questions'

/* ── Icons ── */
function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="18" width="12" height="4"/>
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function NotebookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  )
}

function ChevronRightIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<polyline points="9 18 15 12 9 6"/>
		</svg>
	)
}

function CloudIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
		</svg>
	)
}

function CloudUploadIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
			<polyline points="12 12 12 19"/>
			<polyline points="9 16 12 19 15 16"/>
		</svg>
	)
}

function CloudDownloadIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
			<polyline points="12 16 12 9"/>
			<polyline points="9 12 12 9 15 12"/>
		</svg>
	)
}

function LogOutIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
			<polyline points="16 17 21 12 16 7"/>
			<line x1="21" y1="12" x2="9" y2="12"/>
		</svg>
	)
}

function SpinnerIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sync-spinner" aria-hidden="true">
			<path d="M21 12a9 9 0 1 1-6.219-8.56"/>
		</svg>
	)
}

function SyncSection({ userState, mergeRemoteState }: { userState: AppUserState; mergeRemoteState: (s: AppUserState) => void }) {
	const [syncStatus, setSyncStatus] = useState<GistSyncStatus>(getSyncStatus())
	const [tokenInput, setTokenInput] = useState('')
	const [showTokenInput, setShowTokenInput] = useState(false)
	const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const [syncing, setSyncing] = useState<'upload' | 'download' | null>(null)
	const [showToken, setShowToken] = useState(false)

	const refreshStatus = useCallback(() => {
		setSyncStatus(getSyncStatus())
	}, [])

	useEffect(() => {
		refreshStatus()
	}, [refreshStatus])

	const flashMessage = useCallback((type: 'success' | 'error', text: string) => {
		setSyncMessage({ type, text })
		const timer = setTimeout(() => setSyncMessage(null), 4000)
		return () => clearTimeout(timer)
	}, [])

	const handleConnect = () => {
		const trimmed = tokenInput.trim()
		if (!trimmed) return
		saveToken(trimmed)
		setTokenInput('')
		setShowTokenInput(false)
		refreshStatus()
		flashMessage('success', 'Token saved. Now click Upload to sync your progress.')
	}

	const handleDisconnect = () => {
		removeToken()
		refreshStatus()
		flashMessage('success', 'Cloud sync disconnected.')
	}

	const handleUpload = async () => {
		setSyncing('upload')
		setSyncMessage(null)
		try {
			const result: SyncResult = await uploadProgress(userState)
			if (result.success) {
				refreshStatus()
				flashMessage('success', result.message)
			} else {
				flashMessage('error', result.message)
			}
		} catch (err) {
			flashMessage('error', err instanceof Error ? err.message : 'Upload failed.')
		}
		setSyncing(null)
	}

	const handleDownload = async () => {
		setSyncing('download')
		setSyncMessage(null)
		try {
			const result: SyncResult & { mergedState?: AppUserState; remoteState?: AppUserState } = await downloadProgress()
			if (result.success && result.remoteState) {
				mergeRemoteState(result.remoteState)
				refreshStatus()
				flashMessage('success', result.message)
			} else {
				flashMessage('error', result.message)
			}
		} catch (err) {
			flashMessage('error', err instanceof Error ? err.message : 'Download failed.')
		}
		setSyncing(null)
	}

	const isBusy = syncing !== null
	const maskToken = (t: string) => t.length <= 8 ? t : t.slice(0, 4) + '...' + t.slice(-4)

	return (
		<section className="content-panel sync-panel" aria-labelledby="sync-heading">
			<div className="panel-heading">
				<div>
					<p className="section-kicker">Cross-device sync</p>
					<h3 id="sync-heading">Cloud Sync</h3>
				</div>
				<span className="panel-note">
					{syncStatus.connected ? (
						<span className="sync-connected">
							<span className="sync-dot" aria-hidden="true" />
							Connected
						</span>
					) : hasToken() ? (
						<span className="sync-pending">Token set</span>
					) : (
						<span className="sync-disconnected">Not connected</span>
					)}
				</span>
			</div>

			<p className="sync-description muted-copy">
				Use a GitHub Personal Access Token to sync your progress across devices.
				Your data is stored in a private Gist.
			</p>

			{syncMessage && (
				<div className={`sync-toast sync-toast--${syncMessage.type}`} role="status" aria-live="polite">
					{syncMessage.text}
				</div>
			)}

			{!hasToken() && !showTokenInput && (
				<button
					className="ghost-button sync-btn"
					type="button"
					onClick={() => setShowTokenInput(true)}
					disabled={isBusy}
				>
					<span className="action-inner">
						<CloudIcon />
						Connect GitHub
					</span>
				</button>
			)}

			{!hasToken() && showTokenInput && (
				<div className="sync-token-form">
<p className="sync-token-hint muted-copy">
													Create a token at{' '}
													<a href="https://github.com/settings/tokens/new?description=Strategy+Quiz+Sync&scopes=gist" target="_blank" rel="noopener noreferrer">
														github.com/settings/tokens
													</a>{' '}
													— select the <strong>gist</strong> scope, no other permissions needed.
												</p>
					<div className="sync-token-row">
						<input
							className="sync-token-input"
							type={showToken ? 'text' : 'password'}
							placeholder="ghp_xxxxxxxxxxxx"
							value={tokenInput}
							onChange={(e) => setTokenInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
							autoComplete="off"
							spellCheck={false}
						/>
						<button
							className="ghost-button sync-token-toggle"
							type="button"
							onClick={() => setShowToken(!showToken)}
							aria-label={showToken ? 'Hide token' : 'Show token'}
							title={showToken ? 'Hide' : 'Show'}
						>
							{showToken ? 'Hide' : 'Show'}
						</button>
						<button
							className="primary-button sync-token-save"
							type="button"
							onClick={handleConnect}
							disabled={!tokenInput.trim()}
						>
							Save
						</button>
					</div>
					<button
						className="ghost-button sync-cancel-link"
						type="button"
						onClick={() => { setShowTokenInput(false); setTokenInput('') }}
					>
						Cancel
					</button>
				</div>
			)}

			{hasToken() && (
				<div className="sync-actions">
					<div className="sync-actions-row">
						<button
							className="ghost-button sync-btn"
							type="button"
							onClick={handleUpload}
							disabled={isBusy || !hasToken()}
						>
							<span className="action-inner">
								{syncing === 'upload' ? <SpinnerIcon /> : <CloudUploadIcon />}
								{syncing === 'upload' ? 'Uploading...' : 'Upload'}
							</span>
						</button>
						<button
							className="ghost-button sync-btn"
							type="button"
							onClick={handleDownload}
							disabled={isBusy || !syncStatus.gistId}
						>
							<span className="action-inner">
								{syncing === 'download' ? <SpinnerIcon /> : <CloudDownloadIcon />}
								{syncing === 'download' ? 'Downloading...' : 'Download'}
							</span>
						</button>
					</div>

					{syncStatus.gistId && syncStatus.lastSyncedAt && (
						<p className="sync-last-sync muted-copy">
							Last sync: {new Date(syncStatus.lastSyncedAt).toLocaleString()}
						</p>
					)}

					<div className="sync-token-info muted-copy">
						<span>Token: {showToken ? getToken() : maskToken(getToken() ?? '')}</span>
						<button
							className="ghost-button sync-token-toggle"
							type="button"
							onClick={() => setShowToken(!showToken)}
						>
							{showToken ? 'Hide' : 'Show'}
						</button>
					</div>

					<button
						className="ghost-button sync-disconnect-btn"
						type="button"
						onClick={handleDisconnect}
						disabled={isBusy}
					>
						<span className="action-inner">
							<LogOutIcon />
							Disconnect
						</span>
					</button>
				</div>
			)}
		</section>
	)
}

export function HomePage() {
	const navigate = useNavigate()
	const { startPracticeSession, mergeRemoteState, userState } = useAppState()
	const chapterCards = getChapterSummaries()
	const chapterCount = chapterCards.length
	const totalQuestions = chapterCards.reduce((sum, chapter) => sum + chapter.questionCount, 0)
	const totalCompleted = Object.values(userState.practiceProgress).reduce(
		(sum, chapter) => sum + chapter.completedCount,
		0,
	)
	const completionRate = totalQuestions === 0 ? 0 : Math.round((totalCompleted / totalQuestions) * 100)
	const activeSession = userState.activeSession
	const hasWrongQueue = userState.wrongHistory.some((entry) => !entry.mastered)
	const wrongCount = userState.wrongHistory.filter((e) => !e.mastered).length
	const mockQuestions = getMockExamQuestions()
	const latestMockAttempt = userState.mockExamHistory[0] ?? null
	const bestMockAttempt = userState.mockExamHistory.reduce<typeof userState.mockExamHistory[number] | null>(
		(bestAttempt, attempt) => {
			if (!bestAttempt || attempt.score > bestAttempt.score) {
				return attempt
			}
			return bestAttempt
		},
		null,
	)

	const handleWrongPracticeStart = () => {
		const wrongQuestionIds = userState.wrongHistory
			.filter((entry) => !entry.mastered)
			.map((entry) => entry.questionId)

		if (wrongQuestionIds.length === 0) return

		startPracticeSession({ questionIds: wrongQuestionIds, subset: 'wrong' })
		navigate('/practice')
	}

	const handleChapterPracticeStart = (chapterId: string) => {
		// Check if there's an existing session for the same chapter
		if (
			activeSession?.mode === 'practice' &&
			activeSession?.subset === 'chapter' &&
			activeSession?.chapterId === chapterId
		) {
			// Continue existing session instead of restarting
			navigate('/practice')
			return
		}

		const chapterQuestionIds = getQuestionsByChapter(chapterId).map((question) => question.id)
		if (chapterQuestionIds.length === 0) return

		startPracticeSession({ questionIds: chapterQuestionIds, subset: 'chapter', chapterId })
		navigate('/practice')
	}

	const resumeAction = (() => {
		if (activeSession?.mode === 'practice') return { to: '/practice', label: 'Resume practice', state: { resumed: true } }
		if (activeSession?.mode === 'exam') return { to: '/exam/session', label: 'Resume exam', state: { resumed: true } }
		if (activeSession?.mode === 'mock-exam') return { to: '/mock/session', label: 'Resume Ultimate Test', state: { resumed: true } }
		return { to: '/practice', label: 'Start practicing', state: undefined }
	})()

	const favoritesCount = userState.favorites.length
	const completedChapters = chapterCards.filter(chapter =>
		(userState.practiceProgress[chapter.chapterId]?.completedCount ?? 0) >= chapter.questionCount
	).length

	return (
		<section className="page-stack" aria-labelledby="home-heading">

			{/* ── HERO ── */}
			<div className="hero-panel">
				<div>
					<p className="section-kicker">Study dashboard</p>
					<h2 id="home-heading">Welcome back</h2>
					<p className="muted-copy">
						Resume where you left off, drill a chapter, or launch a timed exam session.
					</p>
					<p className="hero-footnote">
						{totalQuestions} questions · {chapterCount} chapters
						{completedChapters > 0 && (
							<> · <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{completedChapters} completed</span></>
						)}
					</p>
				</div>
				<div className="metric-grid triple-grid">
					<article className="metric-card" aria-label={`Overall completion ${completionRate}%`}>
						<span className="metric-label">Overall</span>
						<strong>{completionRate}%</strong>
					</article>
					<article className="metric-card" aria-label={`${totalCompleted} questions done`}>
						<span className="metric-label">Done</span>
						<strong>{totalCompleted}</strong>
					</article>
					<article className="metric-card" aria-label={`${wrongCount} questions to retry`}>
						<span className="metric-label">Retry</span>
						<strong>{wrongCount}</strong>
					</article>
				</div>
			</div>

			{/* ── QUICK ACTIONS ── */}
			<div className="action-row">
				<Link className="primary-action" to={resumeAction.to} state={resumeAction.state}>
					<span className="action-inner">
						{activeSession ? <RefreshIcon /> : <ArrowRightIcon />}
						{resumeAction.label}
						<ArrowRightIcon />
					</span>
				</Link>
				<Link className="secondary-action" to="/exam/setup">
					<span className="action-inner">
						<StarIcon />
						Start exam
					</span>
				</Link>
				{hasWrongQueue ? (
					<button className="secondary-action" type="button" onClick={handleWrongPracticeStart}>
						<span className="action-inner">
							<FlameIcon />
							Review {wrongCount} wrong
						</span>
					</button>
				) : (
					<Link className="secondary-action" to="/review">
						<span className="action-inner">
							<NotebookIcon />
							Review notebook
						</span>
					</Link>
				)}
			</div>

			{/* ── QUICK STATS ROW (if has any activity) ── */}
			{(favoritesCount > 0 || totalCompleted > 0) && (
				<div className="home-stats-strip" role="region" aria-label="Quick stats">
					{favoritesCount > 0 && (
						<div className="stat-pill">
							<span className="stat-pill-icon">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
									<path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z"/>
								</svg>
							</span>
							{favoritesCount} saved
						</div>
					)}
					{completedChapters > 0 && (
						<div className="stat-pill stat-pill--success">
							<span className="stat-pill-icon"><CheckIcon /></span>
							{completedChapters} / {chapterCount} chapters complete
						</div>
					)}
					{totalCompleted > 0 && (
						<div className="stat-pill">
							<span className="stat-pill-icon">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
								</svg>
							</span>
							{completionRate}% overall
						</div>
					)}
				</div>
			)}

			{/* ── CLOUD SYNC ── */}
			<SyncSection userState={userState} mergeRemoteState={mergeRemoteState} />

			{/* ── ULTIMATE TEST ── */}
			<section className="content-panel" aria-labelledby="ultimate-test-heading">
				<div className="panel-heading">
					<div>
						<p className="section-kicker">Teacher mock exam</p>
						<h3 id="ultimate-test-heading">Ultimate Test</h3>
					</div>
					<span className="panel-note">SM 2026 Practice Exam v2</span>
				</div>

				<article className="chapter-card mock-card">
					<div className="chapter-card-copy">
						<div>
							<p className="card-title">
								<span className="mock-title-icon" aria-hidden="true"><TrophyIcon /></span>
								Teacher mock exam
							</p>
							<p className="muted-copy">{mockQuestions.length} questions · fixed source order</p>
						</div>
						<dl className="mini-stats">
							<div>
								<dt>Latest</dt>
								<dd>{latestMockAttempt ? `${latestMockAttempt.score}%` : '—'}</dd>
							</div>
							<div>
								<dt>Best</dt>
								<dd>{bestMockAttempt ? `${bestMockAttempt.score}%` : '—'}</dd>
							</div>
							<div>
								<dt>Attempts</dt>
								<dd>{userState.mockExamHistory.length}</dd>
							</div>
						</dl>
					</div>
					<Link className="ghost-button chapter-action" to="/mock/overview">
						<span className="action-inner">
							Open test
							<ChevronRightIcon />
						</span>
					</Link>
				</article>
			</section>

			{/* ── CHAPTERS ── */}
			<section className="content-panel" aria-labelledby="chapters-heading">
				<div className="panel-heading">
					<div>
						<p className="section-kicker">Chapter list</p>
						<h3 id="chapters-heading">Source-order study units</h3>
					</div>
					<span className="panel-note">{chapterCount} PDFs · stable order</span>
				</div>

				<div className="chapter-list" role="list">
					{chapterCards.map((chapter) => {
						const completedCount = userState.practiceProgress[chapter.chapterId]?.completedCount ?? 0
						const completionPct = chapter.questionCount === 0 ? 0 : Math.round((completedCount / chapter.questionCount) * 100)
						const isComplete = completedCount >= chapter.questionCount

						return (
							<article
								key={chapter.chapterId}
								className={`chapter-card${isComplete ? ' is-complete' : ''}`}
								role="listitem"
							>
								<div className="chapter-card-copy">
									<div>
										<div className="chapter-card-title-row">
											<p className="card-title">{chapter.chapterTitle}</p>
											{isComplete && (
												<span className="complete-badge" aria-label="Completed">
													<CheckIcon />
												</span>
											)}
										</div>
										<p className="muted-copy">{chapter.chapterId} · {chapter.questionCount} questions</p>
										<div className="progress-bar" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${completionPct}% complete`}>
											<div className="progress-fill" style={{ width: `${completionPct}%` }} />
										</div>
									</div>
									<dl className="mini-stats">
										<div>
											<dt>Done</dt>
											<dd>
												{completedCount}
												<span className="mini-stat-total">/{chapter.questionCount}</span>
											</dd>
										</div>
										<div>
											<dt>Favs</dt>
											<dd>{userState.favorites.filter((id) => id.startsWith(chapter.chapterId)).length}</dd>
										</div>
									</dl>
								</div>
								<button
									className="ghost-button chapter-action"
									type="button"
									onClick={() => handleChapterPracticeStart(chapter.chapterId)}
									aria-label={`Practice ${chapter.chapterTitle}`}
								>
									<span className="action-inner">
										Practice
										<ChevronRightIcon />
									</span>
								</button>
							</article>
						)
					})}
				</div>
			</section>
		</section>
	)
}
