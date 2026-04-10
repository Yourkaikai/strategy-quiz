import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { defaultUserState, loadUserState, saveUserState, saveUserStateSync } from "./storage";
import { mergeStates } from "./gistSync";

// ── Auto-sync delay (ms) — upload waits this long after last state change ──
const AUTO_SYNC_DELAY = 10_000;

import type {
	AnswerLabel,
	AppUserState,
	ExamSessionState,
	MockExamSessionState,
	PracticeSessionState,
} from "./types";

interface PracticeAnswerPayload {
	answer: AnswerLabel;
	questionId: string;
	chapterId: string;
	chapterQuestionIndex: number;
	currentIndex: number;
	isCorrect: boolean;
}

interface ExamResultPayload {
	examId: string;
	completionReason: "submitted" | "time-expired";
	score: number;
	timerMinutes: number | null;
	totalQuestions: number;
	wrongQuestionIds: string[];
}

interface StartPracticeSessionPayload {
	questionIds: string[];
	subset: PracticeSessionState["subset"];
	chapterId?: string;
	currentIndex?: number;
	answers?: Record<string, AnswerLabel>;
	startedAt?: string;
}

interface StartExamSessionPayload {
	config: ExamSessionState["config"];
	questionIds: string[];
	answers?: Record<string, AnswerLabel>;
	currentIndex?: number;
	startedAt?: string;
}

interface StartMockExamSessionPayload {
	questionIds: string[];
	answers?: Record<string, AnswerLabel>;
	currentIndex?: number;
	startedAt?: string;
}

interface MockExamResultPayload {
	answers: Record<string, AnswerLabel>;
	correctCount: number;
	examId: string;
	score: number;
	totalQuestions: number;
	unansweredCount: number;
	wrongCount: number;
	wrongQuestionIds: string[];
}

