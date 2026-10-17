/**
 * Catalogue revalidation across loads.
 *
 * This is the behaviour the cache layer exists for, and it went untested until a report
 * that refreshing the page always re-downloaded the subject catalogue. The cause was
 * that happy-dom has no IndexedDB, so `readCache` always returned null and every test
 * silently ran as a cold load. `resources/js/test/setup.ts` now polyfills it, which makes
 * the sequence below expressible.
 *
 * The catalogue is by far the most expensive thing to fetch — 10 pages, ~19.5 MB — and it
 * changes only when WaniKani adds content. A page refresh inside the TTL should cost no
 * request at all, and a forced refresh only the subjects updated since the last fetch.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { loadDataset } from '@/api/loader'

const TOKEN = 'd443c409-815f-40e0-8950-2bf0fbe04d91'
const ETAG = 'W/"5d8bf67041526f7d68a45ef4a1cc6df6"'

interface Seen {
    url: string
    ifNoneMatch?: string
}

function collectionPage(url: string, ids: number[], next: string | null = null) {
    return new Response(
        JSON.stringify({
            object: 'collection',
            url,
            pages: { per_page: 1000, next_url: next, previous_url: null },
            total_count: ids.length,
            data_updated_at: '2026-09-28T06:06:11.343505Z',
            data: ids.map((id) => ({
                id,
                object: 'assignment',
                url: `${url}/${id}`,
                data_updated_at: '2026-09-28T06:06:11.343505Z',
                data: { id, level: 1, slug: `s${id}`, characters: '一', meanings: [], hidden_at: null },
            })),
        }),
        { status: 200, headers: new Headers({ 'content-type': 'application/json', ETag: ETAG }) },
    )
}

function resource(payload: unknown) {
    return new Response(JSON.stringify({ object: 'resource', url: 'x', data: payload }), {
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
    })
}

/** Answers every non-subject endpoint with the smallest payload that satisfies the loader. */
function route(request: Seen): Response {
    const { url, ifNoneMatch } = request

    if (url.includes('/subjects')) {
        if (ifNoneMatch === ETAG) {
            return new Response(null, { status: 304 })
        }
        // An incremental fetch returns only the subjects changed since then: here, one.
        return collectionPage(url, url.includes('updated_after') ? [2] : [1, 2, 3])
    }
    if (url.includes('/assignments') || url.includes('/review_statistics') || url.includes('/level_progressions') || url.includes('/resets')) {
        return collectionPage(url, [])
    }
    if (url.includes('/spaced_repetition_systems')) {
        return resource([
            {
                id: 1,
                name: 'Default system for dictionary subjects',
                description: '',
                unlocking_stage_position: 0,
                starting_stage_position: 1,
                passing_stage_position: 5,
                burning_stage_position: 9,
                stages: Array.from({ length: 10 }, (_, position) => ({
                    position,
                    interval: position === 0 || position === 9 ? null : 14_400,
                    interval_unit: 'seconds',
                })),
            },
        ])
    }
    if (url.includes('/summary')) {
        return resource({ lessons: [], reviews: [], next_reviews_at: null })
    }
    if (url.includes('/user')) {
        return resource({
            id: 'u',
            username: 'TestUser',
            level: 1,
            profile_url: 'p',
            started_at: '2026-01-01T00:00:00.000Z',
            subscription: { active: true, type: 'lifetime', max_level_granted: 60, period_ends_at: null },
            current_vacation_started_at: null,
        })
    }
    return resource({})
}

function stubFetch() {
    const seen: Seen[] = []
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        const headers = (init?.headers ?? {}) as Record<string, string>
        const request: Seen = { url, ifNoneMatch: headers['If-None-Match'] }
        seen.push(request)
        return Promise.resolve(route(request))
    })
    return seen
}

