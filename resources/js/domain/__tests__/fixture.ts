/**
 * Loads a locally mirrored WaniKani account, used to check the engine against real data
 * rather than only fixtures we wrote ourselves.
 *
 * The dump is not committed (it contains a real account's history), so it is resolved
 * through Vite's glob so that a missing file is simply "no fixture" rather than a build
 * error. Drop one at `resources/js/test/fixtures/wanikani-dataset.json` to enable the
 * tests that depend on it.
 */
import { unwrapRecords } from '@/api/envelope'
import type { Dataset } from '@/domain/stats-types'
import type {
    Assignment,
    LevelProgression,
    Reset,
    ReviewStatistic,
    Subject,
    Summary,
    User,
} from '@/api/types'

interface RawDataset {
    user: User
    summary: Summary
    assignments: unknown[]
    review_statistics: unknown[]
    level_progressions: unknown[]
    resets?: unknown[]
    subjects: unknown[]
    fetched_at?: string
}

/*
 * Root-absolute on purpose. `import.meta.glob` resolves patterns against Vite's project
 * root, not the importing file, so a relative '../' pattern silently matches nothing here
 * and the fixture tests would report "no fixture" even with the file present.
 */
const modules = import.meta.glob<RawDataset>('/resources/js/test/fixtures/wanikani-dataset.json', {
    eager: true,
    import: 'default',
})

const raw = Object.values(modules)[0] as RawDataset | undefined

let cached: Dataset | null | undefined

export function hasFixture(): boolean {
    return raw !== undefined
}

export function loadFixture(): Dataset | null {
    if (cached !== undefined) {
        return cached
    }

    if (!raw) {
        cached = null
        return cached
    }

    cached = {
        user: raw.user,
        summary: raw.summary,
        assignments: unwrapRecords<Assignment>(raw.assignments),
        reviewStatistics: unwrapRecords<ReviewStatistic>(raw.review_statistics),
        levelProgressions: unwrapRecords<LevelProgression>(raw.level_progressions),
        resets: unwrapRecords<Reset>(raw.resets ?? []),
        subjects: unwrapRecords<Subject>(raw.subjects),
        spacedRepetitionSystem: null,
        fetchedAt: raw.fetched_at ?? null,
    }

    return cached
}
