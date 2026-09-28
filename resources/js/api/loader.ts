/**
 * Loading orchestration: token -> cache -> network -> stats engine.
 *
 * Split into two independently cached halves so a normal page load is cheap:
 *
 * - **progress** — assignments, review statistics, level progressions and the
 *   summary. Small enough to re-check often, and the part that actually changes.
 * - **catalog** — the subject list and SRS stage definitions. ~9,400 records that
 *   only change when WaniKani ships new content, so it is cached for a week.
 */

import {
  fetchAssignments,
  fetchLevelProgressions,
  fetchResets,
  fetchReviewStatistics,
  fetchSpacedRepetitionSystems,
  fetchSubjects,
  fetchSummary,
  fetchUser,
  pickDefaultSrs,
  WaniKaniError,
  type FetchOutcome,
  type RequestOptions,
} from './client'
import { API_MODE } from '@/utils/wanikaniToken'
import { CACHE_TTL, cacheKeys, clearCache, readCache, writeCache } from './cache'
import type {
  Assignment,
  SlimSubject,
  LevelProgression,
  Reset,
  ReviewStatistic,
  SpacedRepetitionSystem,
  Subject,
  Summary,
  User,
} from './types'
import type { Dataset } from '@/domain/stats-types'

/** Bumped whenever the catalog's shape or content assumptions change. */
const CATALOG_REVISION = 'v1'

/**
 * Cached user progress, plus the validators needed to re-check it cheaply.
 *
 * The ETags are per collection and scope-wide, so a later refresh sends them as
 * `If-None-Match` and gets a bodiless `304` when nothing has changed.
 */
export interface ProgressSnapshot {
  fetchedAt: string
  summary: Summary
  assignments: Assignment[]
  reviewStatistics: ReviewStatistic[]
  levelProgressions: LevelProgression[]
  resets: Reset[]
  etags?: {
    assignments: string | null
    reviewStatistics: string | null
    levelProgressions: string | null
  }
}

export interface CatalogSnapshot {
  fetchedAt: string
  /** Slimmed before storage — see `slimSubjects`. Typed as `Subject[]` so the rest of
   * the app keeps working with full payloads; the slimming is enforced at the boundary
   * and covered by a test. */
  subjects: Subject[]
  spacedRepetitionSystem: SpacedRepetitionSystem | null
  etag?: string | null
}

/**
 * Drops everything the engine never reads before the catalogue is written to IndexedDB.
 *
 * This is not a micro-optimisation: the removed fields are 84% of the payload, and the
 * full-size write was the thing most likely to hit a storage quota and fail silently.
 */
export function slimSubjects(subjects: Subject[]): Subject[] {
  return subjects.map((subject) => ({
    id: subject.id,
    object: subject.object,
    level: subject.level,
    slug: subject.slug,
    characters: subject.characters,
    hidden_at: subject.hidden_at,
    meanings: subject.meanings,
    character_images: 'character_images' in subject ? subject.character_images : [],
    // Radicals and kana vocabulary have no `readings` key at all.
    ...('readings' in subject ? { readings: subject.readings } : {}),
  })) as Subject[]
}

export type LoadPhase =
  | 'idle'
  | 'validating'
  | 'cache'
  | 'catalog'
  | 'assignments'
  | 'reviews'
  | 'levels'
  | 'summary'
  | 'computing'
  | 'done'

export interface LoadProgress {
  phase: LoadPhase
  loaded: number
  total: number
  label: string
}

export const PHASE_LABELS: Record<LoadPhase, string> = {
  idle: 'Waiting',
  validating: 'Checking your token',
  cache: 'Reading local cache',
  catalog: 'Downloading the subject catalog',
  assignments: 'Downloading assignments',
  reviews: 'Downloading review statistics',
  levels: 'Downloading level history',
  summary: 'Downloading the review forecast',
  computing: 'Crunching numbers',
  done: 'Ready',
}

/** Validates a token and returns the account it belongs to. */
export async function validateToken(token: string, signal?: AbortSignal): Promise<User> {
  return fetchUser(token, { signal, transport: API_MODE })
}

/** Full account dataset, using the cache when it is still fresh. */
/**
 * Loads an account's full dataset.
 *
 * The caller supplies only a token. The account id is resolved from the API first and used
 * as the cache key, because a constant key meant every account shared one cached progress
 * snapshot: switching tokens served the previous account's assignments and review counts
 * straight from cache, and the dashboard showed the wrong person's numbers with no error.
 * `force` hid it, which is why pressing Refresh appeared to fix things.
 */
