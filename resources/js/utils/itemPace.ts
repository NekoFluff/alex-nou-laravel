/**
 * Estimated days to clear a level's lessons (radicals + kanji + vocabulary)
 * at a given items-per-day pace.
 */
export const daysForLevel = (
    level: number,
    itemCountsByLevel: Record<number, number>,
    itemsPerDay: number,
    fallbackDays: number,
): number => {
    const itemCount = itemCountsByLevel[level];
    if (!itemCount) return fallbackDays;
    return Math.ceil(itemCount / itemsPerDay);
};
