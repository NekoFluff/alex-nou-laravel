/**
 * WaniKani stats engine.
 *
 * Turns a raw dataset into every number the dashboard shows. Everything here is a
 * pure function of its inputs, so the numbers can be tested against real account
 * data without a network or a browser.
 *
 * Modelling notes worth knowing before reading the maths:
 *
 * - `started_at` on an assignment is the moment the lesson was completed, so it is
 *   the lesson counter. Kana vocabulary has no lesson step in WaniKani, so it is
 *   excluded from lesson counts to avoid inflating time invested.
 * - WaniKani retired the historical `/reviews` endpoint, so a per-review log no
 *   longer exists. `review_statistics` gives per-item outcome counters instead, and
 *   `data_updated_at` on each assignment is the last time that item was answered —
 *   the closest available proxy for "when did I study". Both are lower bounds on
 *   true activity and are labelled as estimates in the UI.
 * - A level is "done" when its kanji are guru'd, which is what `passed_at` records
 *   on a level progression. `completed_at` only arrives once the whole level is
 *   burned, which lags by months, so it is never used for pace.
 */
import {
  ENLIGHTENED_STAGE,
  MAX_LEVEL,
  PASSING_STAGE,
  SRS_GROUPS,
  SRS_STAGE_COLORS,
  SRS_STAGE_NAMES,
  SUBJECT_TYPE_COLORS,
  SUBJECT_TYPE_LABELS,
} from './constants'
import { dayKey, formatInterval, startOfDay, toDate } from './format'
import type {
  AccuracyDetail,
  AssumptionMeta,
  LevelReset,
  BurnForecastPoint,
  CurrentLevelStatus,
  Dataset,
  ItemCounts,
  Leeches,
  LevelProgressRow,
  LevelTimeline,
  OutcomeTotals,
  Projection,
  ReviewForecastPoint,
  SrsBreakdown,
  SrsGroupBucket,
  SrsStageBucket,
  StudySettings,
  TimeInvested,
  WaniKaniStats,
  Workload,
} from './stats-types'
import type {
  Assignment,
  LevelProgression,
  ReviewStatistic,
  SpacedRepetitionSystem,
  Subject,
  SubjectInfo,
  SubjectType,
} from '@/api/types'

/**
 * Default pace assumptions.
 *
 * Twelve seconds per answer is deliberate rather than the more commonly quoted thirty:
 * this account's own review history implies a brisk pace, and its owner asked for it.
 * Both figures are adjustable at runtime in the Assumptions panel.
 */
export const DEFAULT_SETTINGS: StudySettings = {
  secondsPerReview: 12,
  minutesPerLesson: 1.5,
  isPanelOpen: false,
}

const MS_PER_DAY = 86_400_000
const MS_PER_HOUR = 3_600_000
/** Levels whose recent durations feed the pace estimate. */
const LEVELS_FOR_PACE = 8
/** Consecutive level-ups at or below this gap almost certainly include a reset. */
const SUSPICIOUS_GAP_DAYS = 0.25

/** Stage intervals in days, per the default spaced repetition system. */
const DEFAULT_STAGE_INTERVAL_DAYS: Record<number, number | null> = {
  0: null,
  1: 14_400 / 86_400,
  2: 28_800 / 86_400,
  3: 82_800 / 86_400,
  4: 169_200 / 86_400,
  5: 601_200 / 86_400,
  6: 1_206_000 / 86_400,
  7: 2_588_400 / 86_400,
  8: 10_364_400 / 86_400,
  9: null,
}

const SUBJECT_TYPE_ORDER: SubjectType[] = ['radical', 'kanji', 'vocabulary', 'kana_vocabulary']

function stageIntervals(srs?: SpacedRepetitionSystem | null): Record<number, number | null> {
  if (!srs) {
    return DEFAULT_STAGE_INTERVAL_DAYS
  }

  // `interval_unit` is a string, so convert defensively rather than assuming seconds.
  const unitSeconds: Record<string, number> = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86_400,
    weeks: 604_800,
  }

  const intervals: Record<number, number | null> = {}
  for (const stage of srs.stages) {
    if (stage.interval === null) {
      intervals[stage.position] = null
      continue
    }
    const factor = unitSeconds[stage.interval_unit] ?? 1
    intervals[stage.position] = (stage.interval * factor) / 86_400
  }
  return intervals
}

