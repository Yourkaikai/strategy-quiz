import "@testing-library/jest-dom/vitest";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import type { AppUserState } from "./app/types";
import { getQuestionById } from "./lib/questions";

Element.prototype.scrollIntoView = vi.fn();

const storageMock = vi.hoisted(() => {
	const defaultState: AppUserState = {
		favorites: [],
		wrongHistory: [],
		practiceProgress: {},
		examHistory: [],
		mockExamHistory: [],
		activeSession: null,
	};

	let currentState = structuredClone(defaultState) as AppUserState & Record<string, unknown>;

	return {
		defaultUserState: defaultState,
		loadUserState: vi.fn(async () => currentState),
		saveUserState: vi.fn(async (state) => {
			currentState = state;
		}),
		reset(nextState?: Partial<AppUserState> & Record<string, unknown>) {
			currentState = {
				favorites: [],
				wrongHistory: [],
				practiceProgress: {},
				examHistory: [],
				mockExamHistory: [],
				activeSession: null,
				...structuredClone(nextState ?? {}),
			} as AppUserState & Record<string, unknown>;
		},
	};
});

vi.mock("./app/storage", () => ({
	defaultUserState: storageMock.defaultUserState,
	loadUserState: storageMock.loadUserState,
	saveUserState: storageMock.saveUserState,
	getTheme: () => null as 'light' | 'dark' | null,
	setTheme: () => {},
}));

function renderAt(path: string) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<App />
		</MemoryRouter>,
	);
}

function getRequiredQuestion(questionId: string) {
	const question = getQuestionById(questionId);

	if (!question) {
		throw new Error(`Missing test question: ${questionId}`);
	}

	return question;
}

