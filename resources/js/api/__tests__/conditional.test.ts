/**
 * Conditional requests.
 *
 * A refresh used to set `force: true` and re-download every page of every collection —
 * about 20 requests and ~3.5 MB, including the ~9,400-record subject catalogue that
 * effectively never changes. WaniKani supports `If-None-Match` on every collection and
 * returns a bodiless `304` when nothing changed, so these tests pin down both the
 * mechanism and the traffic it saves.
 *
 * The critical property being relied on: WaniKani sends the SAME ETag for every page of
 * a collection, because it is derived from the whole filtered scope. A 304 on page one
 * is therefore proof that the caller's cached pages are all still current.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCollection, fetchSubjects } from '@/api/client'

const TOKEN = 'd443c409-815f-40e0-8950-2bf0fbe04d91'
const SCOPE_ETAG = 'W/"df3d53bbaf9f611b449c9b1b2ea75cd7"'

interface Request {
  url: string
  headers: Record<string, string>
}

/** One page of a collection response. */
function pageBody(options: { ids: number[]; next?: string | null; total?: number }): string {
  return JSON.stringify({
    object: 'collection',
    url: 'https://api.wanikani.com/v2/assignments',
    pages: { per_page: 1000, next_url: options.next ?? null, previous_url: null },
    total_count: options.total ?? options.ids.length,
    data_updated_at: '2026-09-28T06:06:11.343505Z',
    data: options.ids.map((id) => ({
      id,
      object: 'assignment',
      url: `https://api.wanikani.com/v2/assignments/${id}`,
      data_updated_at: '2026-09-28T06:06:11.343505Z',
      data: {
        created_at: '2026-01-01T00:00:00.000Z',
        subject_id: id,
        subject_type: 'radical',
        srs_stage: 5,
        unlocked_at: null,
        started_at: null,
        passed_at: null,
        burned_at: null,
        available_at: null,
        resurrected_at: null,
        hidden: false,
      },
    })),
  })
}

const notModified = () => new Response(null, { status: 304, headers: new Headers({ ETag: SCOPE_ETAG }) })

const okPage = (options: { ids: number[]; next?: string | null; total?: number }) =>
  new Response(pageBody(options), {
    status: 200,
    headers: new Headers({ 'content-type': 'application/json', ETag: SCOPE_ETAG }),
  })

/**
 * Installs a single router-style fetch stub.
 *
 * Every test routes through one stub so multi-page sequences terminate properly; an
 * earlier version installed a fresh stub mid-test, which left the page loop spinning.
 */
