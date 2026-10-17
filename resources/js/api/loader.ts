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
  /** The collection's `data_updated_at`, sent back as `updated_after` to fetch only changes. */
  dataUpdatedAt?: string | null
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
    // Needed for the leech table's links, so it has to survive caching.
    document_url: subject.document_url,
    character_images: 'character_images' in subject ? subject.character_images : [],
    // Radicals and kana vocabulary have no `readings` key at all.
    ...('readings' in subject ? { readings: subject.readings } : {}),
  })) as Subject[]
}

export type LoadPhase = 'idle' | 'validating' | 'cache' | 'downloading' | 'computing' | 'done'

/** One collection download, shown as its own row so parallel downloads never share a bar. */
export type DownloadKey = 'catalog' | 'assignments' | 'reviews' | 'levels'

export interface DownloadStep {
  key: DownloadKey
  label: string
  loaded: number
  total: number
  status: 'pending' | 'active' | 'done'
  /** Set when the step finished without downloading anything (served from cache). */
  cached?: boolean
}

export interface LoadProgress {
  phase: LoadPhase
  loaded: number
  total: number
  label: string
  /** Per-collection progress, in display order. Empty until downloading starts. */
  downloads?: DownloadStep[]
}

export const PHASE_LABELS: Record<LoadPhase, string> = {
  idle: 'Waiting',
  validating: 'Checking token',
  cache: 'Reading local cache',
  downloading: 'Downloading WaniKani data',
  computing: 'Crunching numbers',
  done: 'Ready',
}

