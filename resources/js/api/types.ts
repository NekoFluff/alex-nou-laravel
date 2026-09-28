/**
 * WaniKani API v2 record types (revision 20170710).
 *
 * Only the fields this dashboard actually consumes are modelled; the API returns
 * more than is listed here. Every interface mirrors the `data` object of a
 * record, not the surrounding envelope.
 */

export type SubjectType = 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary'

export interface Subscription {
  active: boolean
  type: 'free' | 'recurring' | 'lifetime' | 'unknown'
  max_level_granted: number
  period_ends_at: string | null
}

export interface User {
  id: string
  username: string
  level: number
  profile_url: string
  started_at: string
  subscription: Subscription
  current_vacation_started_at: string | null
}

export interface SummaryBucket {
  available_at: string
  subject_ids: number[]
}

/** `next_reviews_at` is null when the user has no reviews scheduled at all. */
export interface Summary {
  lessons: SummaryBucket[]
  reviews: SummaryBucket[]
  next_reviews_at: string | null
}

/**
 * SRS stage numbers run 0-9.
 * 0 = lesson not yet started, 1-4 = Apprentice, 5-6 = Guru, 7 = Master,
 * 8 = Enlightened, 9 = Burned. Names come from the spaced repetition system
 * metadata; `interval` is null for stages 0 and 9, which have no wait.
 */
export interface SpacedRepetitionStage {
  position: number
  interval: number | null
  /** A free string in practice; converted defensively by the engine. */
  interval_unit: string
}

export interface SpacedRepetitionSystem {
  id: number
  name: string
  description: string
  unlocking_stage_position: number
  starting_stage_position: number
  passing_stage_position: number
  burning_stage_position: number
  stages: SpacedRepetitionStage[]
}

export interface Assignment {
  /**
   * Envelope field carried onto the payload by `unwrapRecord`. It is the timestamp
   * of the last change to this assignment — i.e. the last time the item was
   * answered — which is the only per-day activity signal the API still exposes.
   */
  data_updated_at?: string
  created_at: string
  subject_id: number
  subject_type: SubjectType
  srs_stage: number
  /** Null for items that exist in the level but are still locked. */
  unlocked_at: string | null
  /** Set the moment the lesson is completed. This is the lesson counter. */
  started_at: string | null
  passed_at: string | null
  burned_at: string | null
  /** Next review time; null once burned or before the lesson is done. */
  available_at: string | null
  resurrected_at: string | null
  hidden: boolean
}

export interface ReviewStatistic {
  data_updated_at?: string
  created_at: string
  subject_id: number
  subject_type: SubjectType
  meaning_correct: number
  meaning_incorrect: number
  meaning_max_streak: number
  meaning_current_streak: number
  reading_correct: number
  reading_incorrect: number
  reading_max_streak: number
  reading_current_streak: number
  percentage_correct: number
  hidden: boolean
}

/**
 * A deliberate progress reset. Not part of the level timeline itself, but it is the
 * only explanation for duplicated level progressions and "progress went backwards"
 * gaps in level history.
 */
export interface Reset {
  data_updated_at?: string
  created_at: string
  original_level: number
  target_level: number
  confirmed_at: string | null
}

export interface LevelProgression {
  data_updated_at?: string
  created_at: string
  level: number
  unlocked_at: string | null
  started_at: string | null
  /** Set when the level's kanji are guru'd — this is when the level is "done". */
  passed_at: string | null
  /** Set only once every item of the level is burned, which lags by months. */
  completed_at: string | null
  abandoned_at: string | null
}

export interface Meaning {
  meaning: string
  primary: boolean
  accepted_answer: boolean
}

export interface AuxiliaryMeaning {
  meaning: string
  type: 'whitelist' | 'blacklist'
}

export interface Reading {
  reading: string
  primary: boolean
  accepted_answer: boolean
  type?: 'onyomi' | 'kunyomi' | 'nanori'
}

export interface CharacterImage {
  url: string
  content_type: string
  metadata: {
    inline_styles?: boolean
    color?: string
    dimensions?: string
    style_name?: string
  }
}

interface SubjectBase {
  /**
   * Envelope field carried onto the payload by `unwrapRecord`. Without it, every
   * lookup keyed on `subject.id` would collapse onto a single `undefined` entry.
   */
  id: number
  /** Envelope field carried onto the payload by `unwrapRecord`. */
  data_updated_at?: string
  /** Envelope field carried onto the payload by `unwrapRecord`; decides radical vs kanji. */
  object: SubjectType
  created_at: string
  level: number
  slug: string
  hidden_at: string | null
  document_url: string
  characters: string | null
  meanings: Meaning[]
  auxiliary_meanings: AuxiliaryMeaning[]
}

export interface Radical extends SubjectBase {
  object: 'radical'
  character_images: CharacterImage[]
  amalgamation_subject_ids: number[]
}

export interface Kanji extends SubjectBase {
  object: 'kanji'
  readings: Reading[]
  component_subject_ids: number[]
  amalgamation_subject_ids: number[]
  visually_similar_subject_ids: number[]
  meaning_mnemonic: string
  meaning_hint: string | null
  reading_mnemonic: string
  reading_hint: string | null
}

export interface Vocabulary extends SubjectBase {
  object: 'vocabulary' | 'kana_vocabulary'
  readings: Reading[]
  parts_of_speech: string[]
  component_subject_ids: number[]
  meaning_mnemonic: string
  reading_mnemonic: string
}

export type Subject = Radical | Kanji | Vocabulary

/** A flattened subject, which is all the stats engine needs to describe an item. */
export interface SubjectInfo {
  id: number
  type: SubjectType
  level: number
  characters: string | null
  slug: string
  primaryMeaning: string
  primaryReading: string | null
  /** Radical images are SVGs hosted by WaniKani and need no auth. */
  imageUrl: string | null
  /**
   * WaniKani's own page for this item.
   *
   * Taken from the API's `document_url` rather than assembled from the slug: the URL shape
   * differs per subject type (`/radicals/`, `/kanji/`, `/vocabulary/`) and kana vocabulary
   * lives under `/vocabulary/` in any case, so building it by hand invites a wrong link.
   */
  documentUrl: string | null
}

/**
 * The parts of a subject the stats engine reads, and therefore the only parts worth
 * caching.
 *
 * The API also sends mnemonics, context sentences, audio, component ids and lesson
 * positions. None of it is used here, and together those fields were **84% of the
 * catalogue** — 26.5 MB versus 4.2 MB for the real account this was built against.
 * Carrying them in IndexedDB risked a quota failure on every write, which meant the
 * catalogue could never be cached and every page refresh re-downloaded all 10 pages.
 *
 * Typing the cache as `SlimSubject[]` rather than `Subject[]` makes it impossible to
 * cache a field and then forget it was dropped.
 */
export type SlimSubject = Pick<
    Subject,
    'id' | 'object' | 'level' | 'slug' | 'characters' | 'hidden_at' | 'meanings' | 'document_url'
> & {
    /** Radicals only; every other type has none. */
    character_images?: CharacterImage[]
    /** Kanji and vocabulary only; radicals and kana vocabulary have no readings key. */
    readings?: Reading[]
}
