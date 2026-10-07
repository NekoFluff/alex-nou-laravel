/**
 * Engine tests against a hand-built dataset.
 *
 * Every expected number here is computed by hand in the comments, so a regression in
 * the maths fails loudly rather than silently shifting a dashboard figure.
 */
import { describe, expect, it } from 'vitest'
import { computeStats, DEFAULT_SETTINGS, reviewsToBurn } from '@/domain/stats'
import type { Dataset, StudySettings } from '@/domain/stats-types'
import type {
  Assignment,
  Kanji,
  LevelProgression,
  Radical,
  Reset,
  ReviewStatistic,
  SpacedRepetitionSystem,
  Subject,
  SubjectType,
  User,
  Vocabulary,
} from '@/api/types'

const NOW = new Date('2026-06-15T12:00:00.000Z')

const USER: User = {
  id: 'user-uuid',
  username: 'TestUser',
  level: 2,
  profile_url: 'https://www.wanikani.com/users/TestUser',
  started_at: '2026-01-01T00:00:00.000Z',
  subscription: { active: true, type: 'lifetime', max_level_granted: 60, period_ends_at: null },
  current_vacation_started_at: null,
}

/** The default WaniKani ladder: stages 1-8 with nulls at 0 and 9. */
const SRS: SpacedRepetitionSystem = {
  id: 1,
  name: 'Default system for dictionary subjects',
  description: 'The original spaced repetition system',
  unlocking_stage_position: 0,
  starting_stage_position: 1,
  passing_stage_position: 5,
  burning_stage_position: 9,
  stages: [
    { position: 0, interval: null, interval_unit: 'seconds' },
    { position: 1, interval: 14_400, interval_unit: 'seconds' },
    { position: 2, interval: 28_800, interval_unit: 'seconds' },
    { position: 3, interval: 82_800, interval_unit: 'seconds' },
    { position: 4, interval: 169_200, interval_unit: 'seconds' },
    { position: 5, interval: 601_200, interval_unit: 'seconds' },
    { position: 6, interval: 1_206_000, interval_unit: 'seconds' },
    { position: 7, interval: 2_588_400, interval_unit: 'seconds' },
    { position: 8, interval: 10_364_400, interval_unit: 'seconds' },
    { position: 9, interval: null, interval_unit: 'seconds' },
  ],
}

function baseSubject(id: number, object: SubjectType, level: number, slug: string) {
  return {
    id,
    object,
    level,
    slug,
    characters: slug,
    hidden_at: null,
    document_url: `https://www.wanikani.com/${object}/${slug}`,
    meanings: [{ meaning: slug, primary: true, accepted_answer: true }],
    auxiliary_meanings: [],
    created_at: '2012-02-27T18:08:16.000Z',
  }
}

function radical(id: number, level = 1): Radical {
  return {
    ...baseSubject(id, 'radical', level, `radical-${id}`),
    object: 'radical',
    character_images: [],
    amalgamation_subject_ids: [],
  }
}

function kanji(id: number, level = 1): Kanji {
  return {
    ...baseSubject(id, 'kanji', level, `kanji-${id}`),
    object: 'kanji',
    readings: [{ reading: 'いち', primary: true, accepted_answer: true, type: 'onyomi' }],
    component_subject_ids: [],
    amalgamation_subject_ids: [],
    visually_similar_subject_ids: [],
    meaning_mnemonic: 'mnemonic',
    meaning_hint: null,
    reading_mnemonic: 'mnemonic',
    reading_hint: null,
  }
}

function vocabulary(id: number, level = 1, object: 'vocabulary' | 'kana_vocabulary' = 'vocabulary'): Vocabulary {
  return {
    ...baseSubject(id, object, level, `vocab-${id}`),
    object,
    readings: [{ reading: 'いち', primary: true, accepted_answer: true }],
    parts_of_speech: ['noun'],
    component_subject_ids: [],
    meaning_mnemonic: 'mnemonic',
    reading_mnemonic: 'mnemonic',
  }
}

