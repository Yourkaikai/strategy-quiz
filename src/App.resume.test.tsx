import "@testing-library/jest-dom/vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import type { AppUserState } from "./app/types";

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
		loadUserState: vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
			return currentState;
		}),
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

describe("chapter resume persistence", () => {
	beforeEach(() => {
		storageMock.reset();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("preserves existing chapter session instead of creating new one", async () => {
		storageMock.reset({
			activeSession: {
				mode: "practice",
				subset: "chapter",
				chapterId: "02-external-analysis",
				questionIds: [
					"02-external-analysis-q001",
					"02-external-analysis-q002",
					"02-external-analysis-q003",
				],
				currentIndex: 1,
				answers: { "02-external-analysis-q001": "B" },
				startedAt: "2026-04-09T10:00:00.000Z",
			},
		});

		renderAt("/");

		await screen.findByRole("heading", { name: /welcome back/i });

		const chapterButton = screen.getByRole("button", {
			name: /practice external analysis/i,
		});
		fireEvent.click(chapterButton);

		await vi.waitFor(() => {
			expect(storageMock.saveUserState).toHaveBeenCalled();
		});

		const savedCalls = storageMock.saveUserState.mock.calls;
		const lastSavedState = savedCalls[savedCalls.length - 1][0];

		expect(lastSavedState.activeSession.questionIds.length).toBe(3);
	});

	it("creates new session for different chapter", async () => {
		storageMock.reset({
			activeSession: {
				mode: "practice",
				subset: "chapter",
				chapterId: "01-intro",
				questionIds: ["01-intro-q001", "01-intro-q002"],
				currentIndex: 1,
				answers: { "01-intro-q001": "A" },
				startedAt: "2026-04-09T10:00:00.000Z",
			},
		});

		renderAt("/");

		await screen.findByRole("heading", { name: /welcome back/i });

		const chapterButton = screen.getByRole("button", {
			name: /practice external analysis/i,
		});
		fireEvent.click(chapterButton);

		await vi.waitFor(() => {
			expect(storageMock.saveUserState).toHaveBeenCalled();
		});

		const savedCalls = storageMock.saveUserState.mock.calls;
		const lastSavedState = savedCalls[savedCalls.length - 1][0];

		expect(lastSavedState.activeSession.questionIds.length).toBe(28);
		expect(lastSavedState.activeSession.chapterId).toBe("02-external-analysis");
	});
});