interface AppStateContextValue {
	userState: AppUserState;
	hydrated: boolean;
	clearActiveSession: () => void;
	setExamAnswer: (questionId: string, answer: AnswerLabel) => void;
	setExamQuestionIndex: (index: number) => void;
	setMockExamAnswer: (questionId: string, answer: AnswerLabel) => void;
	setMockExamQuestionIndex: (index: number) => void;
	setPracticeQuestionIndex: (index: number) => void;
	startExamSession: (payload: StartExamSessionPayload) => void;
	startMockExamSession: (payload: StartMockExamSessionPayload) => void;
	startPracticeSession: (payload: StartPracticeSessionPayload) => void;
	toggleWrongQuestionMastery: (questionId: string, mastered: boolean) => void;
	toggleFavorite: (questionId: string) => void;
	recordPracticeAnswer: (payload: PracticeAnswerPayload) => void;
	clearPracticeAnswer: (questionId: string) => void;
	recordExamResult: (payload: ExamResultPayload) => void;
	recordMockExamResult: (payload: MockExamResultPayload) => void;
	mergeRemoteState: (remoteState: AppUserState) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function hasTransientState(state: AppUserState): boolean {
	return (
		state.favorites.length > 0 ||
		state.wrongHistory.length > 0 ||
		Object.keys(state.practiceProgress).length > 0 ||
		state.examHistory.length > 0 ||
		state.mockExamHistory.length > 0 ||
		state.activeSession != null
	);
}

function upsertWrongHistory(
	state: AppUserState,
	questionId: string,
	isCorrect: boolean,
): AppUserState["wrongHistory"] {
	const existingEntry = state.wrongHistory.find(
		(entry) => entry.questionId === questionId,
	);

	if (!existingEntry && isCorrect) {
		return state.wrongHistory;
	}

	if (!existingEntry) {
		return [
			...state.wrongHistory,
			{
				questionId,
				attempts: 1,
				mastered: false,
				lastAnsweredAt: new Date().toISOString(),
			},
		];
	}

	return state.wrongHistory.map((entry) => {
		if (entry.questionId !== questionId) {
			return entry;
		}

		return {
			...entry,
			attempts: isCorrect ? entry.attempts : entry.attempts + 1,
			mastered: isCorrect,
			lastAnsweredAt: new Date().toISOString(),
		};
	});
}

function buildPracticeSession(
	payload: StartPracticeSessionPayload,
): PracticeSessionState {
	return {
		mode: "practice",
		subset: payload.subset,
		chapterId: payload.chapterId,
		questionIds: payload.questionIds,
		currentIndex: payload.currentIndex ?? 0,
		answers: payload.answers ?? {},
		startedAt: payload.startedAt ?? new Date().toISOString(),
	};
}

function buildExamSession(payload: StartExamSessionPayload): ExamSessionState {
	const startedAt = payload.startedAt ?? new Date().toISOString();
	return {
		mode: "exam",
		config: payload.config,
		questionIds: payload.questionIds,
		currentIndex: payload.currentIndex ?? 0,
		answers: payload.answers ?? {},
		startedAt,
		expiresAt:
			payload.config.timerMinutes == null
				? null
				: new Date(Date.parse(startedAt) + payload.config.timerMinutes * 60_000).toISOString(),
	};
}

function buildMockExamSession(
	payload: StartMockExamSessionPayload,
): MockExamSessionState {
	return {
		mode: "mock-exam",
		questionIds: payload.questionIds,
		currentIndex: payload.currentIndex ?? 0,
		answers: payload.answers ?? {},
		startedAt: payload.startedAt ?? new Date().toISOString(),
	};
}

export function AppStateProvider({ children }: PropsWithChildren) {
	const [userState, setUserState] = useState<AppUserState>(defaultUserState);
	const [hydrated, setHydrated] = useState(false);
	// Keep a ref to the latest state for beforeunload — avoids stale closure
	const userStateRef = useRef(userState);
	userStateRef.current = userState;

	useEffect(() => {
		let active = true;

		void loadUserState().then((persistedState) => {
			if (!active) {
				return;
			}

			setUserState((currentState) => {
				if (!hasTransientState(currentState)) {
					return persistedState;
				}

				return {
					...persistedState,
					...currentState,
					favorites:
						currentState.favorites.length > 0
							? currentState.favorites
							: persistedState.favorites,
					wrongHistory:
					currentState.wrongHistory.length > 0
						? currentState.wrongHistory
						: persistedState.wrongHistory,
					examHistory:
					currentState.examHistory.length > 0
						? currentState.examHistory
						: persistedState.examHistory,
					mockExamHistory:
					currentState.mockExamHistory.length > 0
						? currentState.mockExamHistory
						: persistedState.mockExamHistory,
					practiceProgress:
						Object.keys(currentState.practiceProgress).length > 0
							? currentState.practiceProgress
							: persistedState.practiceProgress,
					activeSession: currentState.activeSession ?? persistedState.activeSession,
				};
			});
			setHydrated(true);
		});

		return () => {
			active = false;
		};
	}, []);

	// Persist on every state change (hydrated + non-default only)
	useEffect(() => {
		if (!hydrated) {
			return;
		}

		void saveUserState(userState);
	}, [hydrated, userState]);

	// ── Crash-refresh recovery: synchronous save on page hide / beforeunload ──
	// localStorage writes are synchronous, so this fires even if the browser tab
	// is killed or the OS suspends the process.  The async IndexedDB save runs
	// in parallel; localStorage is the safety net.
	useEffect(() => {
		const persist = () => {
			saveUserStateSync(userStateRef.current);
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				persist();
			}
		};

		// beforeunload: desktop browsers (Chrome, Firefox, Edge)
		window.addEventListener('beforeunload', persist);
		// pagehide: iOS Safari — fires when the page is evicted from the back-forward cache
		window.addEventListener('pagehide', persist);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('beforeunload', persist);
			window.removeEventListener('pagehide', persist);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	// ── Auto cloud sync: download on load, upload on changes ──
	// Silently syncs progress via GitHub Gist. Fails gracefully — never blocks UI.
	useEffect(() => {
		if (!hydrated) return

		let cancelled = false

		// Auto-download once on first hydration (works on new devices too).
		// Pass whether local has any progress so that an empty local state (e.g.
		// browser cleared localStorage) always triggers a fresh download.
		const localHasProgress = hasTransientState(userState)
		import('./gistSync').then(async ({ autoDownload }) => {
			const result = await autoDownload(localHasProgress)
			if (cancelled || !result.merged || !result.remoteState) return
			setUserState((local) => mergeStates(local, result.remoteState!))
		})

		return () => { cancelled = true }
	}, [hydrated]);

	// Auto-upload on state changes (debounced inside autoUpload)
	useEffect(() => {
		if (!hydrated) return

		let cancelled = false
		const timer = setTimeout(async () => {
			const { autoUpload } = await import('./gistSync')
			if (!cancelled) {
				await autoUpload(userStateRef.current)
			}
		}, AUTO_SYNC_DELAY)

		return () => { cancelled = true; clearTimeout(timer) }
	}, [hydrated, userState]);

	const toggleFavorite = useCallback((questionId: string) => {
		setUserState((currentState) => {
			const alreadyFavorite = currentState.favorites.includes(questionId);
			return {
				...currentState,
				favorites: alreadyFavorite
					? currentState.favorites.filter(
							(favoriteId) => favoriteId !== questionId,
						)
					: [...currentState.favorites, questionId],
			};
		});
	}, []);

	const startPracticeSession = useCallback((payload: StartPracticeSessionPayload) => {
		setUserState((currentState) => ({
			...currentState,
			activeSession: buildPracticeSession(payload),
		}));
	}, []);

	const toggleWrongQuestionMastery = useCallback(
		(questionId: string, mastered: boolean) => {
			setUserState((currentState) => ({
				...currentState,
				wrongHistory: currentState.wrongHistory.map((entry) =>
					entry.questionId === questionId
						? {
								...entry,
								mastered,
								lastAnsweredAt: new Date().toISOString(),
							}
						: entry,
				),
			}));
		},
		[],
	);

	const setPracticeQuestionIndex = useCallback((index: number) => {
		setUserState((currentState) => {
			if (currentState.activeSession?.mode !== "practice") {
				return currentState;
			}

			return {
				...currentState,
				activeSession: {
					...currentState.activeSession,
					currentIndex: index,
				},
			};
		});
	}, []);

	const recordPracticeAnswer = useCallback((payload: PracticeAnswerPayload) => {
		setUserState((currentState) => {
			const currentProgress = currentState.practiceProgress[payload.chapterId];

			// Count how many questions in this chapter have been answered in the current session.
			// This is more accurate than using chapterQuestionIndex + 1 (positional estimate).
			let sessionChapterAnsweredCount = 0
			if (currentState.activeSession?.mode === 'practice') {
				const session = currentState.activeSession
				const updatedAnswers = { ...session.answers, [payload.questionId]: payload.answer }
				sessionChapterAnsweredCount = session.questionIds.filter(
					(qId) => qId === payload.questionId || qId in updatedAnswers
				).filter((qId) =>
					// Only count questions that belong to this chapter (relevant for full-bank sessions)
					qId.startsWith(payload.chapterId)
				).length
			}

			const completedCount = Math.max(
				currentProgress?.completedCount ?? 0,
				sessionChapterAnsweredCount,
				payload.chapterQuestionIndex + 1,
			);

			return {
				...currentState,
				practiceProgress: {
					...currentState.practiceProgress,
					[payload.chapterId]: {
						completedCount,
						lastQuestionId: payload.questionId,
					},
				},
				wrongHistory: upsertWrongHistory(
					currentState,
					payload.questionId,
					payload.isCorrect,
				),
				activeSession:
					currentState.activeSession?.mode === "practice"
						? {
							...currentState.activeSession,
							answers: {
								...currentState.activeSession.answers,
								[payload.questionId]: payload.answer,
							},
							currentIndex: payload.currentIndex,
						}
						: currentState.activeSession,
			};
		});
	}, []);

	const clearPracticeAnswer = useCallback((questionId: string) => {
		setUserState((currentState) => {
			if (currentState.activeSession?.mode !== "practice") {
				return currentState;
			}

			const newAnswers = { ...currentState.activeSession.answers };
			delete newAnswers[questionId];

			return {
				...currentState,
				activeSession: {
					...currentState.activeSession,
					answers: newAnswers,
				},
			};
		});
	}, []);

	const startExamSession = useCallback((payload: StartExamSessionPayload) => {
		setUserState((currentState) => ({
			...currentState,
			activeSession: buildExamSession(payload),
		}));
	}, []);

	const startMockExamSession = useCallback((payload: StartMockExamSessionPayload) => {
		setUserState((currentState) => ({
			...currentState,
			activeSession: buildMockExamSession(payload),
		}));
	}, []);

	const setExamQuestionIndex = useCallback((index: number) => {
		setUserState((currentState) => {
			if (currentState.activeSession?.mode !== "exam") {
				return currentState;
			}

			return {
				...currentState,
				activeSession: {
					...currentState.activeSession,
					currentIndex: index,
				},
			};
		});
	}, []);

	const setExamAnswer = useCallback((questionId: string, answer: AnswerLabel) => {
		setUserState((currentState) => {
			if (currentState.activeSession?.mode !== "exam") {
				return currentState;
			}

			return {
				...currentState,
				activeSession: {
					...currentState.activeSession,
					answers: {
						...currentState.activeSession.answers,
						[questionId]: answer,
					},
				},
			};
		});
	}, []);

	const setMockExamQuestionIndex = useCallback((index: number) => {
		setUserState((currentState) => {
			if (currentState.activeSession?.mode !== "mock-exam") {
				return currentState;
			}

			return {
				...currentState,
				activeSession: {
					...currentState.activeSession,
					currentIndex: index,
				},
			};
		});
	}, []);

	const setMockExamAnswer = useCallback((questionId: string, answer: AnswerLabel) => {
		setUserState((currentState) => {
			if (currentState.activeSession?.mode !== "mock-exam") {
				return currentState;
			}

			return {
				...currentState,
				activeSession: {
					...currentState.activeSession,
					answers: {
						...currentState.activeSession.answers,
						[questionId]: answer,
					},
				},
			};
		});
	}, []);

	const clearActiveSession = useCallback(() => {
		setUserState((currentState) => ({
			...currentState,
			activeSession: null,
		}));
	}, []);

	const recordExamResult = useCallback((payload: ExamResultPayload) => {
		setUserState((currentState) => {
			let nextState = {
				...currentState,
				examHistory: [
					{
						id: payload.examId,
						completionReason: payload.completionReason,
						score: payload.score,
						timerMinutes: payload.timerMinutes,
						totalQuestions: payload.totalQuestions,
						completedAt: new Date().toISOString(),
					},
					...currentState.examHistory,
				],
				activeSession: null,
			};

			for (const questionId of payload.wrongQuestionIds) {
				nextState = {
					...nextState,
					wrongHistory: upsertWrongHistory(nextState, questionId, false),
				};
			}

			return nextState;
		});
	}, []);

	const recordMockExamResult = useCallback((payload: MockExamResultPayload) => {
		setUserState((currentState) => {
			let nextState = {
				...currentState,
				mockExamHistory: [
					{
						id: payload.examId,
						answers: payload.answers,
						score: payload.score,
						totalQuestions: payload.totalQuestions,
						correctCount: payload.correctCount,
						wrongCount: payload.wrongCount,
						unansweredCount: payload.unansweredCount,
						wrongQuestionIds: payload.wrongQuestionIds,
						accuracy:
							payload.totalQuestions === 0
								? 0
								: Math.round((payload.correctCount / payload.totalQuestions) * 100),
						completedAt: new Date().toISOString(),
					},
					...currentState.mockExamHistory,
				],
				activeSession: null,
			};

			for (const questionId of payload.wrongQuestionIds) {
				nextState = {
					...nextState,
					wrongHistory: upsertWrongHistory(nextState, questionId, false),
				};
			}

			return nextState;
		});
	}, []);

	const mergeRemoteState = useCallback((remoteState: AppUserState) => {
		setUserState((localState) => mergeStates(localState, remoteState));
	}, []);

	const value = useMemo<AppStateContextValue>(
		() => ({
			userState,
			hydrated,
			clearActiveSession,
			setExamAnswer,
			setExamQuestionIndex,
			setMockExamAnswer,
			setMockExamQuestionIndex,
			setPracticeQuestionIndex,
			startExamSession,
			startMockExamSession,
			startPracticeSession,
			toggleWrongQuestionMastery,
			toggleFavorite,
			recordPracticeAnswer,
			clearPracticeAnswer,
			recordExamResult,
			recordMockExamResult,
			mergeRemoteState,
		}),
		[
			clearActiveSession,
			hydrated,
			recordExamResult,
			recordMockExamResult,
			recordPracticeAnswer,
			clearPracticeAnswer,
			setExamAnswer,
			setExamQuestionIndex,
			setMockExamAnswer,
			setMockExamQuestionIndex,
			setPracticeQuestionIndex,
			startExamSession,
			startMockExamSession,
			startPracticeSession,
			toggleWrongQuestionMastery,
			toggleFavorite,
			userState,
			mergeRemoteState,
		],
	);

	return (
		<AppStateContext.Provider value={value}>
			{children}
		</AppStateContext.Provider>
	);
}

export function useAppState(): AppStateContextValue {
	const context = useContext(AppStateContext);

	if (!context) {
		throw new Error("useAppState must be used within AppStateProvider");
	}

	return context;
}
