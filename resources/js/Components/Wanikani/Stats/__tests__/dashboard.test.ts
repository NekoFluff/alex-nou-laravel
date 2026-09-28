/**
 * Render test for the ported dashboard.
 *
 * The page swaps between two entirely different bodies depending on whether a token is
 * present, and only the token branch renders the new panels. A type-check cannot tell
 * whether those panels actually mount, so this drives the real composable through a
 * stubbed loader and asserts the rendered output.
 *
 * The charts are stubbed: ApexCharts needs a real canvas, and what matters here is that
 * every panel resolves and every computed value reaches the DOM without a crash.
 */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { DEFAULT_SETTINGS } from '@/domain/stats'
import type { Dataset } from '@/domain/stats-types'
import type { Assignment, Kanji, LevelProgression, Radical, ReviewStatistic, Subject, Summary, User, Vocabulary } from '@/api/types'

const NOW = new Date('2026-06-15T12:00:00.000Z')

const USER: User = {
    id: 'user-uuid',
    username: 'TestUser',
    level: 2,
    profile_url: 'https://www.wanikani.com/users/TestUser',
    started_at: '2026-01-01T00:00:00.000Z',
    subscription: { active: true, type: 'lifetime', max_level_granted: 60, period_ends_at: null },
    current_vacation_started_at: null,
}

function base(id: number, object: Subject['object'], level: number, slug: string) {
    return {
        id,
        object,
        level,
        slug,
        characters: slug,
        hidden_at: null,
        document_url: `https://www.wanikani.com/${object}/${slug}`,
        meanings: [{ meaning: slug, primary: true, accepted_answer: true }],
        auxiliary_meanings: [],
        created_at: '2012-02-27T18:08:16.000Z',
    }
}

const radicalOne: Radical = {
    ...base(1, 'radical', 1, 'ground'),
    object: 'radical',
    character_images: [],
    amalgamation_subject_ids: [],
}
const kanjiOne: Kanji = {
    ...base(10, 'kanji', 1, 'one'),
    object: 'kanji',
    readings: [{ reading: 'いち', primary: true, accepted_answer: true, type: 'onyomi' }],
    component_subject_ids: [],
    amalgamation_subject_ids: [],
    visually_similar_subject_ids: [],
    meaning_mnemonic: 'm',
    meaning_hint: null,
    reading_mnemonic: 'm',
    reading_hint: null,
}
const vocabOne: Vocabulary = {
    ...base(20, 'vocabulary', 1, 'one-vocab'),
    object: 'vocabulary',
    readings: [{ reading: 'いち', primary: true, accepted_answer: true }],
    parts_of_speech: ['noun'],
    component_subject_ids: [],
    meaning_mnemonic: 'm',
    reading_mnemonic: 'm',
}
/** A four-character item, which is the case the glyph sizing exists for. */
const longVocab: Vocabulary = {
    ...base(21, 'vocabulary', 1, 'おはよう'),
    object: 'vocabulary',
    characters: 'おはよう',
    readings: [{ reading: 'おはよう', primary: true, accepted_answer: true }],
    parts_of_speech: ['expression'],
    component_subject_ids: [],
    meaning_mnemonic: 'm',
    reading_mnemonic: 'm',
}

const lockedVocab: Vocabulary = {
    ...base(30, 'vocabulary', 2, 'cat'),
    object: 'vocabulary',
    characters: '猫',
    readings: [{ reading: 'ねこ', primary: true, accepted_answer: true }],
    parts_of_speech: ['noun'],
    component_subject_ids: [],
    meaning_mnemonic: 'm',
    reading_mnemonic: 'm',
}

function assignment(overrides: Partial<Assignment> & { subject_id: number }): Assignment {
    return {
        created_at: '2026-01-01T00:00:00.000Z',
        subject_type: 'vocabulary',
        srs_stage: 0,
        unlocked_at: '2026-01-01T00:00:00.000Z',
        started_at: null,
        passed_at: null,
        burned_at: null,
        available_at: null,
        resurrected_at: null,
        hidden: false,
        ...overrides,
    }
}

