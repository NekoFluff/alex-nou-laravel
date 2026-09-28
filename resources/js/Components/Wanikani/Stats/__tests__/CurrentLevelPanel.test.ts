/**
 * The current-level card's pace text.
 *
 * Regression suite for a self-contradictory pair of claims. The card reported
 * "6.6 days ahead of your usual pace" and "≈ 21.0 more days at your typical pace" in the
 * same breath, for a level 5.5 days into a 12.1-day norm.
 *
 * Two separate faults:
 *
 *  - The estimate came from `4 + (kanjiLeft - 1) * 0.5`, a fixed heuristic that never
 *    consulted the measured pace it claimed to describe. 38 kanji left produced 21 days
 *    regardless of how fast the account actually levels.
 *  - "Ahead of your usual pace" compared *days elapsed* against the typical duration.
 *    Having spent less time is not progress, so a slow level looked like a fast one.
 *
 * The estimate was fixed to use the measured pace. The ahead/behind verdict was
 * subsequently removed altogether, so the tests that pinned its wording are replaced by
 * guards that it stays gone.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CurrentLevelPanel from '@/Components/Wanikani/Stats/CurrentLevelPanel.vue'
import type { WaniKaniStats } from '@/domain/stats-types'

function statsWith(options: {
    daysOnLevel: number
    daysPerLevel: number
    kanjiPassed: number
    kanjiTotal?: number
    isComplete?: boolean
}): WaniKaniStats {
    const kanjiTotal = options.kanjiTotal ?? 35
    return {
        currentLevel: {
            level: 32,
            startedAt: null,
            daysOnLevel: options.daysOnLevel,
            kanjiTotal,
            kanjiPassed: options.kanjiPassed,
            radicalsTotal: 6,
            radicalsPassed: 6,
            vocabularyTotal: 121,
            vocabularyPassed: 6,
            progress: (options.kanjiPassed / kanjiTotal) * 100,
            isComplete: options.isComplete ?? false,
        },
        projection: {
            daysPerLevel: options.daysPerLevel,
            sampleSize: 8,
            levelsRemaining: 28,
            hoursRemaining: 1,
            etaByLevelPace: new Date('2027-06-20T00:00:00.000Z'),
            totalCurriculumMs: 1,
        },
    } as unknown as WaniKaniStats
}

const render = (stats: WaniKaniStats) => mount(CurrentLevelPanel, { props: { stats } }).text()

describe('CurrentLevelPanel pace text', () => {
    it('derives the remaining estimate from the measured pace', () => {
        // 5.5 days into a 12.1-day norm leaves 6.6 days, not a heuristic 21.
        const text = render(statsWith({ daysOnLevel: 5.5, daysPerLevel: 12.1, kanjiPassed: 10 }))

        expect(text).toContain('About 6.6 more days at your 12.1-day pace')
        expect(text).not.toContain('21.0 more days')
    })

    it('never reports being ahead while also claiming weeks remaining', () => {
        const text = render(statsWith({ daysOnLevel: 5.5, daysPerLevel: 12.1, kanjiPassed: 10 }))

        // The contradictory pair must not both appear.
        expect(text).not.toContain('days ahead of your usual pace')
        expect(text).not.toMatch(/\d+(\.\d+)? days ahead/)
    })

    it('makes no claim about being ahead or behind', () => {
        // This verdict was removed at the owner's request. It is asserted in both
        // directions so it cannot creep back in whichever way the data leans.
        const slow = render(statsWith({ daysOnLevel: 6, daysPerLevel: 12, kanjiPassed: 10 }))
        expect(slow).not.toContain('behind')
        expect(slow).not.toContain('ahead')
        expect(slow).not.toContain('you would have passed')

        const fast = render(statsWith({ daysOnLevel: 6, daysPerLevel: 12, kanjiPassed: 20 }))
        expect(fast).not.toContain('behind')
        expect(fast).not.toContain('ahead')
        expect(fast).not.toContain('you would have passed')
    })

    it('does not invent a countdown once a level runs long', () => {
        // Past the typical duration there is no honest number of days left to promise.
        const text = render(statsWith({ daysOnLevel: 20, daysPerLevel: 12, kanjiPassed: 10 }))
        expect(text).toContain('this one is at day 20.0')
        expect(text).not.toContain('more days at your')
    })

    it('congratulates a finished level instead of estimating', () => {
        const text = render(
            statsWith({ daysOnLevel: 8, daysPerLevel: 12, kanjiPassed: 35, isComplete: true }),
        )
        expect(text).toContain('All kanji guru’d')
        expect(text).not.toContain('more days')
    })

    it('falls back gracefully without level history', () => {
        const text = render(statsWith({ daysOnLevel: 3, daysPerLevel: 0, kanjiPassed: 5 }))
        expect(text).toContain('Not enough level history to estimate yet')
    })
})