function assignment(subject: Subject, overrides: Partial<Assignment> = {}): Assignment {
  return {
    created_at: '2026-01-01T00:00:00.000Z',
    subject_id: subject.id,
    subject_type: subject.object,
    srs_stage: 0,
    unlocked_at: '2026-01-01T00:00:00.000Z',
    started_at: null,
    passed_at: null,
    burned_at: null,
    available_at: null,
    resurrected_at: null,
    hidden: false,
    ...overrides,
  }
}

function statistic(
  subject: Subject,
  counts: Partial<ReviewStatistic> = {},
): ReviewStatistic {
  return {
    created_at: '2026-01-01T00:00:00.000Z',
    subject_id: subject.id,
    subject_type: subject.object,
    meaning_correct: 0,
    meaning_incorrect: 0,
    meaning_max_streak: 0,
    meaning_current_streak: 0,
    reading_correct: 0,
    reading_incorrect: 0,
    reading_max_streak: 0,
    reading_current_streak: 0,
    percentage_correct: 0,
    hidden: false,
    ...counts,
  }
}

/**
 * Four level-1 subjects (one of each kind) plus two level-2 subjects that are locked,
 * with a burned radical, a guru'd kanji and a vocabulary item awaiting its lesson.
 */
function buildDataset(overrides: Partial<Dataset> = {}): Dataset {
  const radicalOne = radical(1)
  const kanjiOne = kanji(10)
  const vocabOne = vocabulary(20)
  const kanaOne = vocabulary(30, 1, 'kana_vocabulary')
  const kanjiTwo = kanji(50, 2)
  const vocabTwo = vocabulary(60, 2)

  return {
    user: USER,
    summary: {
      lessons: [{ available_at: '2026-06-15T05:00:00.000Z', subject_ids: [20] }],
      reviews: [
        { available_at: '2026-06-15T05:00:00.000Z', subject_ids: [] },
        { available_at: '2026-06-15T13:00:00.000Z', subject_ids: [10, 10] },
      ],
      next_reviews_at: '2026-06-15T13:00:00.000Z',
    },
    subjects: [radicalOne, kanjiOne, vocabOne, kanaOne, kanjiTwo, vocabTwo],
    spacedRepetitionSystem: SRS,
    assignments: [
      // Burned radical: 2 meaning answers.
      assignment(radicalOne, {
        srs_stage: 9,
        started_at: '2026-02-01T00:00:00.000Z',
        passed_at: '2026-03-01T00:00:00.000Z',
        burned_at: '2026-05-01T00:00:00.000Z',
        data_updated_at: '2026-06-01T10:00:00.000Z',
      }),
      // Guru 1 kanji: still climbing, next review in the past.
      assignment(kanjiOne, {
        srs_stage: 5,
        started_at: '2026-02-02T00:00:00.000Z',
        passed_at: '2026-04-01T00:00:00.000Z',
        available_at: '2026-06-15T05:00:00.000Z',
        data_updated_at: '2026-06-15T09:00:00.000Z',
      }),
      // Vocabulary unlocked but lesson not done yet.
      assignment(vocabOne, { srs_stage: 0 }),
      // Kana vocabulary: lesson done, now in reviews.
      assignment(kanaOne, {
        srs_stage: 1,
        started_at: '2026-05-01T00:00:00.000Z',
        available_at: '2026-06-15T14:00:00.000Z',
        data_updated_at: '2026-06-14T09:00:00.000Z',
      }),
    ],
    reviewStatistics: [
      statistic(radicalOne, {
        meaning_correct: 2,
        meaning_incorrect: 0,
        meaning_max_streak: 2,
        meaning_current_streak: 2,
      }),
      statistic(kanjiOne, {
        meaning_correct: 1,
        meaning_incorrect: 1,
        meaning_max_streak: 1,
        meaning_current_streak: 0,
        reading_correct: 1,
        reading_incorrect: 2,
        reading_max_streak: 1,
        reading_current_streak: 0,
        percentage_correct: 40,
      }),
    ],
    levelProgressions: [
      { created_at: '2026-01-01T00:00:00.000Z', level: 1, unlocked_at: '2026-01-01T00:00:00.000Z', started_at: '2026-01-02T00:00:00.000Z', passed_at: '2026-02-01T00:00:00.000Z', completed_at: null, abandoned_at: null },
      { created_at: '2026-02-01T00:00:00.000Z', level: 2, unlocked_at: '2026-02-01T00:00:00.000Z', started_at: '2026-05-01T00:00:00.000Z', passed_at: null, completed_at: null, abandoned_at: null },
    ],
    resets: [],
    fetchedAt: '2026-06-15T11:00:00.000Z',
    ...overrides,
  }
}