export async function loadDataset(
  token: string,
  options: {
    force?: boolean
    signal?: AbortSignal
    onProgress?: (progress: LoadProgress) => void
    now?: Date
  } = {},
): Promise<Dataset> {
  const { force = false, signal, onProgress } = options
  const report = (progress: LoadProgress) => onProgress?.(progress)
  const requestOptions: RequestOptions = { signal, transport: API_MODE }

  // One small request that identifies the account and yields the current level, which is
  // needed before any cache lookup can be correct. A rejected token fails here, before
  // anything cached for another account can be touched.
  report({ phase: 'validating', loaded: 0, total: 1, label: PHASE_LABELS.validating })
  const user = await fetchUser(token, requestOptions)
  const userId = user.id

  /*
   * Cache policy.
   *
   * WaniKani supports conditional requests on every collection, and each collection
   * carries ONE ETag covering its whole filtered scope — verified identical across
   * pages. That changes what "refresh" needs to mean:
   *
   *   - fresh cache, no force -> no network at all (except the tiny `summary`)
   *   - force, or a stale cache -> send `If-None-Match`; a bodiless 304 means the
   *     cached pages are still valid, so nothing is re-downloaded
   *
   * A refresh on an idle account therefore costs a handful of empty 304s instead of
   * ~20 pages (~3.5 MB).
   */
  report({ phase: 'cache', loaded: 0, total: 1, label: PHASE_LABELS.cache })

  const [cachedProgress, cachedCatalog] = await Promise.all([
    readCache<ProgressSnapshot>(cacheKeys.progress(userId)),
    readCache<CatalogSnapshot>(cacheKeys.catalog(CATALOG_REVISION)),
  ])

  const freshProgress =
    !force && cachedProgress && cachedProgress.ageMs < CACHE_TTL.progress
      ? cachedProgress.value
      : null

  // ------------------------------------------------------------- catalog
  report({ phase: 'catalog', loaded: 0, total: 0, label: PHASE_LABELS.catalog })

  const catalogResult = await fetchSubjects(token, {
    ...requestOptions,
    etag: cachedCatalog?.value.etag ?? null,
    onProgress: (loaded, total) => report({ phase: 'catalog', loaded, total, label: PHASE_LABELS.catalog }),
  })

  let catalog: CatalogSnapshot
  if (catalogResult.status === 'modified') {
    catalog = {
      fetchedAt: new Date().toISOString(),
      subjects: slimSubjects(catalogResult.data),
      spacedRepetitionSystem: cachedCatalog?.value.spacedRepetitionSystem ?? null,
      etag: catalogResult.meta.etag,
    }
  } else if (cachedCatalog) {
    // `unmodified` (304) or `missing`: the cached pages are still the best data we have.
    catalog = cachedCatalog.value
  } else {
    // Nothing cached and the server reported no change: treat as an empty catalog
    // rather than failing the whole load.
    catalog = { fetchedAt: new Date().toISOString(), subjects: [], spacedRepetitionSystem: null, etag: null }
  }

  let spacedRepetitionSystem = catalog.spacedRepetitionSystem
  if (!spacedRepetitionSystem) {
    const systems = await fetchSpacedRepetitionSystems(token, requestOptions).catch(() => [])
    spacedRepetitionSystem = pickDefaultSrs(systems)
  }
  if (spacedRepetitionSystem !== catalog.spacedRepetitionSystem || catalogResult.status === 'modified') {
    catalog = { ...catalog, spacedRepetitionSystem }
    await writeCache(cacheKeys.catalog(CATALOG_REVISION), catalog)
  }

  // ------------------------------------------------------------ progress
  let progress = freshProgress

  if (!progress) {
    const cached = cachedProgress?.value ?? null

    const [assignments, reviewStatistics, levelProgressions, resets] = await Promise.all([
      fetchAssignments(token, {
        ...requestOptions,
        etag: cached?.etags?.assignments ?? null,
        onProgress: (loaded, total) =>
          report({ phase: 'assignments', loaded, total, label: PHASE_LABELS.assignments }),
      }),
      fetchReviewStatistics(token, {
        ...requestOptions,
        etag: cached?.etags?.reviewStatistics ?? null,
        onProgress: (loaded, total) => report({ phase: 'reviews', loaded, total, label: PHASE_LABELS.reviews }),
      }),
      fetchLevelProgressions(token, {
        ...requestOptions,
        etag: cached?.etags?.levelProgressions ?? null,
        onProgress: (loaded, total) => report({ phase: 'levels', loaded, total, label: PHASE_LABELS.levels }),
      }),
      // A reset is rare and explains otherwise-baffling level history, so a failure
      // here should not sink the whole load.
      fetchResets(token, requestOptions).catch(() => null),
    ])

    progress = {
      fetchedAt: new Date().toISOString(),
      assignments: assignments.status === 'modified' ? assignments.data : (cached?.assignments ?? []),
      reviewStatistics:
        reviewStatistics.status === 'modified' ? reviewStatistics.data : (cached?.reviewStatistics ?? []),
      levelProgressions:
        levelProgressions.status === 'modified' ? levelProgressions.data : (cached?.levelProgressions ?? []),
      // The summary is tiny and genuinely changes hour to hour, so it is always fresh.
      summary: await fetchSummary(token, requestOptions),
      resets: resets?.status === 'modified' ? resets.data : (cached?.resets ?? []),
      etags: {
        assignments: pickEtag(assignments, cached?.etags?.assignments),
        reviewStatistics: pickEtag(reviewStatistics, cached?.etags?.reviewStatistics),
        levelProgressions: pickEtag(levelProgressions, cached?.etags?.levelProgressions),
      },
    }
    await writeCache(cacheKeys.progress(userId), progress)
  }

  report({ phase: 'computing', loaded: 0, total: 1, label: PHASE_LABELS.computing })

  return {
    user,
    summary: progress.summary,
    assignments: progress.assignments,
    reviewStatistics: progress.reviewStatistics,
    levelProgressions: progress.levelProgressions,
    subjects: catalog.subjects,
    resets: progress.resets ?? [],
    spacedRepetitionSystem: catalog.spacedRepetitionSystem,
    fetchedAt: progress.fetchedAt,
  }
}

/** Keeps the previous ETag when a collection came back unchanged. */
function pickEtag<T>(outcome: FetchOutcome<T>, previous: string | null | undefined): string | null {
  if (outcome.status === 'modified') {
    return outcome.meta.etag ?? previous ?? null
  }
  return outcome.meta.etag ?? previous ?? null
}

export async function resetCache(): Promise<void> {
  await clearCache()
}

export { WaniKaniError }