describe("app shell routes", () => {
	beforeEach(() => {
		storageMock.reset();
		storageMock.loadUserState.mockClear();
		storageMock.saveUserState.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	it.each([
		["/", "Strategic Management"],
		["/practice", "Practice"],
		["/exam/setup", "Exam Setup"],
		["/exam/session", "Exam Setup"],
		["/exam/results", "Exam Results"],
		["/review", "Review"],
	])("renders %s", (path, heading) => {
		renderAt(path);

		expect(
			screen.getByRole("heading", {
				name: new RegExp(heading, "i"),
			}),
		).toBeInTheDocument();
	});

	it("renders real chapter data on the home page", () => {
		renderAt("/");

    screen.debug();

		expect(screen.getAllByText(/226 total questions/i).length).toBeGreaterThan(
			0,
		);
		expect(screen.getAllByText(/01-intro/i).length).toBeGreaterThan(0);
		expect(
			screen.getAllByText(/08-technology-and-innovation-2/i).length,
		).toBeGreaterThan(0);
		expect(screen.getAllByText(/09-organizational-design/i).length).toBeGreaterThan(0);
	});

	it("uses a real practice question with immediate feedback and favorite toggling", async () => {
		renderAt("/practice");

		expect(
			screen.getByRole("heading", {
				name: /when an organization briefly describes what they do and how they do it/i,
			}),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: /a strategic intent/i }),
		);

		expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
		expect(screen.getByText(/correct answer: b/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /add to favorites/i }));

		expect(
			screen.getByRole("button", { name: /remove favorite/i }),
		).toBeInTheDocument();
	});

	it("shows authored explanations after a wrong answer in technology and innovation part 1 practice", async () => {
		const question = getRequiredQuestion("07-technology-and-innovation-1-q001");

		storageMock.reset({
			activeSession: {
				mode: "practice",
				subset: "chapter",
				chapterId: "07-technology-and-innovation-1",
				questionIds: ["07-technology-and-innovation-1-q001"],
				currentIndex: 0,
				answers: {},
				startedAt: "2026-04-10T10:00:00.000Z",
			},
		});

		renderAt("/practice");

		await screen.findByRole("heading", { name: new RegExp(question.stem, "i") });

		fireEvent.click(
			screen.getByRole("button", {
				name: `A: ${question.options[0].text}`,
			}),
		);

		expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
		expect(screen.getByText(question.explanation ?? "")).toBeInTheDocument();
		expect(screen.getByText(question.examTip ?? "")).toBeInTheDocument();

		for (const option of question.options) {
			expect(screen.getByText(option.explanation ?? "")).toBeInTheDocument();
		}
	});

	it("shows authored explanations after a correct answer in technology and innovation part 1 practice", async () => {
		const question = getRequiredQuestion("07-technology-and-innovation-1-q001");

		storageMock.reset({
			activeSession: {
				mode: "practice",
				subset: "chapter",
				chapterId: "07-technology-and-innovation-1",
				questionIds: ["07-technology-and-innovation-1-q001"],
				currentIndex: 0,
				answers: {},
				startedAt: "2026-04-10T10:00:00.000Z",
			},
		});

		renderAt("/practice");

		await screen.findByRole("heading", { name: new RegExp(question.stem, "i") });

		fireEvent.click(
			screen.getByRole("button", {
				name: `B: ${question.options[1].text}`,
			}),
		);

		expect(screen.getByText(/correct!/i)).toBeInTheDocument();
		expect(screen.getByText(question.explanation ?? "")).toBeInTheDocument();
		expect(screen.getByText(question.examTip ?? "")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /retry this question/i })).not.toBeInTheDocument();
	});

	it("hides the global shell header on practice question routes", () => {
		renderAt("/practice");

		expect(
			screen.queryByRole("heading", { name: /strategic management/i }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: /when an organization briefly describes what they do and how they do it/i,
			}),
		).toBeInTheDocument();
	});

	it("runs an exam from setup through results and computes score from selected answers", async () => {
		renderAt("/exam/setup");

		fireEvent.click(screen.getByRole("button", { name: /random/i }));
		fireEvent.change(screen.getByLabelText(/question count/i), {
			target: { value: "2" },
		});
		expect(screen.getByText(/random · 2 questions/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /sequential/i }));
		fireEvent.click(screen.getByRole("button", { name: /start exam/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /exam session/i }),
			).toBeInTheDocument();
		});

		expect(
			screen.queryByRole("heading", { name: /strategic management/i }),
		).not.toBeInTheDocument();

		expect(screen.getByLabelText(/exam answer choices/i)).toBeInTheDocument();
		expect(screen.queryByText(/correct answer:/i)).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: /b mission statement/i }),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /all of the following are external stakeholders except/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /a customers/i }));
		fireEvent.click(screen.getByRole("button", { name: /submit exam/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /exam results/i }),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/1 \/ 2/i)).toBeInTheDocument();
		expect(screen.getByText(/50%/i)).toBeInTheDocument();
		expect(screen.getByText(/^1$/i)).toBeInTheDocument();
	});

	it("shows a dedicated Ultimate Test card on the home page and routes into a fixed mock overview", async () => {
		renderAt("/");

		await screen.findByRole("heading", { name: /study dashboard/i });

		expect(
			screen.getByRole("heading", { name: /ultimate test/i, level: 3 }),
		).toBeInTheDocument();
		expect(screen.getAllByText(/teacher mock exam/i).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/37 questions/i).length).toBeGreaterThan(0);

		fireEvent.click(screen.getByRole("link", { name: /open ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /ultimate test/i }),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/sm 2026 practice exam v2/i)).toBeInTheDocument();
		expect(screen.getByText(/correct = \+1/i)).toBeInTheDocument();
		expect(screen.getByText(/wrong = -1/i)).toBeInTheDocument();
		expect(screen.getByText(/unanswered = 0/i)).toBeInTheDocument();
		expect(screen.queryByLabelText(/question count/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/^random$/i)).not.toBeInTheDocument();
	});

	it("runs the dedicated mock flow with penalized scoring, separate mock history, and shared wrong-question review", async () => {
		renderAt("/");

		await screen.findByRole("heading", { name: /study dashboard/i });

		fireEvent.click(screen.getByRole("link", { name: /open ultimate test/i }));
		await screen.findByRole("button", { name: /start ultimate test/i });
		fireEvent.click(screen.getByRole("button", { name: /start ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /consumer surplus is equal to/i }),
			).toBeInTheDocument();
		});

		expect(
			screen.queryByRole("heading", { name: /strategic management/i }),
		).not.toBeInTheDocument();

		expect(screen.getByText(/1 \/ 37/i)).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", {
				name: /b the difference between the amount consumers would be willing to pay for a product and what they actually pay/i,
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /which of the following summarizes the difference between corporate strategy and business strategy/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /a corporate strategy deals with how to compete; business strategy deals with where to compete/i,
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		for (let index = 0; index < 34; index += 1) {
			fireEvent.click(screen.getByRole("button", { name: /next question/i }));
		}

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /what is a key strategy to jump-start network effects/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /submit ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /ultimate test results/i }),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/final score/i)).toBeInTheDocument();
		expect(screen.getAllByText(/^0$/i).length).toBeGreaterThan(0);
		expect(screen.getByText(/^1 correct$/i)).toBeInTheDocument();
		expect(screen.getByText(/^1 wrong$/i)).toBeInTheDocument();
		expect(screen.getByText(/^35 unanswered$/i)).toBeInTheDocument();
		expect(screen.getByText(/3% accuracy/i)).toBeInTheDocument();
		expect(screen.getByText(/wrong-answer review list/i)).toBeInTheDocument();
		expect(
			screen.getByText(
				/which of the following summarizes the difference between corporate strategy and business strategy/i,
			),
		).toBeInTheDocument();
		expect(screen.getByText(/your answer: a/i)).toBeInTheDocument();
		expect(screen.getByText(/correct answer: d/i)).toBeInTheDocument();

		const savedState = storageMock.saveUserState.mock.calls.at(-1)?.[0] as Record<string, unknown> | undefined;

		expect(savedState).toBeDefined();
		expect(savedState?.examHistory).toEqual([]);
		expect(savedState?.mockExamHistory).toMatchObject([
			{
				score: 0,
				correctCount: 1,
				wrongCount: 1,
				unansweredCount: 35,
				totalQuestions: 37,
			},
		]);

		fireEvent.click(screen.getByRole("link", { name: /review wrong questions/i }));

		await waitFor(() => {
			expect(screen.getByRole("heading", { name: /review/i })).toBeInTheDocument();
		});

		expect(
			screen.getByText(
				/which of the following summarizes the difference between corporate strategy and business strategy/i,
			),
		).toBeInTheDocument();
		expect(
			screen.queryByText(
				/suzi lau apparels inc\. \(sla\) had been outsourcing its production to less-developed countries/i,
			),
		).not.toBeInTheDocument();
	});

	it("shows wrong-history and favorite questions from shared app state on the review page", async () => {
		storageMock.reset({
			favorites: ["01-intro-q001"],
			wrongHistory: [
				{
					questionId: "01-intro-q002",
					attempts: 2,
					mastered: false,
					lastAnsweredAt: "2026-04-03T12:00:00.000Z",
				},
			],
			practiceProgress: {
				"01-intro": {
					completedCount: 2,
					lastQuestionId: "01-intro-q002",
				},
			},
		});

		renderAt("/review");

		await waitFor(() => {
			expect(
				screen.getByText(
					/all of the following are external stakeholders except/i,
				),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("tab", { name: /favorites/i }));

		expect(
			screen.getByText(
				/when an organization briefly describes what they do and how they do it/i,
			),
		).toBeInTheDocument();
	});

	it("runs a timed exam session and auto-submits when the timer expires", async () => {
		vi.useFakeTimers();

		renderAt("/exam/setup");

		fireEvent.change(screen.getByLabelText(/question count/i), {
			target: { value: "2" },
		});
		fireEvent.change(screen.getByLabelText(/timer minutes/i), {
			target: { value: "1" },
		});
		fireEvent.click(screen.getByRole("button", { name: /start exam/i }));

		await act(async () => {
			await Promise.resolve();
		});

		expect(
			screen.getByRole("heading", { name: /exam session/i }),
		).toBeInTheDocument();

		expect(screen.getByText(/01:00 remaining/i)).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(60_000);
		});

		await act(async () => {
			await Promise.resolve();
		});

		expect(
			screen.getByRole("heading", { name: /exam results/i }),
		).toBeInTheDocument();

		expect(screen.getByText(/time expired/i)).toBeInTheDocument();
		expect(screen.getByText(/timer: 1 minute/i)).toBeInTheDocument();
	});

	it("resumes an active practice session from persisted shared state", async () => {
		storageMock.reset({
			activeSession: {
				mode: "practice",
				subset: "all",
				questionIds: ["01-intro-q001", "01-intro-q002"],
				currentIndex: 1,
				answers: {
					"01-intro-q001": "B",
				},
				startedAt: "2026-04-03T12:00:00.000Z",
			},
		});

		renderAt("/");

		await screen.findByRole("heading", { name: /study dashboard/i });

		fireEvent.click(screen.getByRole("link", { name: /resume practice session/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /all of the following are external stakeholders except/i,
				}),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/2 \/ 2/i)).toBeInTheDocument();
		expect(screen.getByText(/resumed session/i)).toBeInTheDocument();
	});

	it("starts wrong-question practice from review using persisted wrong-history", async () => {
		storageMock.reset({
			wrongHistory: [
				{
					questionId: "01-intro-q002",
					attempts: 2,
					mastered: false,
					lastAnsweredAt: "2026-04-03T12:00:00.000Z",
				},
			],
		});

		renderAt("/review");

		await screen.findByRole("heading", { name: /review/i });

		fireEvent.click(
			screen.getByRole("button", { name: /practice wrong questions/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /all of the following are external stakeholders except/i,
				}),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/wrong-only drill/i)).toBeInTheDocument();
		expect(screen.getByText(/1 \/ 1/i)).toBeInTheDocument();
	});

	it("starts a chapter-scoped practice session from the home page", async () => {
		renderAt("/");

		await screen.findByRole("heading", { name: /study dashboard/i });

		fireEvent.click(
			screen.getByRole("button", { name: /practice 02-external-analysis/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /the core of a firm’s business environment is comprised by:/i,
				}),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/chapter drill · 02-external-analysis · q1/i)).toBeInTheDocument();
		expect(screen.getByText(/1 \/ 28/i)).toBeInTheDocument();
	});

	it("shows wrong-question retry stats and persists mastered toggles in review", async () => {
		storageMock.reset({
			wrongHistory: [
				{
					questionId: "01-intro-q002",
					attempts: 3,
					mastered: false,
					lastAnsweredAt: "2026-04-03T12:00:00.000Z",
				},
			],
		});

		renderAt("/review");

		await screen.findByRole("heading", { name: /review/i });

		expect(screen.getByText(/retry count: 3/i)).toBeInTheDocument();
		expect(screen.getByText(/needs retry/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /mark mastered/i }));

		await waitFor(() => {
			expect(screen.getByText(/^mastered$/i)).toBeInTheDocument();
		});

		expect(screen.getByRole("button", { name: /mark unmastered/i })).toBeInTheDocument();

		cleanup();
		renderAt("/review");

		await screen.findByRole("heading", { name: /review/i });

		expect(screen.getByText(/retry count: 3/i)).toBeInTheDocument();
		expect(screen.getByText(/^mastered$/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /mark unmastered/i }));

		await waitFor(() => {
			expect(screen.getByText(/needs retry/i)).toBeInTheDocument();
		});
	});

	it("shows action buttons on wrong-answer review entries and can retry a single question", async () => {
		renderAt("/");

		await screen.findByRole("heading", { name: /study dashboard/i });

		fireEvent.click(screen.getByRole("link", { name: /open ultimate test/i }));
		await screen.findByRole("button", { name: /start ultimate test/i });
		fireEvent.click(screen.getByRole("button", { name: /start ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /consumer surplus is equal to/i }),
			).toBeInTheDocument();
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /b the difference between the amount consumers would be willing to pay for a product and what they actually pay/i,
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /which of the following summarizes the difference between corporate strategy and business strategy/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /a corporate strategy deals with how to compete; business strategy deals with where to compete/i,
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		for (let index = 0; index < 34; index += 1) {
			fireEvent.click(screen.getByRole("button", { name: /next question/i }));
		}

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /what is a key strategy to jump-start network effects/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /submit ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /ultimate test results/i }),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/wrong-answer review list/i)).toBeInTheDocument();

		const retryButtons = screen.getAllByRole("button", { name: /retry this question/i });
		expect(retryButtons.length).toBeGreaterThan(0);

		const addToPracticeButtons = screen.getAllByRole("button", { name: /add to wrong-question practice/i });
		expect(addToPracticeButtons.length).toBeGreaterThan(0);

		fireEvent.click(retryButtons[0]);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /which of the following summarizes the difference between corporate strategy and business strategy/i,
				}),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/1 \/ 1/i)).toBeInTheDocument();
	});

	it("adds a wrong question to practice queue when clicking add button", async () => {
		renderAt("/");

		await screen.findByRole("heading", { name: /study dashboard/i });

		fireEvent.click(screen.getByRole("link", { name: /open ultimate test/i }));
		await screen.findByRole("button", { name: /start ultimate test/i });
		fireEvent.click(screen.getByRole("button", { name: /start ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /consumer surplus is equal to/i }),
			).toBeInTheDocument();
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /b the difference between the amount consumers would be willing to pay for a product and what they actually pay/i,
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /which of the following summarizes the difference between corporate strategy and business strategy/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(
			screen.getByRole("button", {
				name: /a corporate strategy deals with how to compete; business strategy deals with where to compete/i,
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: /next question/i }));

		for (let index = 0; index < 34; index += 1) {
			fireEvent.click(screen.getByRole("button", { name: /next question/i }));
		}

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: /what is a key strategy to jump-start network effects/i,
				}),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: /submit ultimate test/i }));

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /ultimate test results/i }),
			).toBeInTheDocument();
		});

		const addToPracticeButtons = screen.getAllByRole("button", { name: /add to wrong-question practice/i });
		expect(addToPracticeButtons.length).toBeGreaterThan(0);

		fireEvent.click(addToPracticeButtons[0]);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /practice/i }),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/wrong-only drill/i)).toBeInTheDocument();
	});
});