function kanjiOneFor(dataset: Dataset): Subject {
  return dataset.subjects.find((subject) => subject.id === 10)!
}

function progression(level: number, startedAt: string, passedAt: string): LevelProgression {
  return {
    created_at: startedAt,
    level,
    unlocked_at: startedAt,
    started_at: startedAt,
    passed_at: passedAt,
    completed_at: null,
    abandoned_at: null,
  }
}

/** A self-consistent run of levels, each taking `days` days, one after the other. */
function entriesPerLevel(levels: number[], days: number): LevelProgression[] {
  const start = Date.parse('2026-01-01T00:00:00.000Z')
  return levels.map((level, index) => {
    const startedAt = new Date(start + index * days * 86_400_000).toISOString()
    const passedAt = new Date(start + (index + 1) * days * 86_400_000).toISOString()
    return progression(level, startedAt, passedAt)
  })
}

function compute(dataset: Dataset, settings: StudySettings = DEFAULT_SETTINGS, now: Date = NOW) {
  return computeStats(dataset, settings, now)
}

describe('reviewsToBurn', () => {
  it('counts the successful reviews left to reach burned', () => {
    expect(reviewsToBurn(9)).toBe(0)
    expect(reviewsToBurn(8)).toBe(1)
    expect(reviewsToBurn(1)).toBe(8)
  })

  it('treats an unstarted item as a full seven-step climb', () => {
    expect(reviewsToBurn(0)).toBe(7)
  })
})

describe('time invested', () => {
  it('counts every completed lesson, including kana vocabulary', () => {
    // started_at is set on the radical, the kanji and the kana vocabulary. Kana
    // vocabulary goes through the lesson queue too, so all three count.
    const stats = compute(buildDataset())
    expect(stats.invested.lessonsCompleted).toBe(3)
  })

  it('sums every meaning and reading answer', () => {
    // Radical 2, kanji 1+1 meaning and 1+2 reading.
    const stats = compute(buildDataset())
    expect(stats.invested.answersRecorded).toBe(7)
  })

  it('counts one finished review per correct meaning answer', () => {
    // The radical has 2 correct meanings and the kanji 1, so 3 finished reviews. Wrong
    // answers are retries inside a review, not extra reviews.
    const stats = compute(buildDataset())
    expect(stats.invested.reviewsCompleted).toBe(3)
    expect(stats.invested.answersRecorded).toBe(7)
  })

  it('does not count a failed-and-retried review twice', () => {
    const dataset = buildDataset()
    const kanjiOne = dataset.subjects.find((subject) => subject.id === 10)!
    const stats = compute({
      ...dataset,
      reviewStatistics: [
        statistic(kanjiOne, {
          meaning_correct: 1,
          meaning_incorrect: 1,
          reading_correct: 1,
          reading_incorrect: 1,
        }),
      ],
    })
    // 4 answers, but only 1 finished review.
    expect(stats.invested.answersRecorded).toBe(4)
    expect(stats.invested.reviewsCompleted).toBe(1)
  })

  it('still counts reviews done on items that are now hidden', () => {
    const dataset = buildDataset()
    const radicalOne = dataset.subjects.find((subject) => subject.id === 1)!
    const stats = compute({
      ...dataset,
      reviewStatistics: [{ ...statistic(radicalOne, { meaning_correct: 9, meaning_incorrect: 1 }), hidden: true }],
    })
    expect(stats.invested.reviewsCompleted).toBe(9)
    // Hidden items are left out of the time and accuracy figures.
    expect(stats.invested.answersRecorded).toBe(0)
  })

  it('multiplies lessons by the lesson rate and answers by the review rate', () => {
    const stats = compute(buildDataset())
    // 3 lessons x 90_000ms = 270_000; 7 answers x the default review rate.
    const reviewMs = 7 * DEFAULT_SETTINGS.secondsPerReview * 1000
    expect(stats.invested.lessonsMs).toBe(270_000)
    expect(stats.invested.reviewsMs).toBe(reviewMs)
    expect(stats.invested.totalMs).toBe(270_000 + reviewMs)
  })

  it('honours custom assumptions', () => {
    const settings: StudySettings = { secondsPerReview: 60, minutesPerLesson: 3, isPanelOpen: false }
    const stats = compute(buildDataset(), settings)
    // 3 lessons x 180_000ms = 540_000; 7 answers x 60s = 420_000.
    expect(stats.invested.totalMs).toBe(960_000)
    expect(stats.assumptions.source).toBe('custom')
    expect(stats.assumptions.secondsPerReview).toBe(60)
  })

  it('labels default assumptions as assumed', () => {
    expect(compute(buildDataset()).assumptions.source).toBe('assumed')
  })
})

