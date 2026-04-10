/**
 * GitHub Gist sync service for cross-device progress synchronization.
 *
 * Flow:
 *   1. User generates a Personal Access Token (PAT) on GitHub (no scopes needed)
 *   2. Paste the PAT into the sync settings
 *   3. "Upload" saves current progress to a private Gist
 *   4. "Download" pulls progress from the Gist and merges it
 */

import { defaultUserState } from './storage'
import type { AppUserState } from './types'

// ── localStorage keys ──
const TOKEN_KEY = 'sm-quiz-gist-token'
const GIST_ID_KEY = 'sm-quiz-gist-id'
const GIST_SYNCED_AT_KEY = 'sm-quiz-gist-synced-at'

// ── Gist metadata ──
const GIST_FILENAME = 'strategy-quiz-progress.json'
const GIST_DESCRIPTION = 'Strategic Management Quiz - Progress Sync (auto-managed)'

// ── Public types ──
export interface GistSyncStatus {
  connected: boolean
  token: boolean
  gistId: string | null
  lastSyncedAt: string | null
}

export interface GistPayload {
  version: 1
  exportedAt: string
  state: AppUserState
}

export interface SyncResult {
  success: boolean
  message: string
  lastSyncedAt?: string
}

// ── Token management ──

export function hasToken(): boolean {
  try {
    return !!localStorage.getItem(TOKEN_KEY)
  } catch {
    return false
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(GIST_ID_KEY)
  localStorage.removeItem(GIST_SYNCED_AT_KEY)
}

// ── Gist ID management ──

function getGistId(): string | null {
  try {
    return localStorage.getItem(GIST_ID_KEY)
  } catch {
    return null
  }
}

function saveGistId(gistId: string): void {
  localStorage.setItem(GIST_ID_KEY, gistId)
}

function getLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(GIST_SYNCED_AT_KEY)
  } catch {
    return null
  }
}

function saveLastSyncedAt(iso: string): void {
  localStorage.setItem(GIST_SYNCED_AT_KEY, iso)
}

// ── Status ──

export function getSyncStatus(): GistSyncStatus {
  return {
    connected: hasToken() && !!getGistId(),
    token: hasToken(),
    gistId: getGistId(),
    lastSyncedAt: getLastSyncedAt(),
  }
}

// ── GitHub API helpers ──

function headers(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function githubFetch(token: string, url: string, options?: RequestInit): Promise<Response> {
  const resp = await fetch(url, {
    ...options,
    headers: { ...headers(token), ...(options?.headers as Record<string, string> | undefined) },
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`GitHub API ${resp.status}: ${body || resp.statusText}`)
  }
  return resp
}

// ── Create or update Gist ──

export async function uploadProgress(state: AppUserState): Promise<SyncResult> {
  const token = getToken()
  if (!token) {
    return { success: false, message: 'No GitHub token configured.' }
  }

  // ── Guard: don't overwrite cloud with empty local state ──
  // This protects against accidentally uploading a blank slate from a new device.
  const hasAnyProgress =
    state.favorites.length > 0 ||
    state.wrongHistory.length > 0 ||
    Object.keys(state.practiceProgress).length > 0 ||
    state.examHistory.length > 0 ||
    state.mockExamHistory.length > 0
  if (!hasAnyProgress) {
    return {
      success: false,
      message: 'Nothing to upload — no progress recorded on this device yet. Download first to restore your data.',
    }
  }

  // ── Auto-discover gistId if not stored locally (prevents creating duplicate Gists) ──
  if (!getGistId()) {
    try {
      const resp = await githubFetch(token, 'https://api.github.com/gists?per_page=100')
      const gists = (await resp.json()) as Array<{
        id: string
        description: string
        files: Record<string, unknown>
      }>
      const found = gists.find(
        (g) => GIST_FILENAME in g.files || g.description === GIST_DESCRIPTION,
      )
      if (found) {
        saveGistId(found.id)
      }
    } catch {
      // ignore — will create a new gist if still not found
    }
  }

  const payload: GistPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    // Don't sync active session — it's transient and device-specific
    state: { ...state, activeSession: null },
  }

  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  })

  const existingGistId = getGistId()

  try {
    if (existingGistId) {
      // Update existing gist
      await githubFetch(token, `https://api.github.com/gists/${existingGistId}`, {
        method: 'PATCH',
        body,
      })
    } else {
      // Create new gist
      const resp = await githubFetch(token, 'https://api.github.com/gists', {
        method: 'POST',
        body,
      })
      const data = (await resp.json()) as { id: string }
      saveGistId(data.id)
    }

    const now = new Date().toISOString()
    saveLastSyncedAt(now)
    return { success: true, message: 'Progress uploaded to cloud.', lastSyncedAt: now }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    // If the gist was deleted, reset so we create a new one next time
    if (msg.includes('404')) {
      localStorage.removeItem(GIST_ID_KEY)
      return { success: false, message: 'Gist not found. It may have been deleted. Please try uploading again.' }
    }
    if (msg.includes('401')) {
      return { success: false, message: 'Token is invalid or expired. Please re-enter your token.' }
    }
    return { success: false, message: `Upload failed: ${msg}` }
  }
}

