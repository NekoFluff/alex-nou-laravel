const TOKEN_KEY = 'wanikani:api_token';

/**
 * How the client reaches api.wanikani.com.
 *
 * 'direct' calls the API from the browser, which works because WaniKani sends
 * `access-control-allow-origin: *` and keeps the token on the user's machine.
 * 'proxy' routes through the Vite dev server instead, for the rare case where an
 * extension or network policy interferes with a cross-origin call.
 */
export const API_MODE: 'direct' | 'proxy' = 'direct';

/**
 * A WaniKani personal access token is a lowercase UUID. Checking the shape locally
 * catches a truncated paste before it becomes a confusing 401.
 *
 * Note the promise the functions below keep: the personal token never leaves the browser.
 * It is read from and written to localStorage only, and used solely for direct fetch()
 * calls from the client to api.wanikani.com — never sent to this app's backend.
 */
export const looksLikeToken = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());

export const getStoredToken = (): string | null => {
    try {
        return window.localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

export const setStoredToken = (token: string): void => {
    try {
        window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
        // localStorage unavailable (private browsing, disabled storage, etc.) — token just won't persist.
    }
};

export const clearStoredToken = (): void => {
    try {
        window.localStorage.removeItem(TOKEN_KEY);
    } catch {
        // ignore
    }
};

/**
 * Deep link to WaniKani's token page.
 *
 * No scope identifiers are appended: WaniKani does not publish scope names anywhere, and
 * a token created with default permissions can already read every endpoint this page
 * uses. Write access is a separate opt-in that is never needed here.
 */
export const tokenCreationUrl = (): string =>
    'https://www.wanikani.com/settings/personal_access_tokens';

/**
 * A read-only token compiled into the bundle so the page shows this account by default.
 *
 * SECURITY: anything prefixed `VITE_` is inlined into the JavaScript at build time, so
 * this value is downloadable by anyone who opens the page. It is deliberately a
 * read-only token — it cannot change anything on the account — but it does expose that
 * account's full study history, accuracy and leech list. Regenerating the token in
 * WaniKani instantly invalidates the copy baked in here.
 *
 * It lives in `.env` rather than as a literal in a component so the secret is not in the
 * repository, and so the fallback can be removed by clearing one environment variable.
 */
export const getBakedInToken = (): string | null => {
    const value = import.meta.env.VITE_WANIKANI_API_KEY?.trim();
    return value && looksLikeToken(value) ? value : null;
};