describe('curriculum progress', () => {
  it('is the share of the catalogue unlocked, not the share of hours spent', () => {
    const stats = compute(buildDataset())
    // 4 of 6 subjects unlocked.
    expect(stats.curriculumProgress).toBeCloseTo((4 / 6) * 100, 6)
  })

  it('is unaffected by how slow a reader you are', () => {
    // Progress must not move when the pace assumptions change: hours measure workload,
    // not position in the course.
    const quick = compute(buildDataset())
    const slow = compute(buildDataset(), { secondsPerReview: 120, minutesPerLesson: 10, isPanelOpen: false })

    expect(slow.invested.totalMs).toBeGreaterThan(quick.invested.totalMs)
    expect(slow.curriculumProgress).toBe(quick.curriculumProgress)
  })

  it('is zero for an empty catalogue rather than NaN', () => {
    const stats = compute(buildDataset({ subjects: [] }))
    expect(stats.curriculumProgress).toBe(0)
  })

  it('reaches one hundred percent only when everything is unlocked', () => {
    const dataset = buildDataset()
    // Give the two locked levels-2 subjects assignments too.
    const allUnlocked = dataset.subjects.map((subject) =>
      assignment(subject, { srs_stage: 0, subject_id: subject.id, subject_type: subject.object }),
    )
    const stats = compute({ ...dataset, assignments: allUnlocked })
    expect(stats.curriculumProgress).toBe(100)
  })
})

describe('item counts', () => {
  it('counts the catalog, what is unlocked and what is still locked', () => {
    const stats = compute(buildDataset())
    expect(stats.counts.total).toBe(6)
    expect(stats.counts.unlocked).toBe(4)
    expect(stats.counts.locked).toBe(2)
  })

  it('treats stage 5+ as passed and stage 9 as burned', () => {
    const stats = compute(buildDataset())
    expect(stats.counts.passed).toBe(2)
    expect(stats.counts.burned).toBe(1)
    expect(stats.counts.started).toBe(3)
  })

  it('excludes subjects WaniKani has hidden', () => {
    const dataset = buildDataset()
    const hiddenSubject = { ...radical(999), hidden_at: '2026-01-01T00:00:00.000Z' }
    const stats = compute({ ...dataset, subjects: [...dataset.subjects, hiddenSubject] })
    expect(stats.counts.total).toBe(6)
    expect(stats.counts.hiddenSubjects).toBe(1)
  })

  it('keeps hidden assignments out of the totals', () => {
    const dataset = buildDataset()
    const stats = compute({
      ...dataset,
      assignments: [...dataset.assignments, assignment(radical(1), { subject_id: 1, hidden: true })],
    })
    expect(stats.counts.unlocked).toBe(4)
  })
})

