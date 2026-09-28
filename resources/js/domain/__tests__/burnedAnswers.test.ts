/**
 * Answers per burned item.
 *
 * Regression suite for a reported bug: the panel showed 49.3 answers per burned item on an
 * account whose burned items actually averaged 23.0. The numerator was every answer on the
 * account while the denominator was only the burned items, so work on items still climbing
 * was divided by a count those items were not part of. 53% of the numerator belonged to
 * unburned items, overstating the figure 2.15x.
 */
import { describe, expect, it } from 'vitest'
import { computeStats, DEFAULT_SETTINGS } from '@/domain/stats'
import { hasFixture, loadFixture } from '@/domain/__tests__/fixture'
import type { Dataset } from '@/domain/stats-types'
import type { Assignment, ReviewStatistic, Subject } from '@/api/types'

const describeWithFixture = hasFixture() ? describe : describe.skip

describeWithFixture('answers per burned item, real account', () => {
    const dataset = loadFixture() as Dataset

    it('counts only the answers belonging to burned items', () => {
        // Hidden assignments AND hidden subjects are excluded by the engine, so the
        // expectation has to apply the same two filters.
        const hiddenSubjects = new Set(
            dataset.subjects.filter((s) => s.hidden_at !== null).map((s) => s.id),
        )
        // The engine treats an item as burned if it has a `burned_at` timestamp OR sits at
        // stage 9. The timestamp matters because resurrected items keep their original burn
        // date while sitting back at a lower stage: they belong in the denominator (they
        // did burn) even though they are in circulation again, and they contribute no
        // answers to the numerator, making this average slightly conservative.
        const visible = dataset.assignments.filter(
            (a) => !a.hidden && !hiddenSubjects.has(a.subject_id),
        )
        // Denominator: everything that has burned, including resurrected items that are
        // back in circulation — they did burn, so they belong in the average.
        const burnedIds = new Set(
            visible.filter((a) => a.burned_at !== null || a.srs_stage >= 9).map((a) => a.subject_id),
        )
        // Numerator: only items still AT stage 9. A resurrected item's answers were spent on
        // its current climb, not on the burn it already completed, so counting them would
        // inflate what burning costs.
        const stillBurnedIds = new Set(
            visible.filter((a) => a.srs_stage >= 9).map((a) => a.subject_id),
        )
        const answersOf = (stat: ReviewStatistic) => {
            const hasReading = stat.subject_type === 'kanji' || stat.subject_type === 'vocabulary'
            return (
                stat.meaning_correct +
                stat.meaning_incorrect +
                (hasReading ? stat.reading_correct + stat.reading_incorrect : 0)
            )
        }

        const expected =
            dataset.reviewStatistics
                .filter((stat) => !stat.hidden && stillBurnedIds.has(stat.subject_id))
                .reduce((sum, stat) => sum + answersOf(stat), 0) / burnedIds.size

        const stats = computeStats(dataset, DEFAULT_SETTINGS, new Date('2026-06-15T12:00:00.000Z'))
        expect(stats.invested.answersPerBurnedItem).toBeCloseTo(expected, 6)
    })

    it('is materially lower than dividing every answer by the burned count', () => {
        // The exact shape of the bug, asserted so it cannot come back.
        const stats = computeStats(dataset, DEFAULT_SETTINGS, new Date('2026-06-15T12:00:00.000Z'))
        const contaminated = stats.invested.answersRecorded / stats.counts.burned

        expect(stats.invested.answersPerBurnedItem).toBeLessThan(contaminated)
        expect(contaminated / stats.invested.answersPerBurnedItem).toBeGreaterThan(1.5)
    })

    it('sits above the fourteen-answer floor, since real items get answered wrong', () => {
        const stats = computeStats(dataset, DEFAULT_SETTINGS, new Date('2026-06-15T12:00:00.000Z'))
        expect(stats.invested.answersPerBurnedItem).toBeGreaterThan(14)
    })
})

describe('answers per burned item, synthetic', () => {
    /** Two items: one burned with 4 answers, one still climbing with 40. */
    function build(burnedStage: number): Dataset {
        const subjects = [1, 2].map(
            (id) =>
                ({
                    id,
                    object: 'radical',
                    level: 1,
                    slug: `s${id}`,
                    characters: '一',
                    hidden_at: null,
                    meanings: [],
                    character_images: [],
                    created_at: '2026-01-01T00:00:00.000Z',
                    document_url: 'u',
                    auxiliary_meanings: [],
                    amalgamation_subject_ids: [],
                }) as unknown as Subject,
        )

        const assignments = [
            { subject_id: 1, srs_stage: burnedStage },
            { subject_id: 2, srs_stage: 1 },
        ].map(
            (partial) =>
                ({
                    created_at: '2026-01-01T00:00:00.000Z',
                    subject_type: 'radical',
                    unlocked_at: '2026-01-01T00:00:00.000Z',
                    started_at: '2026-01-02T00:00:00.000Z',
                    passed_at: null,
                    burned_at: null,
                    available_at: null,
                    resurrected_at: null,
                    hidden: false,
                    ...partial,
                }) as unknown as Assignment,
        )

        const statistics = [
            { subject_id: 1, meaning_correct: 4, meaning_incorrect: 0 },
            { subject_id: 2, meaning_correct: 40, meaning_incorrect: 0 },
        ].map(
            (partial) =>
                ({
                    created_at: '2026-01-01T00:00:00.000Z',
                    subject_type: 'radical',
                    meaning_max_streak: 0,
                    meaning_current_streak: 0,
                    reading_correct: 0,
                    reading_incorrect: 0,
                    reading_max_streak: 0,
                    reading_current_streak: 0,
                    percentage_correct: 0,
                    hidden: false,
                    ...partial,
                }) as unknown as ReviewStatistic,
        )

        return {
            user: {
                id: 'u',
                username: 'U',
                level: 1,
                profile_url: 'p',
                started_at: '2026-01-01T00:00:00.000Z',
                subscription: { active: true, type: 'lifetime', max_level_granted: 60, period_ends_at: null },
                current_vacation_started_at: null,
            },
            summary: { lessons: [], reviews: [], next_reviews_at: null },
            subjects,
            assignments,
            reviewStatistics: statistics,
            levelProgressions: [],
            resets: [],
            fetchedAt: null,
        }
    }

    it('ignores answers spent on items that have not burned', () => {
        const stats = computeStats(build(9), DEFAULT_SETTINGS, new Date('2026-01-01T00:00:00.000Z'))

        // Only item 1 burned, and it took 4 answers. Item 2's 40 answers are irrelevant
        // to what a burned item costs.
        expect(stats.counts.burned).toBe(1)
        expect(stats.invested.answersRecorded).toBe(44)
        expect(stats.invested.answersPerBurnedItem).toBe(4)
    })

    it('is zero when nothing has burned', () => {
        const stats = computeStats(build(5), DEFAULT_SETTINGS, new Date('2026-01-01T00:00:00.000Z'))
        expect(stats.counts.burned).toBe(0)
        expect(stats.invested.answersPerBurnedItem).toBe(0)
    })
})
