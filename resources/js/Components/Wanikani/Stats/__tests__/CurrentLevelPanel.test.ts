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

const render = (stats: WaniKaniStats) =>
    mount(CurrentLevelPanel, { props: { stats } }).text()

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
        expect(text).not.toMatch(/\\d+(\\.\\d+)? days ahead/)
    })

    it('judges pace by kanji progress rather than by time elapsed', () => {
        // Half a level in, 10 of 35 kanji done is behind, and must say so.
        const behind = render(statsWith({ daysOnLevel: 6, daysPerLevel: 12, kanjiPassed: 10 }))
        expect(behind).toContain('behind')

        // The same elapsed time with the kanji actually done is the opposite verdict.
        const onTrack = render(statsWith({ daysOnLevel: 6, daysPerLevel: 12, kanjiPassed: 20 }))
        expect(onTrack).toContain('ahead')
    })

    it('says how many kanji were expected, so the verdict can be checked', () => {
        // Half of a 12-day level is 6 days; half of 35 kanji is ~18.
        const text = render(statsWith({ daysOnLevel: 6, daysPerLevel: 12, kanjiPassed: 10 }))
        expect(text).toContain('you would have passed about 18 kanji')
    })

    it('stays quiet about pace in the first days of a level', () => {
        // Comparing against a fraction of a level this small would be noise.
        const text = render(statsWith({ daysOnLevel: 0.5, daysPerLevel: 12, kanjiPassed: 1 }))
        expect(text).not.toContain('behind')
        expect(text).not.toContain('ahead')
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