/**
 * How many answers one successful stage-up costs for a subject type.
 *
 * A kanji or vocabulary review quizzes meaning *and* reading; a radical quizzes
 * meaning only. Getting this wrong halves or doubles every remaining-time figure,
 * because invested time is counted per answer.
 */
export function answersPerStageUp(type: SubjectType): number {
  return type === 'kanji' || type === 'vocabulary' ? 2 : 1
}

/** Number of successful reviews still required to burn an item at this stage. */
export function reviewsToBurn(stage: number): number {
  if (stage >= 9) {
    return 0
  }
  if (stage <= 0) {
    return 7
  }
  // 9 is burned, and every intervening stage-up is one successful review.
  return 9 - stage
}

/** Flattens a subject record into the handful of fields the UI needs. */
function flattenSubject(subject: Subject): SubjectInfo {
  const primaryMeaning = subject.meanings.find((meaning) => meaning.primary)?.meaning ?? subject.slug
  const readings = 'readings' in subject ? subject.readings : []
  const primaryReading = readings.find((reading) => reading.primary)?.reading ?? null
  const images = 'character_images' in subject ? subject.character_images : []
  const svg = images.find((image) => image.content_type === 'image/svg+xml')

  return {
    id: subject.id,
    type: subject.object,
    level: subject.level,
    characters: subject.characters,
    slug: subject.slug,
    primaryMeaning,
    primaryReading,
    imageUrl: svg?.url ?? null,
    documentUrl: subject.document_url ?? null,
  }
}

function emptyCounts(): ItemCounts {
  return {
    total: 0,
    unlocked: 0,
    started: 0,
    passed: 0,
    burned: 0,
    apprentice: 0,
    enlightened: 0,
    locked: 0,
    hiddenSubjects: 0,
  }
}

function emptyOutcome(): OutcomeTotals {
  return { correct: 0, incorrect: 0, total: 0, accuracy: 100 }
}

function finalizeOutcome(totals: OutcomeTotals): OutcomeTotals {
  totals.total = totals.correct + totals.incorrect
  totals.accuracy = totals.total === 0 ? 100 : (totals.correct / totals.total) * 100
  return totals
}

