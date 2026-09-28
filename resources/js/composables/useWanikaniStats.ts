/**
 * Loads the full account dataset and keeps the computed stats in sync with the pace
 * assumptions.
 *
 * The token is supplied by the caller rather than read from storage here: the page owns
 * that concern, so this composable stays a pure "token in, stats out" bridge between the
 * loader and the engine.
 */
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { computeStats, DEFAULT_SETTINGS } from '@/domain/stats'
import type { Dataset, StudySettings, WaniKaniStats } from '@/domain/stats-types'
import { loadDataset, WaniKaniError, type LoadProgress } from '@/api/loader'

const SETTINGS_KEY = 'wanikani:study-settings'

function loadSettings(): StudySettings {
    try {
        const raw = window.localStorage.getItem(SETTINGS_KEY)
        const stored = raw ? (JSON.parse(raw) as Partial<StudySettings>) : {}
        return {
            secondsPerReview:
                typeof stored.secondsPerReview === 'number' && stored.secondsPerReview > 0
                    ? stored.secondsPerReview
                    : DEFAULT_SETTINGS.secondsPerReview,
            minutesPerLesson:
                typeof stored.minutesPerLesson === 'number' && stored.minutesPerLesson > 0
                    ? stored.minutesPerLesson
                    : DEFAULT_SETTINGS.minutesPerLesson,
            isPanelOpen: stored.isPanelOpen === true,
        }
    } catch {
        return { ...DEFAULT_SETTINGS }
    }
}

/** An aborted request is a cancellation, not a failure worth reporting. */
function isAbortError(error: unknown): boolean {
    return (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
    )
}

/** Turns anything thrown by the loader into something worth showing a person. */
function describeError(error: unknown): string {
    if (isAbortError(error)) {
        return 'Loading was cancelled.'
    }
    if (error instanceof WaniKaniError) {
        if (error.status === 401) {
            return 'WaniKani rejected that token. Check it was copied in full and has not been revoked.'
        }
        if (error.status === 403) {
            return 'That token is missing a permission this page needs. Generate one with read access enabled.'
        }
        if (error.status === 429) {
            return 'WaniKani rate-limited the request. Wait a minute and try again.'
        }
        return error.message
    }
    if (error instanceof TypeError) {
        return 'Could not reach api.wanikani.com. Check your connection, or a content blocker may be blocking the request.'
    }
    return error instanceof Error ? error.message : 'Could not load your WaniKani data.'
}

export function useWanikaniStats(token: Ref<string | null>) {
    const dataset = ref<Dataset | null>(null)
    const stats = ref<WaniKaniStats | null>(null)
    const settings = ref<StudySettings>(loadSettings())
    const isLoading = ref(false)
    const isRefreshing = ref(false)
    const error = ref<string | null>(null)
    const progress = ref<LoadProgress>({ phase: 'idle', loaded: 0, total: 0, label: '' })

    /**
     * When this session last completed a load.
     *
     * Deliberately NOT `dataset.fetchedAt`: that value comes from the cache entry, so a
     * load that reuses a 20-minute-old progress snapshot would report "Data 20 minutes
     * ago" even though the summary and user were just re-read. This tracks the load the
     * visitor is actually looking at.
     */
    const loadedAt = ref<Date | null>(null)

    let controller: AbortController | null = null

    // Recomputing is pure and fast; re-fetching is neither. So a settings change simply
    // re-runs the engine over the data already in hand.
    watch(
        settings,
        (value) => {
            try {
                window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))
            } catch {
                // Storage can be unavailable; the session still works in memory.
            }
            if (dataset.value) {
                stats.value = computeStats(dataset.value, value, new Date())
            }
        },
        { deep: true },
    )

    /**
     * Identifies the newest load.
     *
     * Starting a load supersedes any load already in flight, and the superseded one must
     * go completely silent. Without this, setting a token (which synchronously triggers
     * the watcher) followed by an explicit `load()` races itself: the first request is
     * aborted, its `catch` still ran, and the visitor was shown the browser's internal
     * "signal is aborted without reason" instead of their data.
     */
    let loadId = 0

    async function load(options: { force?: boolean } = {}): Promise<void> {
        const active = token.value
        if (!active) {
            dataset.value = null
            stats.value = null
            return
        }

        const request = ++loadId

        controller?.abort()
        controller = new AbortController()

        if (options.force) {
            isRefreshing.value = true
        } else {
            isLoading.value = true
        }
        error.value = null

        try {
            const loaded = await loadDataset(active, {
                force: options.force,
                signal: controller.signal,
                onProgress: (update) => {
                    if (request === loadId) {
                        progress.value = update
                    }
                },
            })

            if (request !== loadId) {
                return
            }

            dataset.value = loaded
            stats.value = computeStats(loaded, settings.value, new Date())
            loadedAt.value = new Date()
            progress.value = { phase: 'done', loaded: 1, total: 1, label: 'Ready' }
        } catch (e) {
            // A superseded load reports nothing: its failure is not the visitor's problem.
            if (request !== loadId || isAbortError(e)) {
                return
            }
            error.value = describeError(e)
            stats.value = null
            dataset.value = null
        } finally {
            if (request === loadId) {
                isLoading.value = false
                isRefreshing.value = false
            }
        }
    }

    /*
     * Abandon any in-flight request on unmount.
     *
     * Without this a load that resolves after the page has gone still writes to the refs,
     * Vue tries to patch a DOM tree that no longer exists, and the result is an unhandled
     * "Cannot set properties of null" error rather than a clean teardown.
     */
    onBeforeUnmount(() => {
        loadId += 1
        controller?.abort()
    })

    /** Fetches only when the token changes to a new value. */
    watch(token, (value, previous) => {
        if (value && value !== previous) {
            void load()
        }
        if (!value) {
            dataset.value = null
            stats.value = null
            error.value = null
        }
    })

    return {
        stats,
        settings,
        isLoading,
        isRefreshing,
        error,
        progress,
        load,
        refresh: () => load({ force: true }),
        resetAssumptions: () => {
            settings.value = { ...DEFAULT_SETTINGS, isPanelOpen: settings.value.isPanelOpen }
        },
        loadedAt,
    }
}