export const DOWNLOAD_LABELS: Record<DownloadKey, string> = {
  catalog: 'Downloading the subject catalog',
  assignments: 'Downloading assignments',
  reviews: 'Downloading review statistics',
  levels: 'Downloading level history',
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

  // The catalog barely changes, so a cache younger than its TTL is used without asking.
  // Revalidating on every load is what made "Downloading the subject catalog" reappear on
  // each refresh: the API's ETag is not exposed to browsers, so the conditional request
  // never had a validator and fell through to a full ~9,400-subject download.
  const freshCatalog =
    !force &&
    cachedCatalog &&
    cachedCatalog.ageMs < CACHE_TTL.catalog &&
    cachedCatalog.value.subjects.length > 0 &&
    cachedCatalog.value.spacedRepetitionSystem
      ? cachedCatalog.value
      : null

  // ------------------------------------------------------- download rows
  const steps: DownloadStep[] = (['catalog', 'assignments', 'reviews', 'levels'] as const).map((key) => {
    const cached = key === 'catalog' ? freshCatalog !== null : freshProgress !== null
    return { key, label: DOWNLOAD_LABELS[key], loaded: 0, total: 0, status: cached ? 'done' : 'pending', cached }
  })
  const emit = () => {
    const active = steps.filter((step) => step.status !== 'done' || !step.cached)
    report({
      phase: 'downloading',
      loaded: active.reduce((sum, step) => sum + step.loaded, 0),
      total: active.reduce((sum, step) => sum + step.total, 0),
      label: PHASE_LABELS.downloading,
      downloads: steps.map((step) => ({ ...step })),
    })
  }
  const step = (key: DownloadKey) => steps.find((entry) => entry.key === key)!
  const track = (key: DownloadKey) => (loaded: number, total: number) => {
    Object.assign(step(key), { loaded, total, status: 'active' })
    emit()
  }
  const finish = <T>(key: DownloadKey) => (outcome: T): T => {
    const entry = step(key)
    entry.status = 'done'
    // A 304 or an empty incremental fetch downloaded nothing; say so instead of "0 of 0".
    entry.cached = entry.total === 0
    if (entry.total > 0) {
      entry.loaded = entry.total
    }
    emit()
    return outcome
  }
  const begin = (key: DownloadKey) => {
    step(key).status = 'active'
  }

  // ------------------------------------------------------------- catalog
  const loadCatalog = async (): Promise<CatalogSnapshot> => {
    if (freshCatalog) {
      return freshCatalog
    }

    begin('catalog')
    const previous = cachedCatalog?.value ?? null
    // With a cached catalog, ask only for subjects changed since it was taken. That is
    // usually an empty page, and it works through CORS where `If-None-Match` cannot.
    const since = previous && previous.subjects.length > 0 ? (previous.dataUpdatedAt ?? null) : null

    const result = await fetchSubjects(
      token,
      { ...requestOptions, etag: previous?.etag ?? null, onProgress: track('catalog') },
      since ? { updated_after: since } : {},
    ).then(finish('catalog'))

    let catalog: CatalogSnapshot
    if (result.status === 'modified') {
      catalog = {
        fetchedAt: new Date().toISOString(),
        subjects: since && previous ? mergeById(previous.subjects, slimSubjects(result.data)) : slimSubjects(result.data),
        spacedRepetitionSystem: previous?.spacedRepetitionSystem ?? null,
        etag: result.meta.etag ?? previous?.etag ?? null,
        dataUpdatedAt: result.meta.dataUpdatedAt ?? previous?.dataUpdatedAt ?? null,
      }
    } else if (previous) {
      // `unmodified` (304) or `missing`: the cached pages are still the best data we have.
      catalog = { ...previous, fetchedAt: new Date().toISOString() }
    } else {
      // Nothing cached and the server reported no change: treat as an empty catalog
      // rather than failing the whole load.
      catalog = { fetchedAt: new Date().toISOString(), subjects: [], spacedRepetitionSystem: null, etag: null }
    }

    if (!catalog.spacedRepetitionSystem) {
      const systems = await fetchSpacedRepetitionSystems(token, requestOptions).catch(() => [])
      catalog = { ...catalog, spacedRepetitionSystem: pickDefaultSrs(systems) }
    }
    // Re-written even when nothing changed, so the TTL restarts from this check.
    await writeCache(cacheKeys.catalog(CATALOG_REVISION), catalog)
    return catalog
  }

  // ------------------------------------------------------------ progress
  const loadProgress = async (): Promise<ProgressSnapshot> => {
    if (freshProgress) {
      return freshProgress
    }
    const cached = cachedProgress?.value ?? null
    begin('assignments')
    begin('reviews')
    begin('levels')

    const [assignments, reviewStatistics, levelProgressions, resets] = await Promise.all([
      fetchAssignments(token, {
        ...requestOptions,
        etag: cached?.etags?.assignments ?? null,
        onProgress: track('assignments'),
      }).then(finish('assignments')),
      fetchReviewStatistics(token, {
        ...requestOptions,
        etag: cached?.etags?.reviewStatistics ?? null,
        onProgress: track('reviews'),
      }).then(finish('reviews')),
      fetchLevelProgressions(token, {
        ...requestOptions,
        etag: cached?.etags?.levelProgressions ?? null,
        onProgress: track('levels'),
      }).then(finish('levels')),
      // A reset is rare and explains otherwise-baffling level history, so a failure
      // here should not sink the whole load.
      fetchResets(token, requestOptions).catch(() => null),
    ])

    const progress: ProgressSnapshot = {
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
    return progress
  }

  if (!freshCatalog || !freshProgress) {
    emit()
  }
  const [catalog, progress] = await Promise.all([loadCatalog(), loadProgress()])

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

/** Applies an incremental subject fetch over the cached catalog, keeping its order. */
function mergeById(base: Subject[], updates: Subject[]): Subject[] {
  if (updates.length === 0) {
    return base
  }
  const byId = new Map(updates.map((subject) => [subject.id, subject]))
  const merged = base.map((subject) => byId.get(subject.id) ?? subject)
  const known = new Set(base.map((subject) => subject.id))
  return merged.concat(updates.filter((subject) => !known.has(subject.id)))
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