describe('remaining workload', () => {
  it('adds a full climb for subjects that are not unlocked yet', () => {
    const stats = compute(buildDataset())
    // Stage-ups: radical 9 -> 0; kanji 5 -> 4; vocab 0 -> 7; kana 1 -> 8.
    // Locked kanji and vocabulary contribute 7 each (a full climb to burned).
    expect(stats.workload.stageUpsRemaining).toBe(0 + 4 + 7 + 8 + 7 + 7)
  })

  it('counts remaining work in answers, matching how invested time is counted', () => {
    const stats = compute(buildDataset())
    // Stage-ups: radical 0, kanji 4, vocab 7, kana 8, locked kanji 7, locked vocab 7 = 33.
    // Answers double every type EXCEPT the radical and kana vocabulary, which WaniKani
    // quizzes on meaning only:
    //   radical  0 x 1 = 0
    //   kanji    4 x 2 = 8
    //   vocab    7 x 2 = 14
    //   kana     8 x 1 = 8
    //   locked kanji 7 x 2 = 14, locked vocab 7 x 2 = 14
    expect(stats.workload.stageUpsRemaining).toBe(33)
    expect(stats.workload.answersRemaining).toBe(0 + 8 + 14 + 8 + 14 + 14)
  })

  it('charges a radical one answer per stage-up and a kanji two', () => {
    const dataset = buildDataset()
    const radicalOne = dataset.subjects.find((subject) => subject.id === 1)!
    // Same stage, different subject type: the radical costs half the answers.
    const radicalAtStage9 = compute({
      ...dataset,
      subjects: [radicalOne],
      assignments: [assignment(radicalOne, { srs_stage: 1, started_at: '2026-02-01T00:00:00.000Z' })],
      reviewStatistics: [],
    })
    const asKanji = compute({
      ...dataset,
      subjects: [kanjiOneFor(dataset)],
      assignments: [assignment(kanjiOneFor(dataset), { srs_stage: 1, started_at: '2026-02-01T00:00:00.000Z' })],
      reviewStatistics: [],
    })

    expect(radicalAtStage9.workload.stageUpsRemaining).toBe(8)
    expect(radicalAtStage9.workload.answersRemaining).toBe(8)
    expect(asKanji.workload.stageUpsRemaining).toBe(8)
    expect(asKanji.workload.answersRemaining).toBe(16)
  })

  it('counts lessons for everything not yet started', () => {
    // Vocabulary 20, kanji 50 and vocabulary 60 still need lessons.
    const stats = compute(buildDataset())
    expect(stats.workload.lessonsRemaining).toBe(3)
  })

  it('converts the workload into time using the same assumptions', () => {
    const stats = compute(buildDataset())
    // Time is per ANSWER, so it must follow answersRemaining and not the stage-up count.
    const reviewMs = stats.workload.answersRemaining * DEFAULT_SETTINGS.secondsPerReview * 1000
    expect(stats.workload.reviewsMs).toBe(reviewMs)
    expect(stats.workload.lessonsMs).toBe(3 * 90_000)
    expect(stats.workload.totalMs).toBe(reviewMs + 3 * 90_000)
  })

  it('never derives review time from the stage-up count', () => {
    // Regression guard: the stage-up count is roughly half the answer count, so using
    // it as the time basis silently halves the whole remaining-time figure.
    const stats = compute(buildDataset())
    expect(stats.workload.answersRemaining).toBeGreaterThan(stats.workload.stageUpsRemaining)
    expect(stats.workload.reviewsMs).not.toBe(
      stats.workload.stageUpsRemaining * DEFAULT_SETTINGS.secondsPerReview * 1000,
    )
  })

  it('reports the whole curriculum as invested plus remaining', () => {
    const stats = compute(buildDataset())
    expect(stats.projection.totalCurriculumMs).toBe(stats.invested.totalMs + stats.workload.totalMs)
  })
})

