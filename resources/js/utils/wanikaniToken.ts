const TOKEN_KEY = 'wanikani:api_token';

/**
 * The personal API token never leaves the browser — it's read from and
 * written to localStorage only, and used solely for direct fetch() calls
 * from the client to api.wanikani.com. It is never sent to our backend.
 */
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