const subjectsRequests = (seen: Seen[]) => seen.filter((request) => request.url.includes('/subjects'))

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('catalogue revalidation', () => {
    it('downloads the catalogue on a cold load', async () => {
        const seen = stubFetch()
        const dataset = await loadDataset(TOKEN)

        expect(dataset.subjects).toHaveLength(3)
        expect(subjectsRequests(seen)).toHaveLength(1)
        expect(subjectsRequests(seen)[0].ifNoneMatch).toBeUndefined()
        expect(subjectsRequests(seen)[0].url).not.toContain('updated_after')
    })

    it('makes no catalogue request on the next load while the cache is fresh', async () => {
        // First load populates the cache.
        stubFetch()
        await loadDataset(TOKEN)

        // Second load is the page refresh: this is the case that was reported broken.
        const seen = stubFetch()
        const steps: string[] = []
        const dataset = await loadDataset(TOKEN, {
            onProgress: (progress) => {
                const catalog = progress.downloads?.find((step) => step.key === 'catalog')
                if (catalog) {
                    steps.push(`${catalog.status}:${catalog.cached ? 'cached' : 'net'}`)
                }
            },
        })

        expect(subjectsRequests(seen), 'a fresh catalogue must not be re-requested').toHaveLength(0)
        // With everything cached no download rows are shown; if any were, the catalog
        // must read as already up to date rather than downloading.
        expect(steps.every((step) => step === 'done:cached')).toBe(true)
        // And the cached subjects still came through, rather than an empty catalogue.
        expect(dataset.subjects).toHaveLength(3)
    })

    it('asks only for changed subjects on a forced refresh', async () => {
        stubFetch()
        await loadDataset(TOKEN)

        const seen = stubFetch()
        const dataset = await loadDataset(TOKEN, { force: true })

        const subjects = subjectsRequests(seen)
        expect(subjects).toHaveLength(1)
        // The browser cannot read the ETag header, so the body's timestamp drives this.
        expect(new URL(subjects[0].url).searchParams.get('updated_after')).toBe('2026-09-28T06:06:11.343505Z')
        expect(dataset.subjects).toHaveLength(3)
    })
})

describe('catalogue payload size', () => {
    it('stores only the fields the engine reads', async () => {
        const { slimSubjects } = await import('@/api/loader')
        const { loadFixture } = await import('@/domain/__tests__/fixture')
        const fixture = loadFixture()
        if (!fixture) {
            return
        }

        const full = fixture.subjects as unknown as Array<Record<string, unknown>>
        const slim = slimSubjects(full as never) as unknown as Array<Record<string, unknown>>

        const kept = new Set([
            'id',
            'object',
            'level',
            'slug',
            'characters',
            'hidden_at',
            'meanings',
            'character_images',
            'readings',
            // Carried so the leech table can link to the item's WaniKani page.
            'document_url',
        ])

        for (const subject of slim) {
            for (const key of Object.keys(subject)) {
                expect(kept.has(key), `unexpected cached field "${key}"`).toBe(true)
            }
        }

        // The point of the exercise: the mnemonics and context sentences were 84% of the
        // payload, and carrying them risked a quota failure that broke caching entirely.
        const before = JSON.stringify(full).length
        const after = JSON.stringify(slim).length
        expect(after).toBeLessThan(before * 0.35)
    }, 30_000)

    it('preserves the fields the engine needs to compute stats', async () => {
        const { slimSubjects } = await import('@/api/loader')
        const { loadFixture } = await import('@/domain/__tests__/fixture')
        const { computeStats, DEFAULT_SETTINGS } = await import('@/domain/stats')

        const fixture = loadFixture()
        if (!fixture) {
            return
        }

        const slimmed = { ...fixture, subjects: slimSubjects(fixture.subjects) }
        const fromFull = computeStats(fixture, DEFAULT_SETTINGS, new Date('2026-06-15T12:00:00.000Z'))
        const fromSlim = computeStats(slimmed, DEFAULT_SETTINGS, new Date('2026-06-15T12:00:00.000Z'))

        // Slimming must be invisible to every number on the dashboard.
        expect(fromSlim.counts).toEqual(fromFull.counts)
        expect(fromSlim.invested).toEqual(fromFull.invested)
        expect(fromSlim.workload).toEqual(fromFull.workload)
        expect(fromSlim.curriculumProgress).toBe(fromFull.curriculumProgress)
        expect(fromSlim.leeches.items).toEqual(fromFull.leeches.items)
        expect(fromSlim.currentLevel).toEqual(fromFull.currentLevel)
        expect(fromSlim.accuracy).toEqual(fromFull.accuracy)
    }, 30_000)
})

