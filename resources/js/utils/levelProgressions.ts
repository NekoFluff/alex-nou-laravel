/**
 * WaniKani never deletes level progressions: after an account reset it keeps the
 * levels from every previous run alongside the current one, and marks the level
 * the user was on when they reset as abandoned. The levels unlocked after the
 * most recently abandoned progression are the user's current run.
 *
 * Without this, a personal token exposes a history full of duplicate levels and
 * the "current level" is reported as the user's all-time high instead of where
 * they actually are.
 */
type ProgressionsWithTimestamps = {
    level: number;
    created_at?: string | Date | null;
    unlocked_at?: string | Date | null;
    abandoned_at?: string | Date | null;
};

const unlockedAt = (progression: ProgressionsWithTimestamps): number => {
    const value = progression.unlocked_at ?? progression.created_at;
    const time = value ? new Date(value).getTime() : Number.NaN;

    return Number.isNaN(time) ? 0 : time;
};

export const selectCurrentLevelProgressions = <T extends ProgressionsWithTimestamps>(progressions: T[]): T[] => {
    const chronological = [...progressions].sort((a, b) => unlockedAt(a) - unlockedAt(b));

    let runStart = 0;
    chronological.forEach((progression, index) => {
        if (progression.abandoned_at) {
            runStart = index + 1;
        }
    });

    return chronological.slice(runStart).sort((a, b) => a.level - b.level);
};