describe('accuracy', () => {
  it('counts reading answers only for subjects that have readings', () => {
    // Meaning: 2+1 correct, 0+1 incorrect. Reading: 1 correct, 2 incorrect.
    const stats = compute(buildDataset())
    expect(stats.accuracy.meaning.total).toBe(4)
    expect(stats.accuracy.meaning.accuracy).toBe(75)
    expect(stats.accuracy.reading.total).toBe(3)
    expect(stats.accuracy.reading.accuracy).toBeCloseTo(33.333, 2)
    expect(stats.accuracy.overall.total).toBe(7)
    expect(stats.accuracy.overall.accuracy).toBeCloseTo((4 / 7) * 100, 4)
  })

  it('groups accuracy by subject type', () => {
    const stats = compute(buildDataset())
    expect(stats.accuracy.radical.total).toBe(2)
    expect(stats.accuracy.radical.accuracy).toBe(100)
    expect(stats.accuracy.kanji.total).toBe(5)
  })

  it('counts items with a perfect record', () => {
    const stats = compute(buildDataset())
    expect(stats.accuracy.perfectItems).toBe(1)
    expect(stats.accuracy.perfectShare).toBe(50)
  })

  it('ignores hidden review statistics', () => {
    const dataset = buildDataset()
    const stats = compute({
      ...dataset,
      reviewStatistics: [...dataset.reviewStatistics, statistic(radical(1), { hidden: true, meaning_correct: 500 })],
    })
    expect(stats.accuracy.overall.correct).toBe(4)
  })
})

describe('SRS breakdown', () => {
  it('buckets every assignment by its stage', () => {
    const stats = compute(buildDataset())
    const byStage = new Map(stats.srs.stages.map((stage) => [stage.stage, stage.count]))
    expect(byStage.get(0)).toBe(1)
    expect(byStage.get(1)).toBe(1)
    expect(byStage.get(5)).toBe(1)
    expect(byStage.get(9)).toBe(1)
    expect(byStage.get(7)).toBe(0)
  })

  it('groups the stages the way WaniKani presents them', () => {
    const stats = compute(buildDataset())
    const byKey = new Map(stats.srs.groups.map((group) => [group.key, group.count]))
    expect(byKey.get('lesson')).toBe(1)
    expect(byKey.get('apprentice')).toBe(1)
    expect(byKey.get('guru')).toBe(1)
    expect(byKey.get('burned')).toBe(1)
  })

  it('exposes each stage interval in days, with nulls at 0 and 9', () => {
    const stats = compute(buildDataset())
    const byStage = new Map(stats.srs.stages.map((stage) => [stage.stage, stage.intervalDays]))
    expect(byStage.get(0)).toBeNull()
    expect(byStage.get(9)).toBeNull()
    expect(byStage.get(1)).toBeCloseTo(14_400 / 86_400, 6)
    expect(byStage.get(5)).toBeCloseTo(601_200 / 86_400, 6)
  })

  it('falls back to the standard ladder when no SRS metadata is available', () => {
    const stats = compute(buildDataset({ spacedRepetitionSystem: null }))
    const byStage = new Map(stats.srs.stages.map((stage) => [stage.stage, stage.intervalDays]))
    expect(byStage.get(1)).toBeCloseTo(14_400 / 86_400, 6)
  })

  it('handles an interval_unit that is not seconds', () => {
    const minutes: SpacedRepetitionSystem = {
      ...SRS,
      stages: SRS.stages.map((stage) =>
        stage.position === 1 && stage.interval !== null
          ? { ...stage, interval: 240, interval_unit: 'minutes' as const }
          : stage,
      ),
    }
    const stats = compute(buildDataset({ spacedRepetitionSystem: minutes }))
    const stageOne = stats.srs.stages.find((stage) => stage.stage === 1)
    // 240 minutes = 4 hours = 1/6 of a day.
    expect(stageOne?.intervalDays).toBeCloseTo(1 / 6, 6)
  })
})

describe('review forecast', () => {
  it('drops empty buckets rather than plotting phantom zeros', () => {
    // WaniKani returns 25 hourly buckets including empty ones.
    const stats = compute(buildDataset())
    expect(stats.reviewForecast).toHaveLength(1)
    expect(stats.reviewForecast[0].count).toBe(2)
  })

  it('reports the next scheduled review', () => {
    const stats = compute(buildDataset())
    expect(stats.nextReviewAt?.toISOString()).toBe('2026-06-15T13:00:00.000Z')
  })

  it('counts items whose review is due now', () => {
    // Kanji 10 is available at 05:00 and the kana item at 14:00, with "now" at 12:00.
    const stats = compute(buildDataset())
    expect(stats.availableNow).toBe(1)
  })

  it('counts available lessons from the summary', () => {
    expect(compute(buildDataset()).lessonsAvailable).toBe(1)
  })
})

