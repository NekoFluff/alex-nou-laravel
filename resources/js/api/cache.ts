/**
 * Persistent cache backed by IndexedDB.
 *
 * A full account is several megabytes (this one is ~5,800 assignments and ~9,400
 * subjects), which is too large for localStorage and far too slow to re-download on
 * every page load. Records are stored per key with a timestamp so each can expire
 * independently: user progress changes constantly, the subject catalog barely moves.
 */

const DB_NAME = 'wanikani-stats'
const STORE_NAME = 'cache'
const DB_VERSION = 1

interface CacheEntry<T> {
  key: string
  value: T
  storedAt: number
}

export const CACHE_TTL = {
  /** User progress: refresh on demand, but do not silently re-fetch on every load. */
  progress: 30 * 60 * 1000,
  /** The subject catalog changes only when WaniKani adds content. */
  catalog: 7 * 24 * 60 * 60 * 1000,
} as const

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    // Private browsing and hardened profiles can refuse IndexedDB. Callers degrade to
    // an uncached load and `writeCache` reports it, rather than failing silently.
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
}

export async function readCache<T>(key: string): Promise<{ value: T; storedAt: number; ageMs: number } | null> {
  const database = await openDatabase()
  if (!database) {
    return null
  }

  try {
    return await new Promise<{ value: T; storedAt: number; ageMs: number } | null>((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(key)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined
        if (!entry) {
          resolve(null)
          return
        }
        resolve({ value: entry.value, storedAt: entry.storedAt, ageMs: Date.now() - entry.storedAt })
      }
      request.onerror = () => resolve(null)
    })
  } finally {
    database.close()
  }
}

/**
 * Writes a cache entry.
 *
 * Failures are reported rather than swallowed. They used to be silent, and since a
 * missing cache is indistinguishable from a stale one, the only visible symptom was the
 * subject catalogue being re-downloaded on every page load — which is exactly how this
 * was reported. Storage pressure, private browsing and a revoked permission all land
 * here.
 */
export async function writeCache<T>(key: string, value: T): Promise<void> {
  await requestPersistence()

  const database = await openDatabase()
  if (!database) {
    console.warn(
      `[wanikani-stats] IndexedDB unavailable, so "${key}" cannot be cached. Expect slower loads.`,
    )
    return
  }

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const entry: CacheEntry<T> = { key, value, storedAt: Date.now() }
    transaction.objectStore(STORE_NAME).put(entry)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => {
      console.warn(`[wanikani-stats] Failed to cache "${key}": ${transaction.error?.message ?? 'unknown error'}`)
      resolve()
    }
    transaction.onabort = () => {
      console.warn(`[wanikani-stats] Cache write for "${key}" was aborted: ${transaction.error?.message ?? 'unknown error'}`)
      resolve()
    }
  })

  database.close()
}

export async function clearCache(): Promise<void> {
  const database = await openDatabase()
  if (!database) {
    return
  }

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
    transaction.onabort = () => resolve()
  })

  database.close()
}

/**
 * Asks the browser to keep this origin's storage.
 *
 * Without it, IndexedDB is "best effort": a browser under storage pressure may evict it,
 * and because a failed cache write is invisible, the only symptom is the catalogue being
 * re-downloaded on every visit. Requested once, lazily, and never awaited by callers —
 * a refusal is not an error, it just means the cache may not survive.
 */
let persistenceRequested = false

async function requestPersistence(): Promise<void> {
  if (persistenceRequested || typeof navigator === 'undefined') {
    return
  }
  persistenceRequested = true
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Unsupported or denied; nothing to do.
  }
}

/** Cache keys are namespaced per account so switching tokens never mixes data. */
export const cacheKeys = {
  progress: (userId: string) => `progress:${userId}`,
  catalog: (revision: string) => `catalog:${revision}`,
}
