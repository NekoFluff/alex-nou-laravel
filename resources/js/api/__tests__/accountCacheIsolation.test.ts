/**
 * Cache isolation between accounts.
 *
 * Regression suite for a reported bug: clearing your token (falling back to the site's
 * baked-in one) left the dashboard showing the *other* account's numbers.
 *
 * The progress cache was keyed by the constant string `'me'`, so every account shared one
 * snapshot of assignments, review statistics and level history. Whichever account loaded
 * first populated it, and anyone switching accounts was served that data straight from
 * cache — with no error, because nothing failed. Pressing Refresh passed `force`, which
 * bypassed the cache, which is why that appeared to fix it.
 *
 * The key is now the account id, resolved from `/user` before any cache lookup.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadDataset } from '@/api/loader'

const TOKEN_A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'
const TOKEN_B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'
const ETAG = 'W/"catalogue"'

const resource = (data: unknown) =>
    new Response(JSON.stringify({ object: 'resource', url: 'u', data }), {
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
    })

const collection = (url: string, data: unknown[], etag?: string) =>
    new Response(
        JSON.stringify({
            object: 'collection',
            url,
            pages: { per_page: 1000, next_url: null, previous_url: null },
            total_count: data.length,
            data_updated_at: 'z',
            data,
        }),
        { status: 200, headers: new Headers(etag ? { ETag: etag } : {}) },
    )

/** Serves account A or B based on the bearer token, with a detectable difference. */
function stubAccounts() {
    const seen: Array<{ url: string; account: string }> = []

    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        const auth = ((init?.headers ?? {}) as Record<string, string>).Authorization ?? ''
        const isB = auth.includes(TOKEN_B)
        seen.push({ url, account: isB ? 'B' : 'A' })

        if (url.includes('/user')) {
            return Promise.resolve(
                resource({
                    id: isB ? 'account-b' : 'account-a',
                    username: isB ? 'B' : 'A',
                    level: 1,
                    profile_url: 'p',
                    started_at: '2026-01-01T00:00:00.000Z',
                    subscription: {
                        active: true,
                        type: 'lifetime',
                        max_level_granted: 60,
                        period_ends_at: null,
                    },
                    current_vacation_started_at: null,
                }),
            )
        }
        if (url.includes('/assignments')) {
            // Account B has one assignment, account A has three.
            return Promise.resolve(collection(url, isB ? [1] : [1, 2, 3]))
        }
        if (url.includes('/subjects')) {
            return Promise.resolve(
                collection(
                    url,
                    [
                        {
                            id: 1,
                            object: 'radical',
                            url: 'u',
                            data_updated_at: 'z',
                            data: {
                                id: 1,
                                level: 1,
                                slug: 'a',
                                characters: '一',
                                meanings: [],
                                hidden_at: null,
                            },
                        },
                    ],
                    ETAG,
                ),
            )
        }
        if (url.includes('/spaced_repetition_systems')) return Promise.resolve(collection(url, []))
        if (url.includes('/summary')) {
            return Promise.resolve(resource({ lessons: [], reviews: [], next_reviews_at: null }))
        }
        return Promise.resolve(collection(url, []))
    })

    return seen
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('progress cache isolation', () => {
    it('does not serve one account the other cached progress', async () => {
        // Load account A first, which populates the cache.
        stubAccounts()
        const a = await loadDataset(TOKEN_A)
        expect(a.user.id).toBe('account-a')
        expect(a.assignments).toHaveLength(3)

        // Load account B *without* forcing. The cache entry is fresh, so a shared key would
        // hand back A's assignments and the dashboard would show the wrong person.
        stubAccounts()
        const b = await loadDataset(TOKEN_B)
        expect(b.user.id).toBe('account-b')
        expect(b.assignments).toHaveLength(1)

        // And switching back reads A's own data, not B's.
        stubAccounts()
        const aAgain = await loadDataset(TOKEN_A)
        expect(aAgain.user.id).toBe('account-a')
        expect(aAgain.assignments).toHaveLength(3)
    })

    it('still serves a repeat load of the same account from its own cache', async () => {
        // The fix must not be "never cache": the same account returning within the TTL
        // should not re-fetch progress at all.
        stubAccounts()
        const first = await loadDataset(TOKEN_A)

        const seen = stubAccounts()
        const second = await loadDataset(TOKEN_A)

        expect(seen.filter((call) => call.url.includes('/assignments'))).toHaveLength(0)
        expect(second.user.id).toBe(first.user.id)
        expect(second.assignments).toHaveLength(3)
    })
})
