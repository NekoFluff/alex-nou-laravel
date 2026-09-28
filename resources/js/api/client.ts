/**
 * WaniKani API v2 client.
 *
 * Two transport modes:
 *
 * - `direct` (default) — the browser calls api.wanikani.com itself. WaniKani sends
 *   `access-control-allow-origin: *`, so this works, and the token never leaves the
 *   machine it was typed on. This is what makes the app deployable as static files.
 * - `proxy` — same-origin requests to `/api/wanikani`, forwarded by the Vite dev
 *   server. Useful if a browser extension or a future CORS change gets in the way.
 *
 * Rate limiting is handled defensively: the API exposes `RateLimit-Remaining` and
 * `RateLimit-Reset`, and requests are throttled down as the budget is consumed.
 */

import {
  unwrapRecord,
  unwrapRecords,
  type ApiPage,
  type ApiResource,
  type ApiStaticResource,
  type ResponseMeta,
} from './envelope'
import type {
  Assignment,
  LevelProgression,
  Reset,
  ReviewStatistic,
  SpacedRepetitionSystem,
  Subject,
  Summary,
  User,
} from './types'

const API_HOST = 'https://api.wanikani.com/v2'
const PROXY_BASE = '/api/wanikani'
export const API_REVISION = '20170710'

export type TransportMode = 'direct' | 'proxy'

export class WaniKaniError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'WaniKaniError'
  }

  /** 401 means the token is wrong or revoked; 403 means it lacks the needed scope. */
  get isAuthFailure(): boolean {
    return this.status === 401 || this.status === 403
  }
}

export interface RequestOptions {
  signal?: AbortSignal
  transport?: TransportMode
  /** Called after each page so the UI can show real progress. */
  onProgress?: (loaded: number, total: number) => void
  /** Soft page cap, a safety valve against a runaway loop. */
  maxPages?: number
  /**
   * An `ETag` from a previous fetch of the same scope. Sent as `If-None-Match`; when
   * nothing changed the API answers `304 Not Modified` with an empty body, and the
   * caller reuses what it already has.
   */
  etag?: string | null
}

/**
 * Result of a fetch that may be answered from the caller's cache.
 *
 * `unmodified` is the win: zero bytes transferred, and the caller keeps its data.
 */
export type FetchOutcome<T> =
  | { status: 'modified'; data: T; meta: ResponseMeta }
  | { status: 'unmodified'; meta: ResponseMeta }
  | { status: 'missing'; meta: ResponseMeta }

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

/**
 * Turns a `RateLimit-Reset` header into seconds from now, or null when it is absent.
 *
 * The header is documented as a reset *time* and is observed as epoch seconds — but a
 * duration is also plausible if an intermediary rewrites it, so anything small enough
 * to be a window length is treated as one. Misreading epoch seconds as a duration would
 * mean sleeping for decades.
 *
 * Returns null rather than a default because the caller must distinguish "no budget
 * information" from "a minute left"; conflating them stalls a whole load.
 */
export function resetHeaderToSeconds(value: string | null, nowMs = Date.now()): number | null {
  if (value === null || value.trim() === '') {
    return null
  }
  const reset = Number(value)
  if (!Number.isFinite(reset) || reset <= 0) {
    return null
  }
  if (reset > 1_000_000_000) {
    return Math.max(0, reset - nowMs / 1000)
  }
  return Math.min(reset, 3600)
}

/** Tracks the rate-limit budget shared by every request in a load. */
class RateLimiter {
  private remaining = Number.POSITIVE_INFINITY
  private resetSeconds = 60

  observe(headers: Headers): void {
    /*
     * Guard on the raw header, never on `Number(...)`.
     *
     * `Number(null)` is 0, not NaN, so `Number.isFinite(Number(headers.get(x)))` is TRUE
     * for an absent header — which silently meant "zero requests remaining" and made
     * every subsequent page sleep 5s. Only real numbers may move the budget.
     */
    const remainingHeader = headers.get('RateLimit-Remaining')
    if (remainingHeader !== null && remainingHeader.trim() !== '') {
      const remaining = Number(remainingHeader)
      if (Number.isFinite(remaining)) {
        this.remaining = remaining
      }
    }

    const reset = resetHeaderToSeconds(headers.get('RateLimit-Reset'))
    if (reset !== null) {
      this.resetSeconds = reset
    }
  }

