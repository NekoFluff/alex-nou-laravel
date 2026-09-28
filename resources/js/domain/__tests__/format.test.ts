/**
 * Formatting tests.
 *
 * `formatHours` is the single place study time is turned into text, so its rounding
 * thresholds are worth pinning down: a wrong branch here misreports every time figure
 * on the dashboard at once.
 */
import { describe, expect, it } from 'vitest'
import { formatFreshness, formatHours, formatNumber, formatPercent, formatRelative, formatInterval, dayKey } from '@/domain/format'

const hours = (value: number) => value * 3_600_000

describe('formatHours', () => {
  it('keeps one decimal below 100 hours', () => {
    expect(formatHours(hours(0.5))).toBe('0.5h')
    expect(formatHours(hours(12.5))).toBe('12.5h')
    expect(formatHours(hours(99.94))).toBe('99.9h')
  })

  it('rounds to whole hours at 100 and above', () => {
    expect(formatHours(hours(100))).toBe('100h')
    expect(formatHours(hours(387.4))).toBe('387h')
    expect(formatHours(hours(1277.4))).toBe('1,277h')
  })

  it('groups thousands so a four-digit figure stays readable', () => {
    expect(formatHours(hours(4210))).toBe('4,210h')
    expect(formatHours(hours(12345))).toBe('12,345h')
  })

  it('rounds rather than truncates', () => {
    expect(formatHours(hours(387.6))).toBe('388h')
  })

  it('handles zero and tiny durations', () => {
    expect(formatHours(0)).toBe('0.0h')
    expect(formatHours(60_000)).toBe('0.0h')
  })

  it('degrades predictably rather than throwing on unusable input', () => {
    // NaN reaches the sub-100 branch and formats as "NaNh"; a non-finite total (from a
    // divide-by-zero somewhere upstream) rounds to the infinity glyph. Neither is
    // pretty, but neither crashes a render.
    expect(formatHours(Number.NaN)).toBe('NaNh')
    expect(formatHours(Number.POSITIVE_INFINITY)).toBe('∞h')
  })
})

describe('formatNumber', () => {
  it('groups thousands and rounds', () => {
    expect(formatNumber(5390)).toBe('5,390')
    expect(formatNumber(133842.7)).toBe('133,843')
  })
})

describe('formatPercent', () => {
  it('defaults to one decimal and honours a custom precision', () => {
    expect(formatPercent(90.8123)).toBe('90.8%')
    expect(formatPercent(90.8123, 0)).toBe('91%')
  })
})

describe('formatInterval', () => {
  it('picks the largest sensible unit', () => {
    expect(formatInterval(null)).toBe('no wait')
    expect(formatInterval(14_400)).toBe('4 hours')
    expect(formatInterval(86_400)).toBe('1 day')
    expect(formatInterval(7 * 86_400)).toBe('1 week')
    // WaniKani's Master interval is 30 days, which is the shortest that reads as a month.
    expect(formatInterval(30 * 86_400)).toBe('1 month')
  })

  it('pluralises correctly', () => {
    expect(formatInterval(3_600)).toBe('1 hour')
    expect(formatInterval(7_200)).toBe('2 hours')
  })

  it('falls back to seconds below a minute', () => {
    expect(formatInterval(45)).toBe('45 seconds')
  })
})

describe('formatRelative', () => {
  const now = new Date('2026-06-15T12:00:00.000Z')

  it('describes the future and the past', () => {
    expect(formatRelative(new Date('2026-06-15T14:00:00.000Z'), now)).toBe('in 2 hours')
    expect(formatRelative(new Date('2026-06-15T10:00:00.000Z'), now)).toBe('2 hours ago')
  })

  it('scales to days', () => {
    expect(formatRelative(new Date('2026-06-18T12:00:00.000Z'), now)).toBe('in 3 days')
  })

  it('handles a missing date', () => {
    expect(formatRelative(null, now)).toBe('—')
  })
})

describe('dayKey', () => {
  it('formats a local calendar day with zero padding', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dayKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('formatFreshness', () => {
    const now = new Date('2026-06-15T12:00:00.000Z')

    it('says "just now" for a load that has only just finished', () => {
        // A load completing seconds ago must not read as "0 minutes ago", which looks
        // like a bug in the very label meant to reassure.
        expect(formatFreshness(new Date('2026-06-15T12:00:00.000Z'), now)).toBe('just now')
        expect(formatFreshness(new Date('2026-06-15T11:59:05.000Z'), now)).toBe('just now')
    })

    it('switches to a relative age once it stops being fresh', () => {
        expect(formatFreshness(new Date('2026-06-15T11:55:00.000Z'), now)).toBe('5 minutes ago')
        expect(formatFreshness(new Date('2026-06-15T10:00:00.000Z'), now)).toBe('2 hours ago')
    })

    it('returns nothing when there has been no load', () => {
        expect(formatFreshness(null, now)).toBe('')
    })
})
