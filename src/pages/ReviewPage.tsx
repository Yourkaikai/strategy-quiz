import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppState } from "../app/state";
import type { QuestionRecord } from "../app/types";
import { getChapterSummaries, getQuestionById } from "../lib/questions";

type ReviewTab = "wrong" | "favorites" | "incomplete";

function isQuestionRecord(
	question: QuestionRecord | undefined,
): question is QuestionRecord {
	return question != null;
}

export function ReviewPage() {
	const navigate = useNavigate();
	const { startPracticeSession, toggleWrongQuestionMastery, userState } = useAppState();
	const [activeTab, setActiveTab] = useState<ReviewTab>("wrong");

	const wrongQuestions = useMemo(() => {
		return userState.wrongHistory
			.map((entry) => ({ entry, question: getQuestionById(entry.questionId) }))
			.filter(
				(
					item,
				): item is {
					entry: (typeof userState.wrongHistory)[number];
					question: QuestionRecord;
				} => {
					return item.question != null;
				},
			);
	}, [userState.wrongHistory]);

	const retryQuestions = useMemo(() => {
		return wrongQuestions.filter(({ entry }) => !entry.mastered);
	}, [wrongQuestions]);

	const favoriteQuestions = useMemo(() => {
		return userState.favorites
			.map((questionId) => getQuestionById(questionId))
			.filter(isQuestionRecord);
	}, [userState.favorites]);

	const incompleteChapters = useMemo(() => {
		return getChapterSummaries().filter((chapter) => {
			const completedCount =
				userState.practiceProgress[chapter.chapterId]?.completedCount ?? 0;
			return completedCount > 0 && completedCount < chapter.questionCount;
		});
	}, [userState.practiceProgress]);

	const handleWrongPracticeStart = () => {
		if (retryQuestions.length === 0) {
			return;
		}

		startPracticeSession({
			questionIds: retryQuestions.map(({ question }) => question.id),
			subset: "wrong",
		});
		navigate("/practice");
	};

	return (
		<section className="page-stack review-page" aria-labelledby="review-heading">
			<div className="page-header">
				<p className="section-kicker">Study recovery</p>
				<h2 id="review-heading">Review</h2>
				<p className="muted-copy">
					Keep wrong answers, favorites, and incomplete sessions accessible from
					one quiet workspace.
				</p>
			</div>

			<section className="content-panel review-content-panel">
				{activeTab === "wrong" && retryQuestions.length > 0 ? (
					<div className="action-row review-actions">
						<button
							className="primary-button"
							type="button"
							onClick={handleWrongPracticeStart}
						>
							Practice wrong questions
						</button>
					</div>
				) : null}

				<div
					className="segment-row review-segment-row"
					role="tablist"
					aria-label="Review sections"
				>
					{[
						["wrong", "Wrong"],
						["favorites", "Saved"],
						["incomplete", "Partial"],
					].map(([value, label]) => (
						<button
							key={value}
							className={
								activeTab === value
									? "segment-chip is-selected"
									: "segment-chip"
							}
							type="button"
							role="tab"
							aria-selected={activeTab === value}
							onClick={() => setActiveTab(value as ReviewTab)}
						>
							{label}
						</button>
					))}
				</div>

				{activeTab === "wrong" ? (
					<div className="review-list">
						{wrongQuestions.length === 0 ? (
							<article className="review-card review-empty-state">
								<p className="card-title">No missed questions yet.</p>
								<p className="muted-copy">
									Questions you answer incorrectly in practice or exam sessions will appear
									here.
								</p>
							</article>
						) : (
							wrongQuestions.map(({ entry, question }) => (
								<article key={question.id} className="review-card">
									<p className="card-title">{question.stem}</p>
									<p className="muted-copy">
										{question.chapterId} · Retry count: {entry.attempts}
									</p>
									<div className="review-card-meta">
										<span className={entry.mastered ? "status-pill" : "status-chip"}>
											{entry.mastered ? "Mastered" : "Needs retry"}
										</span>
										<button
											className="ghost-button review-toggle"
											type="button"
											onClick={() =>
												toggleWrongQuestionMastery(question.id, !entry.mastered)
											}
										>
											{entry.mastered ? "Mark unmastered" : "Mark mastered"}
										</button>
									</div>
								</article>
							))
						)}
					</div>
				) : null}

				{activeTab === "favorites" ? (
					<div className="review-list">
						{favoriteQuestions.length === 0 ? (
							<article className="review-card review-empty-state">
								<p className="card-title">No saved questions yet.</p>
								<p className="muted-copy">
									Save important questions during practice to collect them here.
								</p>
							</article>
						) : (
							favoriteQuestions.map((question) => (
								<article key={question.id} className="review-card">
									<p className="card-title">{question.stem}</p>
									<p className="muted-copy">
										{question.chapterId} · answer {question.correctAnswer}
									</p>
								</article>
							))
						)}
					</div>
				) : null}

				{activeTab === "incomplete" ? (
					<div className="review-list">
						{incompleteChapters.length === 0 ? (
							<article className="review-card review-empty-state">
								<p className="card-title">No partially completed chapters.</p>
								<p className="muted-copy">
									Practice progress will surface here once a chapter is
									underway.
								</p>
							</article>
						) : (
							incompleteChapters.map((chapter) => {
								const progress = userState.practiceProgress[chapter.chapterId];
								const completedCount = progress?.completedCount ?? 0;

								return (
									<article key={chapter.chapterId} className="review-card">
										<p className="card-title">{chapter.chapterTitle}</p>
										<p className="muted-copy">
											{chapter.chapterId} · {completedCount}/
											{chapter.questionCount} complete
										</p>
									</article>
								);
							})
						)}
					</div>
				) : null}
			</section>
		</section>
	);
}