describe('burn forecast', () => {
  it('projects a burn date by walking the interval ladder', () => {
    const stats = compute(buildDataset())
    const kanjiBurn = stats.burnForecast.find((point) => point.subjectCount > 0)
    expect(kanjiBurn).toBeDefined()

    // Kanji is at stage 5, next review 2026-06-15T05:00, and needs stages 6, 7 and 8:
    // 14 + 30 + 119.95 days.
    const expected = new Date('2026-06-15T05:00:00.000Z')
    expected.setTime(
      expected.getTime() + (1_206_000 / 86_400 + 2_588_400 / 86_400 + 10_364_400 / 86_400) * 86_400_000,
    )
    // Forecast buckets are start-of-day in the viewer's timezone, so compare the
    // local calendar date rather than the UTC one.
    const localDate = (date: Date | undefined) =>
      date ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : null
    expect(localDate(kanjiBurn?.day)).toBe(localDate(expected))
  })

  it('excludes burned items and items that have not had their lesson', () => {
    const stats = compute(buildDataset())
    // Only the guru'd kanji and the apprentice kana item are in rotation.
    const subjectTotal = stats.burnForecast.reduce((sum, point) => sum + point.subjectCount, 0)
    expect(subjectTotal).toBe(2)
  })
})

describe('leeches', () => {
  it('flags below-Guru items with four or more misses', () => {
    const stats = compute(buildDataset())
    // The kanji has 1 meaning + 2 reading = 3 misses, so it is just short.
    expect(stats.leeches.count).toBe(0)
  })

  it('ranks a leechier item higher', () => {
    const dataset = buildDataset()
    const kanjiOne = dataset.subjects.find((subject) => subject.id === 10)!
    const stats = compute({
      ...dataset,
      reviewStatistics: [
        ...dataset.reviewStatistics.filter((stat) => stat.subject_id !== 10),
        statistic(kanjiOne, { meaning_correct: 1, meaning_incorrect: 6, reading_incorrect: 3 }),
      ],
    })
    expect(stats.leeches.count).toBe(1)
    expect(stats.leeches.items[0].incorrect).toBe(9)
    expect(stats.leeches.items[0].srsStage).toBe(5)
  })

  it('does not flag burned items', () => {
    // The radical is burned; there is nothing left to fix, however badly it went.
    const dataset = buildDataset()
    const radicalOne = dataset.subjects.find((subject) => subject.id === 1)!
    const stats = compute({
      ...dataset,
      reviewStatistics: [statistic(radicalOne, { meaning_incorrect: 20, meaning_correct: 5 })],
    })
    expect(stats.leeches.count).toBe(0)
  })

  it('does flag a Guru item that keeps slipping, which is the classic leech', () => {
    const dataset = buildDataset()
    const kanjiOne = dataset.subjects.find((subject) => subject.id === 10)!
    const stats = compute({
      ...dataset,
      reviewStatistics: [statistic(kanjiOne, { meaning_correct: 2, meaning_incorrect: 5 })],
    })
    expect(stats.leeches.count).toBe(1)
    expect(stats.leeches.items[0].srsStage).toBe(5)
  })
})