const DATASET: Dataset = {
    user: USER,
    summary: {
        lessons: [{ available_at: '2026-06-15T05:00:00.000Z', subject_ids: [20] }],
        reviews: [
            { available_at: '2026-06-15T05:00:00.000Z', subject_ids: [] },
            { available_at: '2026-06-15T13:00:00.000Z', subject_ids: [10] },
        ],
        next_reviews_at: '2026-06-15T13:00:00.000Z',
    },
    // `lockedVocab` deliberately has no assignment: without it every subject would be
    // unlocked and progress would be a meaningless 100%.
    subjects: [radicalOne, kanjiOne, vocabOne, longVocab, lockedVocab],
    spacedRepetitionSystem: null,
    assignments: [
        assignment({
            subject_id: 1,
            subject_type: 'radical',
            srs_stage: 9,
            started_at: '2026-02-01T00:00:00.000Z',
            passed_at: '2026-03-01T00:00:00.000Z',
            burned_at: '2026-05-01T00:00:00.000Z',
        }),
        assignment({
            subject_id: 10,
            subject_type: 'kanji',
            srs_stage: 5,
            started_at: '2026-02-02T00:00:00.000Z',
            passed_at: '2026-04-01T00:00:00.000Z',
            available_at: '2026-06-15T13:00:00.000Z',
        }),
        assignment({ subject_id: 20, srs_stage: 0 }),
        assignment({
            subject_id: 21,
            srs_stage: 2,
            started_at: '2026-05-01T00:00:00.000Z',
            available_at: '2026-06-15T13:00:00.000Z',
        }),
    ],
    reviewStatistics: [
        {
            created_at: '2026-01-01T00:00:00.000Z',
            subject_id: 1,
            subject_type: 'radical',
            meaning_correct: 2,
            meaning_incorrect: 0,
            meaning_max_streak: 2,
            meaning_current_streak: 2,
            reading_correct: 0,
            reading_incorrect: 0,
            reading_max_streak: 0,
            reading_current_streak: 0,
            percentage_correct: 100,
            hidden: false,
        } satisfies ReviewStatistic,
        {
            created_at: '2026-01-01T00:00:00.000Z',
            subject_id: 10,
            subject_type: 'kanji',
            meaning_correct: 1,
            meaning_incorrect: 1,
            meaning_max_streak: 1,
            meaning_current_streak: 1,
            reading_correct: 1,
            reading_incorrect: 2,
            reading_max_streak: 1,
            reading_current_streak: 1,
            percentage_correct: 40,
            hidden: false,
        } satisfies ReviewStatistic,
        // Six misses on a still-apprentice item, so there is at least one leech to show.
        {
            created_at: '2026-01-01T00:00:00.000Z',
            subject_id: 21,
            subject_type: 'vocabulary',
            meaning_correct: 1,
            meaning_incorrect: 4,
            meaning_max_streak: 1,
            meaning_current_streak: 0,
            reading_correct: 1,
            reading_incorrect: 2,
            reading_max_streak: 1,
            reading_current_streak: 0,
            percentage_correct: 25,
            hidden: false,
        } satisfies ReviewStatistic,
    ],
    levelProgressions: [
        {
            created_at: '2026-01-01T00:00:00.000Z',
            level: 1,
            unlocked_at: '2026-01-01T00:00:00.000Z',
            started_at: '2026-01-02T00:00:00.000Z',
            passed_at: '2026-02-01T00:00:00.000Z',
            completed_at: null,
            abandoned_at: null,
        },
        {
            created_at: '2026-02-01T00:00:00.000Z',
            level: 2,
            unlocked_at: '2026-02-01T00:00:00.000Z',
            started_at: '2026-05-01T00:00:00.000Z',
            passed_at: null,
            completed_at: null,
            abandoned_at: null,
        },
    ] satisfies LevelProgression[],
    resets: [],
    fetchedAt: '2026-06-15T11:00:00.000Z',
}

vi.mock('@/api/loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/api/loader')>()
    return {
        ...actual,
        loadDataset: vi.fn(async () => DATASET),
        resetCache: vi.fn(async () => undefined),
    }
})

/** ApexCharts needs a real canvas; the panels are what this test is about. */
const chartStub = { template: '<div class="chart-stub" />' }

