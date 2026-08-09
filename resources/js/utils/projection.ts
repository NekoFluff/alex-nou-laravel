import { LevelProgression } from '@/types/levelProgression';
import { ProjectionMode } from '@/types/projectionMode';
import { diffDays } from '@/utils/date';
import { average, median } from '@/utils/pace';
import { daysForLevel } from '@/utils/itemPace';

export interface PaceContext {
    medianPace: number | null;
    averagePace: number | null;
    goalDays: number;
    itemsPerDay: number;
    itemCountsByLevel: Record<number, number>;
}

const completedDurations = (levelProgressions: LevelProgression[]): number[] =>
    levelProgressions
        .filter((lp) => lp.started_at && lp.passed_at)
        .sort((a, b) => a.level - b.level)
        .map((lp) => diffDays(lp.started_at, lp.passed_at));

export const buildPaceContext = (
    levelProgressions: LevelProgression[],
    goalDays: number,
    itemsPerDay: number,
    itemCountsByLevel: Record<number, number>,
    recentCount = 10,
): PaceContext => {
    const durations = completedDurations(levelProgressions);
    const rawAverage = average(durations.slice(-recentCount));
    return {
        medianPace: median(durations),
        averagePace: rawAverage === null ? null : Math.round(rawAverage * 10) / 10,
        goalDays,
        itemsPerDay,
        itemCountsByLevel,
    };
};

/** Estimated days to complete a given level under the given pace mode. */
export const paceForLevel = (level: number, mode: ProjectionMode, ctx: PaceContext): number => {
    const fallback = ctx.medianPace ?? ctx.goalDays;
    switch (mode) {
        case 'items':
            return daysForLevel(level, ctx.itemCountsByLevel, ctx.itemsPerDay, fallback);
        case 'goal':
            return ctx.goalDays;
        case 'average':
            return ctx.averagePace ?? fallback;
        case 'median':
        default:
            return ctx.medianPace ?? fallback;
    }
};
