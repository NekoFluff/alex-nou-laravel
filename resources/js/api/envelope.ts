/**
 * Helpers for the WaniKani collection envelope.
 *
 * Every collection endpoint returns a page of records shaped like:
 *
 * ```json
 * {
 *   "id": 1,
 *   "object": "radical",
 *   "url": "https://api.wanikani.com/v2/subjects/1",
 *   "data_updated_at": "2026-09-14T03:23:59.161863Z",
 *   "data": { "level": 1, "slug": "ground", ... }
 * }
 * ```
 *
 * The trap: the record `id` and `object` live on the envelope, while the payload is
 * nested under `data` — and some payloads (notably assignments, whose payload has
 * its own `subject_type`) look envelope-ish from the outside. Anything that keys a
 * map on `subject.id` must therefore read it from the envelope, not the payload.
 */

/** One item of a collection page, before unwrapping. */
export interface ApiRecord<T> {
  id: number
  object: string
  url: string
  data_updated_at: string
  data: T
}

/** The shared envelope of a paged collection response. */
export interface ApiPage<T> {
  object: string
  url: string
  pages: {
    per_page: number
    next_url: string | null
    previous_url: string | null
  }
  total_count: number
  data_updated_at: string
  data: Array<ApiRecord<T>>
}

/** The envelope of a single-resource response. */
export interface ApiResource<T> {
  object: string
  url: string
  data_updated_at: string
  data: T
}

/**
 * HTTP response headers the client cares about.
 *
 * `ETag` is the important one: WaniKani returns the SAME ETag for every page of a
 * collection, because it is derived from the whole filtered scope's `data_updated_at`.
 * That makes a `304 Not Modified` on page one proof that every cached page is still
 * current — which is what lets a refresh skip re-downloading ~20 pages.
 */
export interface ResponseMeta {
  etag: string | null
  dataUpdatedAt: string | null
}

/** The envelope of a single-resource response without a modification timestamp. */
export interface ApiStaticResource<T> {
  object: string
  url: string
  data: T
}

/**
 * True when `value` is a collection item envelope rather than a bare payload.
 *
 * Deliberately strict: `subjects` payloads contain a `data` key of their own, so a
 * loose `'data' in record` check would silently unwrap the wrong level.
 */
export function isApiRecord(value: unknown): value is ApiRecord<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'number' &&
    typeof record.object === 'string' &&
    typeof record.url === 'string' &&
    'data_updated_at' in record &&
    'data' in record
  )
}

/**
 * Unwraps one collection item, carrying envelope-only fields down onto the payload.
 *
 * `id`, `object` and `data_updated_at` live on the envelope rather than the payload,
 * and callers genuinely need all three: `id` to key lookup maps, `object` to know
 * whether a subject is a radical/kanji/vocabulary, and `data_updated_at` as the only
 * available proxy for when an item was last answered. Without them every record
 * would key on `undefined` and lose its type.
 */
export function unwrapRecord<T extends object>(value: unknown): T {
  if (!isApiRecord(value)) {
    return value as T
  }

  const payload = { ...(value.data as Record<string, unknown>) }

  if (typeof payload.id !== 'number') {
    payload.id = value.id
  }
  if (typeof payload.object !== 'string') {
    payload.object = value.object
  }
  if (typeof payload.data_updated_at !== 'string') {
    payload.data_updated_at = value.data_updated_at
  }

  return payload as T
}

/** Unwraps a whole page of collection items. */
export function unwrapRecords<T extends object>(values: unknown[]): T[] {
  return values.map((value) => unwrapRecord<T>(value))
}
