/**
 * Shape of everything the dashboard renders.
 *
 * The engine is intentionally pure: `WaniKaniDataset` in, `WaniKaniStats` out.
 * That keeps the maths testable without a browser, a network, or a clock.
 */
import type {
  Assignment,
  LevelProgression,
  Reset,
  ReviewStatistic,
  SpacedRepetitionSystem,
  Subject,
  SubjectType,
  Summary,
  User,
} from '@/api/types'

export interface Dataset {
  user: User
  summary: Summary
  assignments: Assignment[]
  reviewStatistics: ReviewStatistic[]
  levelProgressions: LevelProgression[]
  subjects: Subject[]
  resets?: Reset[]
  spacedRepetitionSystem?: SpacedRepetitionSystem | null
  /** When the data was retrieved, used for cache-age messaging. */
  fetchedAt?: string | null
}

export interface StudySettings {
  /** Seconds spent per review (each meaning/reading answer). Default 30. */
  secondsPerReview: number
  /** Minutes spent per lesson. Default 1.5. */
  minutesPerLesson: number
  /** Whether the assumptions panel is expanded. Purely cosmetic. */
  isPanelOpen: boolean
}

export interface AssumptionMeta {
  /** "assumed" when the user is on default numbers, "custom" once they change them. */
  source: 'assumed' | 'custom'
  secondsPerReview: number
  minutesPerLesson: number
}

export interface OutcomeTotals {
  correct: number
  incorrect: number
  total: number
  accuracy: number
}

export interface ItemCounts {
  total: number
  unlocked: number
  started: number
  passed: number
  burned: number
  apprentice: number
  enlightened: number
  /** Not yet unlocked: subject exists in the catalog but has no assignment. */
  locked: number
  /** Subjects WaniKani has retroactively hidden; excluded from totals. */
  hiddenSubjects: number
}

export interface TimeInvested {
  totalMs: number
  lessonsMs: number
  reviewsMs: number
  lessonsCompleted: number
  /**
   * Individual meaning/reading answers. This is the exact quantity the API reports and
   * the correct basis for time, because each answer is answered separately.
   */
  answersRecorded: number
  /**
   * Distinct review sittings: how many times an item appeared in a review queue.
   * A kanji or vocabulary review quizzes meaning and reading together, so this is
   * roughly half of `answersRecorded` and is the figure a learner actually thinks of
   * as "my number of reviews".
   */
  reviewsSessions: number
  /**
   * Mean answers spent on an item that reached burned.
   *
   * Computed over ONLY the answers belonging to burned items, which is the whole point:
   * dividing every answer on the account by the burned count mixes two populations and
   * overstated this figure by more than 2x on the account this was built against.
   *
   * A flawless climb is 7 stage-ups x 2 answers = 14, so anything above that is
   * corrections and repeated reviews. Zero when nothing has burned.
   */
  answersPerBurnedItem: number
}

export interface Workload {
  lessonsRemaining: number
  /**
   * Successful reviews still owed, counted in *stage-ups*. This is the number a
   * learner thinks of as "reviews left", and it is what the burn forecast is built
   * from. It is NOT the unit time is measured in — see `answersRemaining`.
   */
  stageUpsRemaining: number
  /**
   * The same workload counted in answers (one per meaning, one per reading), which is
   * the unit `invested.answersRecorded` uses and therefore the only unit that can be
   * multiplied by a per-answer time. For a kanji or vocabulary item one stage-up costs
   * two answers; for a radical, one.
   */
  answersRemaining: number
  lessonsMs: number
  reviewsMs: number
  totalMs: number
}

export interface Projection {
  /** Days per level, derived from how fast recent levels actually went. */
  daysPerLevel: number
  sampleSize: number
  levelsRemaining: number
  /** Remaining study hours at the user's own review rate. */
  hoursRemaining: number
  /**
   * Finish date from the user's own level pace. This is the only ETA the dashboard
   * presents: an alternative "remaining hours divided by observed study time" estimate
   * used to be shown alongside it, but it was derived from the per-day activity proxy,
   * which cannot be trusted (see the README).
   */
  etaByLevelPace: Date | null
  /** Whole-curriculum hours: everything from level 1 to 60 for this user's settings. */
  totalCurriculumMs: number
}