// ── Download and merge progress from Gist ──

function mergeStates(local: AppUserState, remote: AppUserState): AppUserState {
  // Strategy: merge by taking the "most recent" for each field.
  // For arrays (examHistory, mockExamHistory): union, deduplicate by ID, sort newest-first
  // For wrongHistory: merge by questionId, keep the entry with more attempts
  // For favorites: union of both sets
  // For practiceProgress: merge by chapterId, take the higher completedCount
  // activeSession: keep local (it's device-specific)

  const mergedWrongHistory = mergeWrongHistory(local.wrongHistory, remote.wrongHistory)
  const mergedFavorites = [...new Set([...local.favorites, ...remote.favorites])]
  const mergedPracticeProgress = mergeProgress(local.practiceProgress, remote.practiceProgress)
  const mergedExamHistory = mergeExamHistory(local.examHistory, remote.examHistory)
  const mergedMockExamHistory = mergeMockExamHistory(local.mockExamHistory, remote.mockExamHistory)

  return {
    ...local,
    favorites: mergedFavorites,
    wrongHistory: mergedWrongHistory,
    practiceProgress: mergedPracticeProgress,
    examHistory: mergedExamHistory,
    mockExamHistory: mergedMockExamHistory,
    // Keep local activeSession — it's device-specific
    activeSession: local.activeSession,
  }
}

function mergeWrongHistory(
  local: AppUserState['wrongHistory'],
  remote: AppUserState['wrongHistory'],
): AppUserState['wrongHistory'] {
  const map = new Map<string, AppUserState['wrongHistory'][number]>()

  for (const entry of local) {
    map.set(entry.questionId, entry)
  }
  for (const entry of remote) {
    const existing = map.get(entry.questionId)
    if (!existing || entry.attempts > existing.attempts) {
      map.set(entry.questionId, entry)
    }
  }

  return Array.from(map.values())
}

function mergeProgress(
  local: AppUserState['practiceProgress'],
  remote: AppUserState['practiceProgress'],
): AppUserState['practiceProgress'] {
  const merged = { ...local }
  for (const [chapterId, remoteEntry] of Object.entries(remote)) {
    const localEntry = merged[chapterId]
    if (!localEntry || remoteEntry.completedCount > localEntry.completedCount) {
      merged[chapterId] = remoteEntry
    }
  }
  return merged
}

function mergeExamHistory(
  local: AppUserState['examHistory'],
  remote: AppUserState['examHistory'],
): AppUserState['examHistory'] {
  // Both are newest-first. Union by ID, deduplicate.
  const seen = new Set<string>()
  const result: AppUserState['examHistory'] = []

  for (const entry of [...local, ...remote]) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id)
      result.push(entry)
    }
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  return result
}

function mergeMockExamHistory(
  local: AppUserState['mockExamHistory'],
  remote: AppUserState['mockExamHistory'],
): AppUserState['mockExamHistory'] {
  const seen = new Set<string>()
  const result: AppUserState['mockExamHistory'] = []

  for (const entry of [...local, ...remote]) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id)
      result.push(entry)
    }
  }

  result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  return result
}

