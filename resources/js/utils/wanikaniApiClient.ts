import { LevelProgression } from '@/types/levelProgression';
import { selectCurrentLevelProgressions } from '@/utils/levelProgressions';

/**
 * Talks to api.wanikani.com directly from the browser using a user-supplied
 * personal access token, so the token is never transmitted to our backend.
 * WaniKani's API sends `access-control-allow-origin: *`, so browser fetch()
 * calls are permitted.
 */

const BASE_URL = 'https://api.wanikani.com/v2/';
const ITEM_COUNTS_CACHE_KEY = 'wanikani:item_counts_cache_v1';
const ITEM_COUNTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class WanikaniApiError extends Error {
    constructor(
        message: string,
        public status?: number,
    ) {
        super(message);
        this.name = 'WanikaniApiError';
    }
}

interface WanikaniPage<T> {
    data: T[];
    pages: { next_url: string | null };
}

const authedFetch = async (url: string, token: string): Promise<Response> => {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
        throw new WanikaniApiError('That API token was rejected by WaniKani. Double-check it and try again.', 401);
    }
    if (!response.ok) {
        throw new WanikaniApiError(`WaniKani API request failed (${response.status}).`, response.status);
    }

    return response;
};

const fetchAllPages = async <T>(startUrl: string, token: string): Promise<T[]> => {
    const results: T[] = [];
    let url: string | null = startUrl;

    while (url) {
        const response = await authedFetch(url, token);
        const page = (await response.json()) as WanikaniPage<T>;
        results.push(...page.data);
        url = page.pages?.next_url ?? null;
    }

    return results;
};

export const fetchLevelProgressions = async (token: string): Promise<LevelProgression[]> => {
    const raw = await fetchAllPages<{ data: LevelProgression }>(`${BASE_URL}level_progressions`, token);
    return selectCurrentLevelProgressions(raw.map((entry) => entry.data));
};

/**
 * Subject item counts are the same for every WaniKani user, so once fetched
 * (a token is still required — the endpoint is authenticated) they're
 * cached in localStorage for a day, mirroring the server-side cache TTL.
 */
export const fetchItemCountsByLevel = async (token: string): Promise<Record<number, number>> => {
    try {
        const cached = window.localStorage.getItem(ITEM_COUNTS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as { data: Record<number, number>; fetchedAt: number };
            if (Date.now() - parsed.fetchedAt < ITEM_COUNTS_CACHE_TTL_MS) {
                return parsed.data;
            }
        }
    } catch {
        // corrupt/unavailable cache — fall through to a fresh fetch
    }

    const raw = await fetchAllPages<{ data: { level: number } }>(
        `${BASE_URL}subjects?types=radical,kanji,vocabulary`,
        token,
    );

    const countsByLevel: Record<number, number> = {};
    for (const subject of raw) {
        const level = subject.data.level;
        countsByLevel[level] = (countsByLevel[level] ?? 0) + 1;
    }

    try {
        window.localStorage.setItem(
            ITEM_COUNTS_CACHE_KEY,
            JSON.stringify({ data: countsByLevel, fetchedAt: Date.now() }),
        );
    } catch {
        // ignore cache write failures
    }

    return countsByLevel;
};
