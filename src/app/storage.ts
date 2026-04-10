import { openDB } from 'idb'

import type { AppUserState } from './types'

const DB_NAME = 'strategic-management-quiz'
const STORE_NAME = 'app-state'
const STATE_KEY = 'user-state'

// localStorage key for crash-refresh recovery (synchronous, always available)
const LS_KEY = 'sm-quiz-state'

export const defaultUserState: AppUserState = {
  favorites: [],
  wrongHistory: [],
  practiceProgress: {},
  examHistory: [],
  mockExamHistory: [],
  activeSession: null,
}

function supportsIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined'
}

async function getDatabase() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    },
  })
}

export async function loadUserState(): Promise<AppUserState> {
  // ── Step 1: localStorage (synchronous, always available as baseline) ──
  let lsState: AppUserState | null = null
  try {
    const lsRaw = localStorage.getItem(LS_KEY)
    if (lsRaw) {
      lsState = JSON.parse(lsRaw) as AppUserState
    }
  } catch {
    // ignore parse errors
  }

  if (!supportsIndexedDb()) {
    return lsState ?? defaultUserState
  }

  // ── Step 2: IndexedDB (async, larger capacity) — prefer it if present ──
  const database = await getDatabase()
  const stored = await database.get(STORE_NAME, STATE_KEY)

  if (stored) {
    // IndexedDB wins; update localStorage to stay in sync
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(stored))
    } catch {
      // ignore
    }
    return { ...defaultUserState, ...stored }
  }

  // ── Step 3: fallback to localStorage if IndexedDB is empty ──
  return lsState ?? defaultUserState
}

export async function saveUserState(state: AppUserState): Promise<void> {
  if (!supportsIndexedDb()) {
    return
  }

  // Always write to localStorage first (sync) as a crash-refresh backup
  // then write to IndexedDB (async, larger capacity)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be full or unavailable — continue without it
  }

  const database = await getDatabase()
  await database.put(STORE_NAME, state, STATE_KEY)
}

/**
 * Synchronous save for use in beforeunload / pagehide — avoids async race.
 * Writes only to localStorage (IndexedDB writes are already covered by
 * the periodic async saves, and synchronous IndexedDB is not universally
 * supported across iOS Safari).
 */
export function saveUserStateSync(state: AppUserState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

const THEME_KEY = 'app-theme'

export function getTheme(): 'light' | 'dark' | null {
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return null
}

export function setTheme(theme: 'light' | 'dark') {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(THEME_KEY, theme)
}