export async function downloadProgress(): Promise<SyncResult> {
  const token = getToken()
  if (!token) {
    return { success: false, message: 'No GitHub token configured.' }
  }

  // ── Auto-discover gistId if not stored locally (e.g. on a new device) ──
  let gistId = getGistId()
  if (!gistId) {
    try {
      const resp = await githubFetch(token, 'https://api.github.com/gists?per_page=100')
      const gists = (await resp.json()) as Array<{
        id: string
        description: string
        files: Record<string, unknown>
      }>
      const found = gists.find(
        (g) => GIST_FILENAME in g.files || g.description === GIST_DESCRIPTION,
      )
      if (found) {
        saveGistId(found.id)
        gistId = found.id
      }
    } catch {
      // ignore — will fall through to the error below
    }
  }

  if (!gistId) {
    return { success: false, message: 'No cloud backup found. Upload your progress from another device first.' }
  }

  try {
    const resp = await githubFetch(token, `https://api.github.com/gists/${gistId}`)
    const gist = (await resp.json()) as {
      files: Record<string, { content?: string }>
    }

    const file = gist.files[GIST_FILENAME]
    if (!file?.content) {
      return { success: false, message: 'Gist file not found. Data may be corrupted.' }
    }

    const payload = JSON.parse(file.content) as GistPayload
    if (payload.version !== 1) {
      return { success: false, message: `Unsupported data version: ${payload.version}` }
    }

    // Validate remote state shape
    const remoteState: AppUserState = {
      ...defaultUserState,
      ...payload.state,
      activeSession: null,
    }

    // Return success with the remote state for the caller to merge
    const result: SyncResult & { remoteState?: AppUserState } = {
      success: true,
      message: `Progress downloaded (exported ${new Date(payload.exportedAt).toLocaleString()}).`,
      lastSyncedAt: payload.exportedAt,
      remoteState,
    }
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('404')) {
      localStorage.removeItem(GIST_ID_KEY)
      return { success: false, message: 'Gist not found. It may have been deleted. Please upload again.' }
    }
    if (msg.includes('401')) {
      return { success: false, message: 'Token is invalid or expired. Please re-enter your token.' }
    }
    return { success: false, message: `Download failed: ${msg}` }
  }
}

// ── Auto-sync hook integration ──

// localStorage flag to prevent re-download immediately after upload
const LAST_UPLOAD_KEY = 'sm-quiz-last-upload'
const AUTO_SYNC_DEBOUNCE_MS = 15_000 // 15 seconds after last state change

function getLastUploadTime(): number {
  try {
    return parseInt(localStorage.getItem(LAST_UPLOAD_KEY) || '0', 10)
  } catch {
    return 0
  }
}

function setLastUploadTime(): void {
  localStorage.setItem(LAST_UPLOAD_KEY, String(Date.now()))
}

/**
 * Auto-download on first load if token is configured.
 * Works on new devices too — downloadProgress() auto-discovers the gistId.
 */
export async function autoDownload(): Promise<{ merged: boolean; remoteState?: AppUserState; message?: string }> {
  const token = getToken()
  if (!token) return { merged: false }

  try {
    const result = await downloadProgress()
    const remoteState = (result as unknown as { remoteState?: AppUserState }).remoteState
    if (result.success && remoteState) {
      saveLastSyncedAt(result.lastSyncedAt || new Date().toISOString())
      return { merged: true, remoteState, message: result.message }
    }
    return { merged: false, message: result.message }
  } catch {
    return { merged: false }
  }
}

/**
 * Auto-upload progress. Call this debounced after state changes.
 * Skips if we already uploaded recently.
 */
export async function autoUpload(state: AppUserState): Promise<boolean> {
  const token = getToken()
  if (!token) return false

  // Skip if uploaded within debounce window
  if (Date.now() - getLastUploadTime() < AUTO_SYNC_DEBOUNCE_MS) return false

  try {
    const result = await uploadProgress(state)
    if (result.success) {
      setLastUploadTime()
      return true
    }
    return false
  } catch {
    return false
  }
}

// Re-export the merge function for use in state.tsx
export { mergeStates }