function addOutcome(target: OutcomeTotals, stat: ReviewStatistic, includeReading: boolean): void {
  target.correct += stat.meaning_correct
  target.incorrect += stat.meaning_incorrect
  if (includeReading) {
    target.correct += stat.reading_correct
    target.incorrect += stat.reading_incorrect
  }
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Stages a burned-at date for an item, walking the remaining interval ladder. */
function projectBurnDate(
  availableAt: Date,
  stage: number,
  intervals: Record<number, number | null>,
): Date | null {
  if (stage >= 9) {
    return null
  }

  let cursor = availableAt.getTime()
  for (let next = Math.max(stage + 1, 1); next <= ENLIGHTENED_STAGE; next += 1) {
    const wait = intervals[next]
    if (wait === null || wait === undefined) {
      return null
    }
    cursor += wait * MS_PER_DAY
  }

  return new Date(cursor)
}

function countSubjectsForLevel(subjects: Subject[], level: number): number {
  return subjects.filter((subject) => subject.level === level && subject.hidden_at === null).length
}

export function computeStats(
  dataset: Dataset,
  settings: StudySettings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): WaniKaniStats {
  const { user, assignments, reviewStatistics, levelProgressions, subjects } = dataset
  const intervals = stageIntervals(dataset.spacedRepetitionSystem)
  const secondsPerReview = settings.secondsPerReview
  const msPerLesson = settings.minutesPerLesson * 60_000

  const assumptions: AssumptionMeta = {
    source:
      secondsPerReview === DEFAULT_SETTINGS.secondsPerReview &&
      settings.minutesPerLesson === DEFAULT_SETTINGS.minutesPerLesson
        ? 'assumed'
        : 'custom',
    secondsPerReview,
    minutesPerLesson: settings.minutesPerLesson,
  }

  const catalog = new Map<number, SubjectInfo>()
  const hiddenCatalog = new Set<number>()
  for (const subject of subjects) {
    if (subject.hidden_at !== null) {
      hiddenCatalog.add(subject.id)
      continue
    }
    catalog.set(subject.id, flattenSubject(subject))
  }

  const assignmentBySubject = new Map<number, Assignment>()
  for (const assignment of assignments) {
    assignmentBySubject.set(assignment.subject_id, assignment)
  }

  const statBySubject = new Map<number, ReviewStatistic>()
  for (const stat of reviewStatistics) {
    statBySubject.set(stat.subject_id, stat)
  }

  // ---------------------------------------------------------------- counts
  const counts = emptyCounts()
  const countsByTypeMap = new Map<SubjectType, ItemCounts>()
  for (const type of SUBJECT_TYPE_ORDER) {
    countsByTypeMap.set(type, emptyCounts())
  }

  let availableNow = 0
  let hiddenAssignments = 0

  for (const assignment of assignments) {
    if (assignment.hidden) {
      hiddenAssignments += 1
      continue
    }
    // Subjects can be hidden retroactively; their assignments linger in the API.
    if (hiddenCatalog.has(assignment.subject_id)) {
      counts.hiddenSubjects += 1
      continue
    }

    const typeCounts = countsByTypeMap.get(assignment.subject_type)
    for (const bucket of [counts, typeCounts]) {
      if (!bucket) {
        continue
      }
      bucket.unlocked += 1
      if (assignment.started_at) {
        bucket.started += 1
      }
      if (assignment.passed_at || assignment.srs_stage >= PASSING_STAGE) {
        bucket.passed += 1
      }
      if (assignment.burned_at || assignment.srs_stage >= 9) {
        bucket.burned += 1
      }
      if (assignment.srs_stage >= 1 && assignment.srs_stage <= 4) {
        bucket.apprentice += 1
      }
      if (assignment.srs_stage === ENLIGHTENED_STAGE) {
        bucket.enlightened += 1
      }
    }

    // `available_at` is the next scheduled review; anything at or before now is waiting.
    const availableAt = toDate(assignment.available_at)
    if (availableAt && availableAt.getTime() <= now.getTime()) {
      availableNow += 1
    }
  }

  for (const [subjectId, subject] of catalog) {
    counts.total += 1
    const typeCounts = countsByTypeMap.get(subject.type)
    if (typeCounts) {
      typeCounts.total += 1
    }
    if (!assignmentBySubject.has(subjectId)) {
      counts.locked += 1
      if (typeCounts) {
        typeCounts.locked += 1
      }
    }
  }
  // Hidden subjects still exist in the levels the user has already walked.
  counts.hiddenSubjects += hiddenCatalog.size

  const countsByType = SUBJECT_TYPE_ORDER.map((type) => ({
    type,
    label: SUBJECT_TYPE_LABELS[type],
    color: SUBJECT_TYPE_COLORS[type],
    counts: countsByTypeMap.get(type) ?? emptyCounts(),
  }))

  // ------------------------------------------------------- time invested
  let lessonsCompleted = 0
  let investedReviews = 0
  let reviewSessions = 0
  for (const assignment of assignments) {
    if (assignment.hidden || !assignment.started_at) {
      continue
    }
    if (assignment.subject_type === 'kana_vocabulary') {
      // Kana vocabulary is granted without a lesson screen.
      continue
    }
    lessonsCompleted += 1
  }
  const investedLessonMs = lessonsCompleted * msPerLesson

  const accuracy: AccuracyDetail = {
    overall: emptyOutcome(),
    meaning: emptyOutcome(),
    reading: emptyOutcome(),
    radical: emptyOutcome(),
    kanji: emptyOutcome(),
    vocabulary: emptyOutcome(),
    perfectItems: 0,
    perfectShare: 0,
    totalAnswers: 0,
  }

  let burnedItemAnswers = 0

  for (const stat of reviewStatistics) {
    if (stat.hidden) {
      continue
    }
    const hasReading = stat.subject_type === 'kanji' || stat.subject_type === 'vocabulary'

    const meaningAnswers = stat.meaning_correct + stat.meaning_incorrect
    const readingAnswers = hasReading ? stat.reading_correct + stat.reading_incorrect : 0
    const answers = meaningAnswers + readingAnswers
    const correctAnswers = stat.meaning_correct + (hasReading ? stat.reading_correct : 0)

    investedReviews += answers
    /*
     * Tallied separately so the per-burned-item average uses only these items. Folding
     * every answer on the account into that average drags in work on items that have not
     * burned yet — 53% of the total on the account this was measured against — and
     * overstated the figure by more than 2x.
     *
     * Note the asymmetry with the denominator: this counts answers only for items STILL at
     * stage 9, while `counts.burned` also includes resurrected items that have a burn date
     * but are back in circulation. Those belong in the denominator because they did burn,
     * but their recorded answers were spent on their current climb, not on the burn. The
     * effect is a slightly conservative average, which is the honest direction to err.
     */
    if ((assignmentBySubject.get(stat.subject_id)?.srs_stage ?? 0) >= 9) {
      burnedItemAnswers += answers
    }
    // Meaning and reading are quizzed together, so one sitting is at least as long as
    // the longer of the two. Taking the max avoids counting a sitting twice when a
    // failure sends both parts back to be re-answered.
    reviewSessions += hasReading
      ? Math.max(meaningAnswers, readingAnswers)
      : meaningAnswers

    addOutcome(accuracy.overall, stat, hasReading)
    accuracy.meaning.correct += stat.meaning_correct
    accuracy.meaning.incorrect += stat.meaning_incorrect
    if (hasReading) {
      accuracy.reading.correct += stat.reading_correct
      accuracy.reading.incorrect += stat.reading_incorrect
    }

    const typeOutcome = accuracy[stat.subject_type === 'kana_vocabulary' ? 'vocabulary' : stat.subject_type]
    addOutcome(typeOutcome, stat, hasReading)

    // Derived from the raw counts rather than trusting `percentage_correct`, which is
    // a rounded integer the API computes with an unguarded division.
    if (answers > 0 && correctAnswers === answers) {
      accuracy.perfectItems += 1
    }
  }

  finalizeOutcome(accuracy.overall)
  finalizeOutcome(accuracy.meaning)
  finalizeOutcome(accuracy.reading)
  finalizeOutcome(accuracy.radical)
  finalizeOutcome(accuracy.kanji)
  finalizeOutcome(accuracy.vocabulary)
  accuracy.totalAnswers = accuracy.overall.total
  const scoredItems = reviewStatistics.filter((stat) => !stat.hidden).length
  accuracy.perfectShare = scoredItems === 0 ? 0 : (accuracy.perfectItems / scoredItems) * 100

  const invested: TimeInvested = {
    lessonsMs: investedLessonMs,
    reviewsMs: investedReviews * secondsPerReview * 1000,
    lessonsCompleted,
    answersRecorded: investedReviews,
    reviewsSessions: reviewSessions,
    answersPerBurnedItem: counts.burned === 0 ? 0 : burnedItemAnswers / counts.burned,
    totalMs: investedLessonMs + investedReviews * secondsPerReview * 1000,
  }

  // ------------------------------------------------------------ workload
  let lessonsRemaining = 0
  let stageUpsRemaining = 0
  let answersRemaining = 0
  const reviewsRemainingByType = new Map<SubjectType, number>()
  const lessonsRemainingByType = new Map<SubjectType, number>()
  for (const type of SUBJECT_TYPE_ORDER) {
    reviewsRemainingByType.set(type, 0)
    lessonsRemainingByType.set(type, 0)
  }

  for (const assignment of assignments) {
    if (assignment.hidden || hiddenCatalog.has(assignment.subject_id)) {
      continue
    }
    const subject = catalog.get(assignment.subject_id)
    const type = subject?.type ?? assignment.subject_type

    if (!assignment.started_at && type !== 'kana_vocabulary') {
      lessonsRemaining += 1
      lessonsRemainingByType.set(type, (lessonsRemainingByType.get(type) ?? 0) + 1)
    }

    // `type` comes from the joined subject, because assignment payloads carry
    // `subject_type` but the catalogue is the authority on whether readings are quizzed.
    const required = reviewsToBurn(assignment.srs_stage)
    stageUpsRemaining += required
    answersRemaining += required * answersPerStageUp(type)
    reviewsRemainingByType.set(type, (reviewsRemainingByType.get(type) ?? 0) + required)
  }

  // Items the user has not unlocked yet still cost a full seven-step climb apiece.
  for (const [subjectId, subject] of catalog) {
    if (assignmentBySubject.has(subjectId)) {
      continue
    }
    stageUpsRemaining += 7
    answersRemaining += 7 * answersPerStageUp(subject.type)
    reviewsRemainingByType.set(subject.type, (reviewsRemainingByType.get(subject.type) ?? 0) + 7)
    if (subject.type !== 'kana_vocabulary') {
      lessonsRemaining += 1
      lessonsRemainingByType.set(subject.type, (lessonsRemainingByType.get(subject.type) ?? 0) + 1)
    }
  }

  // Time is computed from ANSWERS, matching how invested time is computed.
  const workload: Workload = {
    lessonsRemaining,
    stageUpsRemaining,
    answersRemaining,
    lessonsMs: lessonsRemaining * msPerLesson,
    reviewsMs: answersRemaining * secondsPerReview * 1000,
    totalMs: lessonsRemaining * msPerLesson + answersRemaining * secondsPerReview * 1000,
  }

  // ----------------------------------------------------------------- srs
  const stageCounts = new Map<number, number>()
  for (const assignment of assignments) {
    if (assignment.hidden || hiddenCatalog.has(assignment.subject_id)) {
      continue
    }
    stageCounts.set(assignment.srs_stage, (stageCounts.get(assignment.srs_stage) ?? 0) + 1)
  }

  const stages: SrsStageBucket[] = []
  for (let stage = 0; stage <= 9; stage += 1) {
    const intervalDays = intervals[stage] ?? null
    stages.push({
      stage,
      name: SRS_STAGE_NAMES[stage],
      color: SRS_STAGE_COLORS[stage],
      count: stageCounts.get(stage) ?? 0,
      intervalDays,
      nextReviewAt: null,
    })
  }

  const countGroup = (stages: readonly number[], countsFor: Map<number, number>): number =>
    stages.reduce<number>((sum, stage) => sum + (countsFor.get(stage) ?? 0), 0)

  const groups: SrsGroupBucket[] = SRS_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    color: group.color,
    count: countGroup(group.stages, stageCounts),
  }))

  const byType = SUBJECT_TYPE_ORDER.filter((type) => (countsByTypeMap.get(type)?.unlocked ?? 0) > 0).map(
    (type) => {
      const typeStageCounts = new Map<number, number>()
      for (const assignment of assignments) {
        if (assignment.hidden || assignment.subject_type !== type) {
          continue
        }
        typeStageCounts.set(assignment.srs_stage, (typeStageCounts.get(assignment.srs_stage) ?? 0) + 1)
      }
      return {
        type,
        label: SUBJECT_TYPE_LABELS[type],
        color: SUBJECT_TYPE_COLORS[type],
        groups: SRS_GROUPS.map((group) => ({
          key: group.key,
          label: group.label,
          color: group.color,
          count: countGroup(group.stages, typeStageCounts),
        })),
      }
    },
  )

  const srs: SrsBreakdown = { stages, groups, byType }

  // ------------------------------------------------------- review forecast
  const reviewForecast: ReviewForecastPoint[] = (dataset.summary?.reviews ?? [])
    .map((bucket) => ({
      hour: toDate(bucket.available_at),
      count: bucket.subject_ids.length,
    }))
    .filter((point): point is ReviewForecastPoint => point.hour !== null && point.count > 0)
    .sort((a, b) => a.hour.getTime() - b.hour.getTime())

  const lessonsAvailable = (dataset.summary?.lessons ?? []).reduce(
    (sum, bucket) => sum + bucket.subject_ids.length,
    0,
  )
  const nextReviewAt =
    toDate(dataset.summary?.next_reviews_at) ??
    reviewForecast.find((point) => point.hour.getTime() > now.getTime())?.hour ??
    null

  // --------------------------------------------------------- burn forecast
  // Only items already in rotation can be dated. Items still waiting on a lesson
  // have no schedule yet, so they are excluded rather than guessed at.
  const burnBuckets = new Map<string, BurnForecastPoint>()
  for (const assignment of assignments) {
    if (assignment.hidden || assignment.srs_stage >= 9 || assignment.srs_stage === 0) {
      continue
    }
    const availableAt = toDate(assignment.available_at)
    if (!availableAt) {
      continue
    }
    const burnAt = projectBurnDate(availableAt, assignment.srs_stage, intervals)
    if (!burnAt) {
      continue
    }

    const day = startOfDay(burnAt)
    const key = dayKey(day)
    const existing = burnBuckets.get(key)
    const stagesLeft = reviewsToBurn(assignment.srs_stage)
    if (existing) {
      existing.burnedCount += 1
      existing.subjectCount += 1
      existing.reviewMs += stagesLeft * secondsPerReview * 1000
    } else {
      burnBuckets.set(key, {
        day,
        burnedCount: 1,
        subjectCount: 1,
        reviewMs: stagesLeft * secondsPerReview * 1000,
      })
    }
  }
  const burnForecast = [...burnBuckets.values()].sort((a, b) => a.day.getTime() - b.day.getTime())

  // -------------------------------------------------------------- levels
  const progressionByLevel = new Map<number, LevelProgression>()
  for (const progression of levelProgressions) {
    const existing = progressionByLevel.get(progression.level)
    // Keep the most recent progression per level: resets create duplicates.
    if (!existing || progression.created_at > existing.created_at) {
      progressionByLevel.set(progression.level, progression)
    }
  }

  const currentLevel = user.level
  const rows: LevelProgressRow[] = []
  for (let level = 1; level <= MAX_LEVEL; level += 1) {
    const levelAssignments = assignments.filter((assignment) => {
      const subject = catalog.get(assignment.subject_id)
      return subject ? subject.level === level : false
    })
    const progression = progressionByLevel.get(level)
    const passedAt = toDate(progression?.passed_at)

    rows.push({
      level,
      isCurrent: level === currentLevel,
      isComplete: passedAt !== null,
      subjectCount: countSubjectsForLevel(subjects, level),
      unlocked: levelAssignments.length,
      started: levelAssignments.filter((assignment) => assignment.started_at !== null).length,
      passed: levelAssignments.filter(
        (assignment) => assignment.passed_at !== null || assignment.srs_stage >= PASSING_STAGE,
      ).length,
      burned: levelAssignments.filter((assignment) => assignment.srs_stage >= 9).length,
      daysSpent: null,
      passedAt,
      // Filled in below, once the pace is known.
      projectedPassAt: null,
    })
  }

  /**
   * Consecutive levels with a plausible gap. A reset makes WaniKani hand out a
   * fresh progression whose `passed_at` can predate the level above it, which would
   * otherwise produce a nonsense pace figure.
   */
  const recentDurations: Array<{ level: number; days: number }> = []
  for (let index = rows.length - 1; index > 0 && recentDurations.length < LEVELS_FOR_PACE; index -= 1) {
    const lower = rows[index - 1]
    const upper = rows[index]
    if (!lower.passedAt || !upper.passedAt) {
      continue
    }
    const days = (upper.passedAt.getTime() - lower.passedAt.getTime()) / MS_PER_DAY
    if (days <= SUSPICIOUS_GAP_DAYS) {
      continue
    }
    recentDurations.unshift({ level: upper.level, days })
  }

  for (const row of rows) {
    const progression = progressionByLevel.get(row.level)
    const startedAt = toDate(progression?.started_at)
    const endAt = row.passedAt ?? (row.isCurrent ? now : null)
    if (startedAt && endAt && endAt.getTime() > startedAt.getTime()) {
      row.daysSpent = (endAt.getTime() - startedAt.getTime()) / MS_PER_DAY
    }
  }

  const durationDays = recentDurations.map((entry) => entry.days)
  const medianLevelDays = median(durationDays)
  const averageLevelDays = mean(durationDays)

  const resets: LevelReset[] = (dataset.resets ?? [])
    .map((reset) => ({
      originalLevel: reset.original_level,
      targetLevel: reset.target_level,
      confirmedAt: toDate(reset.confirmed_at) ?? toDate(reset.created_at),
      affectsPace: false,
    }))
    .sort((a, b) => (a.confirmedAt?.getTime() ?? 0) - (b.confirmedAt?.getTime() ?? 0))

  // A reset inside the sampled window is what makes a consecutive-level gap suspect.
  const paceWindowStart = recentDurations.length
    ? Math.min(
        ...rows
          .filter((row) => recentDurations.some((entry) => entry.level === row.level))
          .map((row) => row.passedAt?.getTime() ?? Number.POSITIVE_INFINITY),
      )
    : Number.POSITIVE_INFINITY

  for (const reset of resets) {
    if (reset.confirmedAt && reset.confirmedAt.getTime() >= paceWindowStart) {
      reset.affectsPace = true
    }
  }

  const levels: LevelTimeline = {
    rows,
    currentLevel,
    recentDurations,
    averageLevelDays,
    medianLevelDays,
    resets,
    hasResets: resets.length > 0,
  }

  // -------------------------------------------------------------- leeches
  const leechItems: Leeches['items'] = []
  for (const stat of reviewStatistics) {
    if (stat.hidden) {
      continue
    }
    const assignment = assignmentBySubject.get(stat.subject_id)
    const subject = catalog.get(stat.subject_id)
    if (!assignment || !subject) {
      continue
    }
    // Burned items are done, and a stage-0 item has not had its lesson yet, so
    // neither can be a leech. Everything in between can, including Guru and Master
    // items that keep slipping back down.
    if (assignment.srs_stage >= 9 || assignment.srs_stage === 0) {
      continue
    }

    const incorrect = stat.meaning_incorrect + stat.reading_incorrect
    if (incorrect < 4) {
      continue
    }

    const correct = stat.meaning_correct + stat.reading_correct
    const attempts = correct + incorrect
    const currentStreak = Math.max(stat.meaning_current_streak, stat.reading_current_streak)
    const maxStreak = Math.max(stat.meaning_max_streak, stat.reading_max_streak)

    leechItems.push({
      subjectId: stat.subject_id,
      characters: subject.characters,
      primaryMeaning: subject.primaryMeaning,
      type: subject.type,
      level: subject.level,
      imageUrl: subject.imageUrl,
      documentUrl: subject.documentUrl,
      srsStage: assignment.srs_stage,
      srsStageName: SRS_STAGE_NAMES[assignment.srs_stage] ?? `Stage ${assignment.srs_stage}`,
      incorrect,
      correct,
      accuracy: attempts === 0 ? 0 : (correct / attempts) * 100,
      currentStreak,
      maxStreak,
      // Weighted by how many successful reviews are still owed, so a heavily missed
      // Enlightened item does not outrank a hopeless Apprentice one.
      score: incorrect * (9 - assignment.srs_stage),
    })
  }
  leechItems.sort((a, b) => b.score - a.score || b.incorrect - a.incorrect)

  const leeches: Leeches = { count: leechItems.length, items: leechItems.slice(0, 25) }

  // ----------------------------------------------------------- projection
  const daysPerLevel = medianLevelDays > 0 ? medianLevelDays : averageLevelDays

  /*
   * Date each unfinished level.
   *
   * Levels ahead are walked one median level at a time, so the whole ladder stays
   * consistent with the single finish date the dashboard already shows — level 60 lands on
   * the same day either way. The current level is projected from the remainder of a typical
   * level rather than from a whole one, because part of it is already behind you. Levels
   * before the current one that were never passed (a reset leaves these) are left blank
   * rather than given a date in the past.
   */
  if (daysPerLevel > 0) {
    const currentRow = rows.find((row) => row.level === currentLevel)
    const daysIntoCurrent = Math.max(0, Math.min(daysPerLevel, currentRow?.daysSpent ?? 0))
    let cursor = Math.max(0, daysPerLevel - daysIntoCurrent)

    for (const row of rows) {
      if (row.passedAt || row.level <= currentLevel) {
        continue
      }
      cursor += daysPerLevel
      row.projectedPassAt = new Date(now.getTime() + cursor * MS_PER_DAY)
    }

    // The current level finishes the remainder of one typical level.
    if (currentRow && !currentRow.passedAt) {
      currentRow.projectedPassAt = new Date(
        now.getTime() + Math.max(0, daysPerLevel - daysIntoCurrent) * MS_PER_DAY,
      )
    }
  }
  const levelsRemaining = Math.max(0, MAX_LEVEL - currentLevel)
  const hoursRemaining = workload.reviewsMs / MS_PER_HOUR + workload.lessonsMs / MS_PER_HOUR
  const totalCurriculumMs = invested.totalMs + workload.totalMs

  /*
   * The finish date is the last projected level date rather than its own arithmetic, so the
   * headline date and the per-level dates in the level history can never disagree. Walked
   * independently they drifted by a few days, because one credited the part of the current
   * level already behind you and the other did not.
   */
  const finalProjected = [...rows]
    .reverse()
    .find((row) => row.projectedPassAt !== null)?.projectedPassAt

  const etaByLevelPace =
    levelsRemaining === 0 ? now : (finalProjected ?? (daysPerLevel > 0 ? new Date(now.getTime() + levelsRemaining * daysPerLevel * MS_PER_DAY) : null))

  const projection: Projection = {
    daysPerLevel,
    sampleSize: recentDurations.length,
    levelsRemaining,
    hoursRemaining,
    etaByLevelPace,
    totalCurriculumMs,
  }

  // -------------------------------------------------------- current level
  const currentLevelSubjects = subjects.filter(
    (subject) => subject.level === currentLevel && subject.hidden_at === null,
  )
  const passedStageFor = (subjectId: number): boolean => {
    const assignment = assignmentBySubject.get(subjectId)
    return Boolean(assignment && (assignment.passed_at || assignment.srs_stage >= PASSING_STAGE))
  }
  const countByType = (type: SubjectType): { total: number; passed: number } => {
    const matching = currentLevelSubjects.filter((subject) => subject.object === type)
    return {
      total: matching.length,
      passed: matching.filter((subject) => passedStageFor(subject.id)).length,
    }
  }

  const kanji = countByType('kanji')
  const radicals = countByType('radical')
  const vocabulary = countByType('vocabulary')
  const progression = progressionByLevel.get(currentLevel)
  const levelStartedAt = toDate(progression?.started_at)

  const currentLevelStatus: CurrentLevelStatus = {
    level: currentLevel,
    startedAt: levelStartedAt,
    daysOnLevel: levelStartedAt ? (now.getTime() - levelStartedAt.getTime()) / MS_PER_DAY : 0,
    kanjiTotal: kanji.total,
    kanjiPassed: kanji.passed,
    radicalsTotal: radicals.total,
    radicalsPassed: radicals.passed,
    vocabularyTotal: vocabulary.total,
    vocabularyPassed: vocabulary.passed,
    progress: kanji.total === 0 ? 100 : (kanji.passed / kanji.total) * 100,
    isComplete: kanji.total > 0 && kanji.passed === kanji.total,
  }

  const curriculumProgress =
    counts.total === 0 ? 0 : (counts.unlocked / counts.total) * 100

  return {
    generatedAt: now,
    assumptions,
    counts,
    curriculumProgress,
    countsByType,
    invested,
    workload,
    projection,
    srs,
    burnForecast,
    reviewForecast,
    levels,
    leeches,
    accuracy,
    currentLevel: currentLevelStatus,
    availableNow,
    nextReviewAt,
    lessonsAvailable,
  }
}

/** Exported for the assumptions panel so it can explain what a raw interval means. */
export function describeStageInterval(intervalDays: number | null): string {
  return formatInterval(intervalDays === null ? null : intervalDays * 86_400)
}
