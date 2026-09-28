/**
 * Colours for the stats UI.
 *
 * Tailwind class names cannot be built dynamically (`text-${color}-600` is invisible to
 * the compiler), so every colour that depends on data lives here as a literal and is
 * applied through inline styles.
 *
 * The SRS ramp is WaniKani's own: it is what the site uses for stage chips, and it is
 * legible on a light background without adjustment.
 */

export const SRS_PALETTE: Record<number, string> = {
    0: '#6b7280',
    1: '#dd0093',
    2: '#d94b8a',
    3: '#c56f94',
    4: '#ad8b9e',
    5: '#882d9e',
    6: '#294ddb',
    7: '#0093dd',
    8: '#489cc1',
    9: '#4b5563',
}

export const SUBJECT_PALETTE = {
    radical: '#00aaff',
    kanji: '#ff00aa',
    vocabulary: '#aa00ff',
    kana_vocabulary: '#aa00ff',
} as const

/** Neutrals and accents matched to the site's existing Tailwind palette. */
export const UI_PALETTE = {
    indigo: '#6366f1',
    indigoSoft: '#eef2ff',
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
    slate900: '#111827',
    slate700: '#374151',
    slate600: '#4b5563',
    slate500: '#6b7280',
    slate400: '#9ca3af',
    slate300: '#d1d5db',
    slate200: '#e5e7eb',
    slate100: '#f3f4f6',
    slate50: '#f9fafb',
    white: '#ffffff',
} as const

/**
 * Picks a red/amber/green tone for a percentage, so a glance at a bar reads as a
 * verdict rather than a number.
 */
export function toneForPercent(value: number): string {
    if (value >= 90) {
        return UI_PALETTE.green
    }
    if (value >= 80) {
        return UI_PALETTE.amber
    }
    return UI_PALETTE.red
}