  /** Spread the remaining budget across the remaining window. */
  async wait(signal?: AbortSignal): Promise<void> {
    if (this.remaining > 10) {
      return
    }
    const window = Math.min(this.resetSeconds, 60)
    const share = window / Math.max(this.remaining, 1)
    // Cap the pause so a tiny budget does not stall the load for a full minute.
    await sleep(Math.min(share * 1000, 5000), signal)
  }
}

function buildUrl(path: string, params: Record<string, string | number | undefined>, transport: TransportMode): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value))
    }
  }
  const suffix = query.toString() ? `?${query}` : ''
  return transport === 'proxy' ? `${PROXY_BASE}/${path}${suffix}` : `${API_HOST}/${path}${suffix}`
}

interface RawResponse<T> {
  status: number
  body: T | null
  meta: ResponseMeta
}

function readMeta(headers: Headers): ResponseMeta {
  // The weak-validator prefix (`W/"..."`) is part of the value and must be echoed back
  // verbatim, so the header is taken as-is rather than trimmed to the quoted part.
  return {
    etag: headers.get('ETag'),
    dataUpdatedAt: headers.get('Last-Modified'),
  }
}

async function requestJson<T>(
  url: string,
  token: string,
  options: RequestOptions & { limiter?: RateLimiter },
): Promise<RawResponse<T>> {
  const limiter = options.limiter ?? new RateLimiter()
  let attempt = 0

  for (;;) {
    await limiter.wait(options.signal)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Wanikani-Revision': API_REVISION,
    }
    if (options.etag) {
      headers['If-None-Match'] = options.etag
    }

    const response = await fetch(url, { headers, signal: options.signal })

    limiter.observe(response.headers)

    if (response.status === 304) {
      return { status: 304, body: null, meta: readMeta(response.headers) }
    }

    if (response.status === 429) {
      // A 429 without a reset header still means "back off"; 60s is the documented window.
      const waitSeconds = resetHeaderToSeconds(response.headers.get('RateLimit-Reset')) ?? 60
      attempt += 1
      if (attempt > 3) {
        throw new WaniKaniError('Rate limited by WaniKani. Try again in a minute.', 429)
      }
      await sleep(Math.min(waitSeconds + 1, 65) * 1000, options.signal)
      continue
    }

    if (!response.ok) {
      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = undefined
      }
      const detail =
        typeof body === 'object' && body !== null && 'error' in body
          ? String((body as { error: unknown }).error)
          : response.statusText
      throw new WaniKaniError(detail || `Request failed with ${response.status}`, response.status, body)
    }

    return { status: response.status, body: (await response.json()) as T, meta: readMeta(response.headers) }
  }
}

/**
 * Fetches a single-resource endpoint.
 *
 * Small resources (the user, the summary) are cheap enough that conditional handling is
 * not worth the complexity here — they are always read fresh, in one request.
 */
export async function fetchResource<T>(path: string, token: string, options: RequestOptions = {}): Promise<T> {
  const transport = options.transport ?? 'direct'
  const body = await requestJson<ApiResource<T>>(buildUrl(path, {}, transport), token, options)
  if (body.status === 304 || body.body === null) {
    throw new WaniKaniError('Unexpected empty response', body.status)
  }
  return body.body.data
}

/**
 * Fetches every page of a collection endpoint.
 *
 * Progress is reported per page so a first load of ~19,000 records can show an
 * honest progress bar instead of an indefinite spinner.
 */