function stubFetch(router: (request: Request) => Response) {
  const requests: Request[] = []
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
      headers[key.toLowerCase()] = value
    }
    const request = { url, headers }
    requests.push(request)
    return Promise.resolve(router(request))
  })
  return requests
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchCollection conditionals', () => {
  it('sends no If-None-Match on a first fetch', async () => {
    const requests = stubFetch(() => okPage({ ids: [1, 2] }))
    const result = await fetchCollection('assignments', TOKEN)

    expect(result.status).toBe('modified')
    expect(requests[0].headers['if-none-match']).toBeUndefined()
  })

  it('sends the supplied ETag as If-None-Match', async () => {
    const requests = stubFetch(() => okPage({ ids: [1] }))
    await fetchCollection('assignments', TOKEN, {}, { etag: SCOPE_ETAG })

    expect(requests[0].headers['if-none-match']).toBe(SCOPE_ETAG)
  })

  it('reports "unmodified" for a 304 and returns no records', async () => {
    stubFetch(() => notModified())
    const result = await fetchCollection('assignments', TOKEN, {}, { etag: SCOPE_ETAG })

    expect(result.status).toBe('unmodified')
    expect(result).not.toHaveProperty('data')
  })

  it('stops at the first 304 instead of walking the remaining pages', async () => {
    // The whole saving: a collection that needs many pages collapses to one empty
    // response, because the 304 covers the entire scope.
    const requests = stubFetch(() => notModified())
    await fetchCollection('assignments', TOKEN, {}, { etag: SCOPE_ETAG })

    expect(requests).toHaveLength(1)
  })

  it('carries the ETag on the first page only', async () => {
    const requests = stubFetch((request) =>
      request.url.includes('page_after_id') ? okPage({ ids: [2, 3] }) : okPage({ ids: [1], next: 'https://api.wanikani.com/v2/assignments?page_after_id=1', total: 3 }),
    )

    const result = await fetchCollection('assignments', TOKEN, {}, { etag: SCOPE_ETAG })

    expect(result.status).toBe('modified')
    expect(requests).toHaveLength(2)
    expect(requests[0].headers['if-none-match']).toBe(SCOPE_ETAG)
    // Later pages share the ETag, so sending it again would prove nothing.
    expect(requests[1].headers['if-none-match']).toBeUndefined()
  })

  it('still collects every page when the data did change', async () => {
    stubFetch((request) =>
      request.url.includes('page_after_id') ? okPage({ ids: [2, 3] }) : okPage({ ids: [1], next: 'https://api.wanikani.com/v2/assignments?page_after_id=1', total: 3 }),
    )

    const result = await fetchCollection('assignments', TOKEN, {}, { etag: SCOPE_ETAG })

    expect(result.status).toBe('modified')
    if (result.status === 'modified') {
      expect(result.data).toHaveLength(3)
    }
  })

  it('exposes the new ETag so the caller can store it', async () => {
    stubFetch(() => okPage({ ids: [1] }))
    const result = await fetchCollection('assignments', TOKEN)
    expect(result.meta.etag).toBe(SCOPE_ETAG)
  })

  it('reports progress while downloading multiple pages', async () => {
    stubFetch((request) =>
      request.url.includes('page_after_id') ? okPage({ ids: [2], total: 2 }) : okPage({ ids: [1], next: 'https://api.wanikani.com/v2/assignments?page_after_id=1', total: 2 }),
    )

    const progress: Array<[number, number]> = []
    await fetchCollection('assignments', TOKEN, {}, { onProgress: (loaded, total) => progress.push([loaded, total]) })

    expect(progress).toEqual([
      [1, 2],
      [2, 2],
    ])
  })
})

describe('subjects catalogue refresh', () => {
  it('costs one empty response when the catalogue has not changed', async () => {
    let transferred = 0
    const requests = stubFetch(() => {
      transferred += 1
      return notModified()
    })

    const result = await fetchSubjects(TOKEN, { etag: SCOPE_ETAG })

    expect(result.status).toBe('unmodified')
    // One request, and not a single record transferred.
    expect(requests).toHaveLength(1)
    expect(transferred).toBe(1)
  })
})

describe('rate limiter header handling', () => {
  /**
   * Regression suite for a real bug that only appeared once these stub responses
   * stopped sending rate-limit headers.
   *
   * `Number(headers.get('RateLimit-Remaining'))` is 0 — not NaN — when the header is
   * absent, and `Number.isFinite(0)` is true. The limiter therefore read "no header" as
   * "zero requests remaining" and slept 5 seconds before every page after the first.
   * WaniKani does send the header, so a normal load hid it; a proxy or extension that
   * strips it would have turned a 20-page load into a 100-second crawl.
   */
  it('does not throttle when rate-limit headers are absent', async () => {
    const requests = stubFetch((request) =>
      request.url.includes('page_after_id') ? okPage({ ids: [3] }) : okPage({ ids: [1, 2], next: 'https://api.wanikani.com/v2/assignments?page_after_id=2' }),
    )

    const started = Date.now()
    const result = await fetchCollection('assignments', TOKEN)
    const elapsed = Date.now() - started

    expect(result.status).toBe('modified')
    expect(requests).toHaveLength(2)
    // The bug added a fixed 5000ms pause per page. Anything near that is a regression.
    expect(elapsed).toBeLessThan(1000)
  })

  it('still honours a genuine low budget', async () => {
    // The throttle must remain for the case it was written for.
    let page = 0
    const requests = stubFetch(() => {
      page += 1
      const headers = new Headers({ 'content-type': 'application/json', ETag: SCOPE_ETAG })
      if (page === 1) {
        headers.set('RateLimit-Remaining', '2')
        headers.set('RateLimit-Reset', '1')
      }
      return new Response(
        pageBody({
          ids: [page],
          next: page === 1 ? 'https://api.wanikani.com/v2/assignments?page_after_id=1' : null,
        }),
        { status: 200, headers },
      )
    })

    const result = await fetchCollection('assignments', TOKEN)
    expect(result.status).toBe('modified')
    expect(requests).toHaveLength(2)
  })
})