async function mountDashboard() {
    const { useWanikaniStats } = await import('@/composables/useWanikaniStats')
    const { ref } = await import('vue')

    const token = ref<string | null>(null)
    const api = useWanikaniStats(token)

    // Drive it exactly as the page does: set the token, then load.
    token.value = 'd443c409-815f-40e0-8950-2bf0fbe04d91'
    await api.load()

    return { api, token }
}

describe('ported WaniKani dashboard', () => {
    it('computes stats for a loaded token', async () => {
        const { api } = await mountDashboard()

        expect(api.error.value).toBeNull()
        expect(api.stats.value).not.toBeNull()

        const stats = api.stats.value!
        // 4 of 5 subjects unlocked.
        expect(stats.curriculumProgress).toBe(80)
        expect(stats.invested.lessonsCompleted).toBe(3)
        expect(stats.counts.burned).toBe(1)
        expect(api.settings.value.secondsPerReview).toBe(DEFAULT_SETTINGS.secondsPerReview)
    })

    it('renders every panel without throwing', async () => {
        const { api } = await mountDashboard()
        expect(api.stats.value).not.toBeNull()

        const KpiRow = (await import('@/Components/Wanikani/Stats/KpiRow.vue')).default
        const panels = await Promise.all(
            [
                'TimeInvestmentPanel',
                'CurrentLevelPanel',
                'SrsBreakdown',
                'ReviewForecastPanel',
                'BurnForecastPanel',
                'LevelHeatmap',
                'AccuracyPanel',
                'ContentProgressPanel',
                'LeechesPanel',
            ].map(async (name) => (await import(`@/Components/Wanikani/Stats/${name}.vue`)).default),
        )

        const stats = api.stats.value!
        const settings = api.settings.value

        const kpis = mount(KpiRow, { props: { stats, settings }, global: { stubs: { VueApexCharts: chartStub } } })
        const kpiText = kpis.text()
        for (const label of ['Time invested', 'Time remaining', 'Whole journey', 'Projected finish']) {
            expect(kpiText, `expected the "${label}" card`).toContain(label)
        }
        // Both time cards state their breakdown in hours, lessons first.
        // Hours are fractional at fixture scale, so the matcher must accept decimals.
        expect(kpiText).toMatch(/[\d.,]+h lessons \+ [\d.,]+h reviews/)
        expect(kpiText).not.toContain('NaN')
        kpis.unmount()

        // Each panel is checked for text it can only produce if its own logic ran, so a
        // panel that mounts but renders nothing meaningful still fails.
        const expectations: Array<[number, string]> = [
            [0, 'Time invested'],
            [1, 'Current level'],
            [2, 'SRS stages'],
            [3, 'Next 48 hours'],
            [4, 'Burn forecast'],
            [5, 'Level history'],
            [6, 'Accuracy'],
            [7, 'Content progress'],
            [8, 'Leeches'],
        ]

        for (const [index, marker] of expectations) {
            const wrapper = mount(panels[index], {
                props: { stats, settings },
                global: { stubs: { VueApexCharts: chartStub } },
            })
            const text = wrapper.text()
            expect(text, `panel ${index} should show "${marker}"`).toContain(marker)
            expect(text, `panel ${index} rendered NaN`).not.toContain('NaN')
            expect(text, `panel ${index} rendered undefined`).not.toContain('undefined')
            wrapper.unmount()
        }
    })

    it('renders the four-character item glyph without overflowing its box', async () => {
        const { api } = await mountDashboard()
        const LeechesPanel = (await import('@/Components/Wanikani/Stats/LeechesPanel.vue')).default
        const wrapper = mount(LeechesPanel, {
            props: { stats: api.stats.value!, settings: api.settings.value },
            global: { stubs: { VueApexCharts: chartStub } },
        })

        // The leech fixture uses おはよう, which is exactly the case the sizing exists for.
        expect(wrapper.text()).toContain('おはよう')

        const glyph = wrapper.find('span[title*="おはよう"]')
        expect(glyph.exists(), 'expected a glyph for the four-character item').toBe(true)

        const boxWidth = Number.parseFloat(/width:\s*([\d.]+)px/.exec(glyph.attributes('style') ?? '')?.[1] ?? 'NaN')
        const inner = glyph.find('span')
        const fontSize = Number.parseFloat(
            /font-size:\s*([\d.]+)px/.exec(inner.attributes('style') ?? '')?.[1] ?? 'NaN',
        )

        // The whole point of the sizing: the box must be wider than the glyphs it holds.
        expect(fontSize).toBeGreaterThan(0)
        expect(boxWidth).toBeGreaterThanOrEqual(4 * fontSize)
        wrapper.unmount()
    })

    it('puts each level date in its tile tooltip', async () => {
        const { api } = await mountDashboard()
        const LevelHeatmap = (await import('@/Components/Wanikani/Stats/LevelHeatmap.vue')).default
        const stats = api.stats.value!
        const wrapper = mount(LevelHeatmap, {
            props: { stats, settings: api.settings.value },
            global: { stubs: { VueApexCharts: chartStub } },
        })

        const tiles = wrapper.findAll('[data-level]')
        expect(tiles.length).toBeGreaterThanOrEqual(59)

        const dates = (await import('@/domain/format')).formatDate

        for (const row of stats.levels.rows) {
            const tile = tiles.find((node) => node.attributes('data-level') === String(row.level))
            expect(tile, `expected a tile for level ${row.level}`).toBeDefined()
            const title = tile!.attributes('title') ?? ''

            if (row.passedAt) {
                // Passed levels state the fact.
                expect(title).toContain(`Passed ${dates(row.passedAt)}`)
            } else if (row.projectedPassAt) {
                // Unfinished ones are marked as an estimate rather than a fact.
                expect(title).toContain(`Est. ${dates(row.projectedPassAt)}`)
            }
        }

        wrapper.unmount()
    })

    it('states the estimated completion date in the level history', async () => {
        const { api } = await mountDashboard()
        const LevelHeatmap = (await import('@/Components/Wanikani/Stats/LevelHeatmap.vue')).default
        const wrapper = mount(LevelHeatmap, {
            props: { stats: api.stats.value!, settings: api.settings.value },
            global: { stubs: { VueApexCharts: chartStub } },
        })

        const stats = api.stats.value!
        const text = wrapper.text()

        expect(text).toContain('Estimated completion')

        // The projection already drives the KPI card; the level history must agree with it
        // rather than recomputing a date of its own.
        if (stats.projection.levelsRemaining === 0) {
            expect(text).toContain('Level 60 reached')
        } else if (stats.projection.etaByLevelPace) {
            const expected = stats.projection.etaByLevelPace.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
            expect(text).toContain(expected)
            expect(text).toContain(`${stats.projection.levelsRemaining} levels left`)
        }

        wrapper.unmount()
    })

    it('renders the completion row independently of the pace chart', async () => {
        const { api } = await mountDashboard()
        const LevelHeatmap = (await import('@/Components/Wanikani/Stats/LevelHeatmap.vue')).default

        const stats = api.stats.value!
        // One sampled level suppresses the pace chart entirely.
        const thin = {
            ...stats,
            levels: { ...stats.levels, recentDurations: stats.levels.recentDurations.slice(0, 1) },
        }

        const wrapper = mount(LevelHeatmap, {
            props: { stats: thin, settings: api.settings.value },
            global: { stubs: { VueApexCharts: chartStub } },
        })

        const text = wrapper.text()
        // The row must not depend on the chart: it is a sibling, so it still appears.
        expect(text).not.toContain('Days spent on recent levels')
        expect(text).toContain('Estimated completion')

        // With too little history there is no date to state, and saying so is better than
        // hiding the row or inventing one.
        if (thin.projection.etaByLevelPace) {
            expect(text).toContain(`${thin.projection.levelsRemaining} levels left`)
        } else {
            expect(text).toContain('Not enough level history yet')
        }

        wrapper.unmount()
    })

    it('shows a useful message for a rejected token', async () => {
        const loader = await import('@/api/loader')
        const { WaniKaniError } = await import('@/api/client')
        vi.mocked(loader.loadDataset).mockRejectedValueOnce(new WaniKaniError('nope', 401))

        const { useWanikaniStats } = await import('@/composables/useWanikaniStats')
        const { ref } = await import('vue')
        const token = ref<string | null>('d443c409-815f-40e0-8950-2bf0fbe04d91')
        const api = useWanikaniStats(token)
        await api.load()
        expect(api.stats.value).toBeNull()
        expect(api.error.value).toContain('rejected that token')
    })
})
