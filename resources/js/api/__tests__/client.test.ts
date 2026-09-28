import { describe, expect, it } from 'vitest'
import { resetHeaderToSeconds, WaniKaniError } from '@/api/client'
import { looksLikeToken } from '@/utils/wanikaniToken'

describe('resetHeaderToSeconds', () => {
  const now = 1_790_575_070_000

  it('treats a large value as epoch seconds', () => {
    // WaniKani sends `RateLimit-Reset` as epoch seconds. Reading it as a duration
    // would schedule a sleep of roughly 56 years.
    expect(resetHeaderToSeconds(String(now / 1000 + 42), now)).toBe(42)
  })

  it('never returns a negative wait for an already-past reset', () => {
    expect(resetHeaderToSeconds(String(now / 1000 - 10), now)).toBe(0)
  })

  it('treats a small value as a window length', () => {
    expect(resetHeaderToSeconds('60', now)).toBe(60)
    expect(resetHeaderToSeconds('30', now)).toBe(30)
  })

  it('reports an absent header as null rather than inventing a window', () => {
    // Distinguishing "no information" from "a minute left" matters: a caller that
    // conflates them will throttle a load that had no reason to be throttled.
    expect(resetHeaderToSeconds(null, now)).toBeNull()
    expect(resetHeaderToSeconds('', now)).toBeNull()
    expect(resetHeaderToSeconds('   ', now)).toBeNull()
    expect(resetHeaderToSeconds('not-a-number', now)).toBeNull()
    expect(resetHeaderToSeconds('0', now)).toBeNull()
    expect(resetHeaderToSeconds('-5', now)).toBeNull()
  })
})

describe('WaniKaniError', () => {
  it('classifies 401 and 403 as auth failures', () => {
    expect(new WaniKaniError('nope', 401).isAuthFailure).toBe(true)
    expect(new WaniKaniError('nope', 403).isAuthFailure).toBe(true)
  })

  it('does not treat a rate limit or a server error as an auth failure', () => {
    expect(new WaniKaniError('slow down', 429).isAuthFailure).toBe(false)
    expect(new WaniKaniError('boom', 500).isAuthFailure).toBe(false)
  })
})

describe('looksLikeToken', () => {
  it('accepts a UUID-shaped token', () => {
    expect(looksLikeToken('d443c409-815f-40e0-8950-2bf0fbe04d91')).toBe(true)
    expect(looksLikeToken('  d443c409-815f-40e0-8950-2bf0fbe04d91  ')).toBe(true)
    expect(looksLikeToken('D443C409-815F-40E0-8950-2BF0FBE04D91')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(looksLikeToken('')).toBe(false)
    expect(looksLikeToken('hunter2')).toBe(false)
    expect(looksLikeToken('d443c409815f40e089502bf0fbe04d91')).toBe(false)
  })
})