describe('level timeline', () => {
  it('marks the current level and reports its progress', () => {
    const stats = compute(buildDataset())
    expect(stats.levels.currentLevel).toBe(2)
    expect(stats.levels.rows.find((row) => row.level === 2)?.isCurrent).toBe(true)
  })

  it('reports kanji progress for the current level', () => {
    const stats = compute(buildDataset({ user: { ...USER, level: 1 } }))
    expect(stats.currentLevel.level).toBe(1)
    expect(stats.currentLevel.kanjiTotal).toBe(1)
    expect(stats.currentLevel.kanjiPassed).toBe(1)
    expect(stats.currentLevel.progress).toBe(100)
    expect(stats.currentLevel.isComplete).toBe(true)
  })

  it('computes days on the current level', () => {
    const stats = compute(buildDataset())
    // Level 2 started 2026-05-01, "now" is 2026-06-15.
    expect(stats.currentLevel.daysOnLevel).toBeCloseTo(45.5, 1)
  })

  it('derives the pace from consecutive level-ups', () => {
    // Full replacement: a partial history would leave the default progressions in
    // place and produce gaps between levels that were never studied in order.
    const progressions: LevelProgression[] = entriesPerLevel([1, 2, 3, 4], 10)
    const stats = compute(buildDataset({ user: { ...USER, level: 4 }, levelProgressions: progressions }))
    expect(stats.levels.medianLevelDays).toBeCloseTo(10, 1)
    expect(stats.projection.sampleSize).toBe(3)
  })

  it('ignores an implausible gap caused by a reset', () => {
    // A reset hands out a fresh progression whose passed_at predates the level above,
    // which would otherwise look like a negative or zero-length level.
    const progressions: LevelProgression[] = [
      ...entriesPerLevel([1, 2], 14),
      // Same timestamp as level 2: the artifact a reset leaves behind.
      progression(3, '2026-01-25T00:00:00.000Z', '2026-01-25T00:00:00.000Z'),
    ]
    const stats = compute(buildDataset({ user: { ...USER, level: 3 }, levelProgressions: progressions }))
    expect(stats.levels.recentDurations).toHaveLength(1)
    expect(stats.levels.recentDurations[0].days).toBeCloseTo(14, 1)
  })

  it('surfaces resets and whether they touch the pace sample', () => {
    const resets: Reset[] = [
      { created_at: '2026-05-01T00:00:00.000Z', original_level: 12, target_level: 1, confirmed_at: '2026-05-01T00:00:00.000Z' },
    ]
    const stats = compute(buildDataset({ resets }))
    expect(stats.levels.hasResets).toBe(true)
    expect(stats.levels.resets).toHaveLength(1)
    expect(stats.levels.resets[0].originalLevel).toBe(12)
    expect(stats.levels.resets[0].targetLevel).toBe(1)
  })

  it('prefers the newest progression when a level appears twice', () => {
    const progressions: LevelProgression[] = [
      { created_at: '2023-01-01T00:00:00.000Z', level: 1, unlocked_at: null, started_at: null, passed_at: '2023-02-01T00:00:00.000Z', completed_at: null, abandoned_at: '2023-04-04T00:00:00.000Z' },
      { created_at: '2023-04-04T00:00:00.000Z', level: 1, unlocked_at: null, started_at: '2023-04-05T00:00:00.000Z', passed_at: '2023-04-20T00:00:00.000Z', completed_at: null, abandoned_at: null },
    ]
    const stats = compute(buildDataset({ levelProgressions: progressions }))
    const row = stats.levels.rows.find((entry) => entry.level === 1)
    expect(row?.passedAt?.toISOString()).toBe('2023-04-20T00:00:00.000Z')
  })
})

describe('projection', () => {
  it('projects a finish date from the level pace', () => {
    const progressions: LevelProgression[] = entriesPerLevel([1, 2, 3], 10)
    const stats = compute(buildDataset({ user: { ...USER, level: 3 }, levelProgressions: progressions }))
    expect(stats.projection.daysPerLevel).toBeCloseTo(10, 1)
    expect(stats.projection.levelsRemaining).toBe(57)

    const expected = new Date(NOW.getTime() + 57 * 10 * 86_400_000)
    expect(stats.projection.etaByLevelPace?.toISOString().slice(0, 10)).toBe(
      expected.toISOString().slice(0, 10),
    )
  })

  it('has no level-pace estimate when there is no level history', () => {
    const stats = compute(buildDataset({ levelProgressions: [] }))
    expect(stats.projection.etaByLevelPace).toBeNull()
    expect(stats.projection.daysPerLevel).toBe(0)
  })

  it('publishes no study-rate estimate, because the data cannot support one', () => {
    const stats = compute(buildDataset())
    expect(stats.projection).not.toHaveProperty('etaByStudyRate')
    expect(stats.projection).not.toHaveProperty('studyMinutesPerDay')
    expect(stats).not.toHaveProperty('activity')
  })
})
