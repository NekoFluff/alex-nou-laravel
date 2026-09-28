/** Static WaniKani facts. Kept in one place so the UI never hardcodes magic numbers. */

export const MAX_LEVEL = 60

export const SRS_STAGE = {
  lesson: 0,
  apprentice1: 1,
  apprentice2: 2,
  apprentice3: 3,
  apprentice4: 4,
  guru1: 5,
  guru2: 6,
  master: 7,
  enlightened: 8,
  burned: 9,
} as const

export const SRS_STAGE_NAMES: Record<number, string> = {
  0: 'Lesson',
  1: 'Apprentice 1',
  2: 'Apprentice 2',
  3: 'Apprentice 3',
  4: 'Apprentice 4',
  5: 'Guru 1',
  6: 'Guru 2',
  7: 'Master',
  8: 'Enlightened',
  9: 'Burned',
}

/**
 * Official WaniKani palette. Guru deliberately changes hue between 1 and 2 so a
 * glance at a chart tells you whether an item is about to graduate or about to
 * come back in a week.
 */
export const SRS_STAGE_COLORS: Record<number, string> = {
  0: '#6b7280',
  1: '#dd0093',
  2: '#d94b8a',
  3: '#c56f94',
  4: '#ad8b9e',
  5: '#882d9e',
  6: '#294ddb',
  7: '#0093dd',
  8: '#489cc1',
  9: '#434343',
}

/** Groups used for headline numbers: "apprentice items" is what WaniKani shows you. */
export const SRS_GROUPS = [
  { key: 'lesson', label: 'Lessons', stages: [0], color: '#6b7280' },
  { key: 'apprentice', label: 'Apprentice', stages: [1, 2, 3, 4], color: '#dd0093' },
  { key: 'guru', label: 'Guru', stages: [5, 6], color: '#882d9e' },
  { key: 'master', label: 'Master', stages: [7], color: '#0093dd' },
  { key: 'enlightened', label: 'Enlightened', stages: [8], color: '#489cc1' },
  { key: 'burned', label: 'Burned', stages: [9], color: '#434343' },
] as const

export type SrsGroupKey = (typeof SRS_GROUPS)[number]['key']

export const SUBJECT_TYPE_LABELS = {
  radical: 'Radicals',
  kanji: 'Kanji',
  vocabulary: 'Vocabulary',
  kana_vocabulary: 'Kana Vocabulary',
} as const

export const SUBJECT_TYPE_COLORS = {
  radical: '#00aaff',
  kanji: '#ff00aa',
  vocabulary: '#aa00ff',
  kana_vocabulary: '#aa00ff',
} as const

/** Stages at which WaniKani considers an item "passed" — it stops showing up in lessons. */
export const PASSING_STAGE = 5

/** Enlightened is the last stop before an item can be burned. */
export const ENLIGHTENED_STAGE = 8

/**
 * A failed review at or above Guru drops the item four stages; below Guru it drops
 * one. WaniKani does not expose individual review outcomes, so this is only used to
 * explain attrition, never to assert what actually happened.
 */
export const GURU_STAGE_FAILURE_DROP = 4