export interface SrsStageBucket {
  stage: number
  name: string
  color: string
  count: number
  /** Mean days an item sits at this stage before moving on. */
  intervalDays: number | null
  nextReviewAt: Date | null
}

export interface SrsGroupBucket {
  key: string
  label: string
  color: string
  count: number
}

export interface SrsBreakdown {
  /** All assignments, including items still waiting on their lesson. */
  stages: SrsStageBucket[]
  groups: SrsGroupBucket[]
  byType: Array<{ type: SubjectType; label: string; color: string; groups: SrsGroupBucket[] }>
}

export interface BurnForecastPoint {
  day: Date
  burnedCount: number
  subjectCount: number
  reviewMs: number
}

export interface ReviewForecastPoint {
  hour: Date
  count: number
}

export interface LevelProgressRow {
  level: number
  isCurrent: boolean
  isComplete: boolean
  subjectCount: number
  unlocked: number
  started: number
  passed: number
  burned: number
  /** Days spent on this level, or null while it is in progress. */
  daysSpent: number | null
  /** When the level was actually passed. Null until then. */
  passedAt: Date | null
  /**
   * When this level is expected to be passed, at the account's measured pace.
   *
   * Null once `passedAt` is set — the actual date supersedes any projection — and null for
   * levels far ahead when there is no usable pace to project from.
   */
  projectedPassAt: Date | null
}

export interface LevelReset {
  originalLevel: number
  targetLevel: number
  confirmedAt: Date | null
  /** True when the reset landed inside the window used for the pace estimate. */
  affectsPace: boolean
}

export interface LevelTimeline {
  rows: LevelProgressRow[]
  currentLevel: number
  /** Days the account sat on each recent level; the basis for the pace estimate. */
  recentDurations: Array<{ level: number; days: number }>
  averageLevelDays: number
  medianLevelDays: number
  /** Progress resets, which are why level history is not always monotonic. */
  resets: LevelReset[]
  hasResets: boolean
}

export interface Leeches {
  count: number
  items: Array<{
    subjectId: number
    characters: string | null
    primaryMeaning: string
    type: SubjectType
    level: number
    imageUrl: string | null
    /** WaniKani's own page for the item, so a row can be opened for study. */
    documentUrl: string | null
    srsStage: number
    srsStageName: string
    incorrect: number
    correct: number
    accuracy: number
    currentStreak: number
    maxStreak: number
    score: number
  }>
}

export interface AccuracyDetail {
  overall: OutcomeTotals
  meaning: OutcomeTotals
  reading: OutcomeTotals
  radical: OutcomeTotals
  kanji: OutcomeTotals
  vocabulary: OutcomeTotals
  /** Items with a perfect record — the encouraging number. */
  perfectItems: number
  perfectShare: number
  /** Sum of all recorded correct/incorrect answers. */
  totalAnswers: number
}

export interface CurrentLevelStatus {
  level: number
  startedAt: Date | null
  daysOnLevel: number
  kanjiTotal: number
  kanjiPassed: number
  radicalsTotal: number
  radicalsPassed: number
  vocabularyTotal: number
  vocabularyPassed: number
  /** Kanji are what actually gate a level-up. */
  progress: number
  isComplete: boolean
}

export interface WaniKaniStats {
  generatedAt: Date
  assumptions: AssumptionMeta
  counts: ItemCounts
  /**
   * How far through the course you are, as the share of the catalogue unlocked.
   *
   * Defined by items rather than hours on purpose. Hours measure workload, not progress:
   * a slower reading pace would make the same progress report a smaller percentage, and
   * the denominator is a modelled estimate. Items are counted, not estimated.
   */
  curriculumProgress: number
  countsByType: Array<{ type: SubjectType; label: string; counts: ItemCounts }>
  invested: TimeInvested
  workload: Workload
  projection: Projection
  srs: SrsBreakdown
  burnForecast: BurnForecastPoint[]
  reviewForecast: ReviewForecastPoint[]
  levels: LevelTimeline
  leeches: Leeches
  accuracy: AccuracyDetail
  currentLevel: CurrentLevelStatus
  /** Items whose review is due right now. */
  availableNow: number
  nextReviewAt: Date | null
  lessonsAvailable: number
}