export async function fetchCollection<T extends object>(
  path: string,
  token: string,
  params: Record<string, string | number | undefined> = {},
  options: RequestOptions = {},
): Promise<FetchOutcome<T[]>> {
  const transport = options.transport ?? 'direct'
  const limiter = new RateLimiter()
  const records: T[] = []
  const maxPages = options.maxPages ?? 200

  // Note: WaniKani has no `per_page` request parameter — it is silently ignored, and
  // /subjects always returns 1000 records per page. Page size is the server's choice.
  let url: string | null = buildUrl(path, params, transport)
  let page = 0
  let total = 0
  let meta: ResponseMeta = { etag: null, dataUpdatedAt: null }
  // Every page of a collection shares one ETag, so it only gates the first request. A
  // 304 there means the whole cached collection is still current.
  const firstPageEtag: string | null = options.etag ?? null

  while (url) {
    if (page >= maxPages) {
      break
    }

    const response: RawResponse<ApiPage<unknown>> = await requestJson<ApiPage<unknown>>(url, token, {
      ...options,
      etag: page === 0 ? firstPageEtag : null,
      limiter,
    })

    meta = response.meta

    if (response.status === 304) {
      return { status: 'unmodified', meta }
    }
    if (response.body === null) {
      return { status: 'missing', meta }
    }

    records.push(...unwrapRecords<T>(response.body.data))
    total = response.body.total_count
    page += 1

    options.onProgress?.(records.length, total ?? records.length)
    url = response.body.pages.next_url
  }

  return { status: 'modified', data: records, meta }
}

// ---------------------------------------------------------------- endpoints

export function fetchUser(token: string, options: RequestOptions = {}): Promise<User> {
  return fetchResource<User>('user', token, options)
}

export function fetchSummary(token: string, options: RequestOptions = {}): Promise<Summary> {
  return fetchResource<Summary>('summary', token, options)
}

export function fetchAssignments(token: string, options: RequestOptions = {}): Promise<FetchOutcome<Assignment[]>> {
  return fetchCollection<Assignment>('assignments', token, {}, options)
}

export function fetchReviewStatistics(
  token: string,
  options: RequestOptions = {},
): Promise<FetchOutcome<ReviewStatistic[]>> {
  return fetchCollection<ReviewStatistic>('review_statistics', token, {}, options)
}

export function fetchLevelProgressions(
  token: string,
  options: RequestOptions = {},
): Promise<FetchOutcome<LevelProgression[]>> {
  return fetchCollection<LevelProgression>('level_progressions', token, {}, options)
}

/**
 * Fetches the whole subject catalog, including levels the user has not reached.
 *
 * The catalog is what makes an exact "time remaining" possible: assignments only
 * cover unlocked items, so without it the unlearned levels would have to be guessed.
 */
export function fetchSubjects(token: string, options: RequestOptions = {}): Promise<FetchOutcome<Subject[]>> {
  return fetchCollection<Subject>('subjects', token, {}, options)
}

/**
 * Progress resets. A level reset is the only thing that can make level history look
 * non-monotonic, so the dashboard surfaces these rather than hiding the anomaly.
 */
export function fetchResets(token: string, options: RequestOptions = {}): Promise<FetchOutcome<Reset[]>> {
  return fetchCollection<Reset>('resets', token, {}, options)
}

/**
 * A single-request count for a filtered scope.
 *
 * Every collection endpoint reports `total_count` for the whole filtered scope rather
 * than the current page, which makes cheap counters possible without downloading
 * anything — e.g. `countAssignments({ srs_stages: 9 })` for burned items.
 */
export async function countCollection(
  path: string,
  token: string,
  params: Record<string, string | number | undefined> = {},
  options: RequestOptions = {},
): Promise<number> {
  const body = await requestJson<ApiPage<unknown>>(
    buildUrl(path, params, options.transport ?? 'direct'),
    token,
    options,
  )
  return body.body?.total_count ?? 0
}

export async function fetchSpacedRepetitionSystems(
  token: string,
  options: RequestOptions = {},
): Promise<SpacedRepetitionSystem[]> {
  const body = await requestJson<ApiStaticResource<SpacedRepetitionSystem[]>>(
    buildUrl('spaced_repetition_systems', {}, options.transport ?? 'direct'),
    token,
    options,
  )
  return (body.body?.data ?? []).map((record) => unwrapRecord<SpacedRepetitionSystem>(record))
}

/** The default WaniKani SRS, which is what nearly every account uses. */
export function pickDefaultSrs(systems: SpacedRepetitionSystem[]): SpacedRepetitionSystem | null {
  return systems.find((system) => system.id === 1) ?? systems[0] ?? null
}
