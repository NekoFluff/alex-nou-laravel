/**
 * Consistency checks against a real mirrored WaniKani account.
 *
 * These skip themselves when `fixtures/wanikani-dataset.json` is absent (it is
 * gitignored), so a fresh clone still runs green. Run `npm run fixtures` to populate
 * it. The value here is that the engine meets ~9,400 subjects and ~5,400 assignments
 * of real, messy data — level resets, hidden subjects, resurrected items and all.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { computeStats, DEFAULT_SETTINGS } from '@/domain/stats'
import { hasFixture, loadFixture } from './fixture'
import type { Dataset, WaniKaniStats } from '@/domain/stats-types'

const FIXED_NOW = new Date('2026-06-15T12:00:00.000Z')

let dataset: Dataset | null = null
let stats: WaniKaniStats | null = null

beforeAll(() => {
  dataset = loadFixture()
  stats = dataset ? computeStats(dataset, DEFAULT_SETTINGS, FIXED_NOW) : null
})

const describeFixture = hasFixture() ? describe : describe.skip

describeFixture('real account', () => {
  it('loads a substantial dataset', () => {
    expect(dataset!.subjects.length).toBeGreaterThan(1000)
    expect(dataset!.assignments.length).toBeGreaterThan(100)
  })

  it('gives every subject an id', () => {
    // The envelope carries `id` and `object`; if unwrapping dropped them, every
    // subject would key on `undefined` and the catalog would collapse to one entry.
    const ids = new Set(dataset!.subjects.map((subject) => subject.id))
    expect(ids.size).toBe(dataset!.subjects.length)
    expect(dataset!.subjects.some((subject) => subject.id === undefined)).toBe(false)
  })

  it('gives every subject a known type', () => {
    const known = new Set(['radical', 'kanji', 'vocabulary', 'kana_vocabulary'])
    for (const subject of dataset!.subjects) {
      expect(known.has(subject.object)).toBe(true)
    }
  })

  it('reports curriculum progress as the unlocked share', () => {
    expect(stats!.curriculumProgress).toBeCloseTo(
      (stats!.counts.unlocked / stats!.counts.total) * 100,
      6,
    )
    // Partway through the catalogue, not partway through the hours.
    expect(stats!.curriculumProgress).toBeGreaterThan(0)
    expect(stats!.curriculumProgress).toBeLessThan(100)
  })

  it('keeps progress independent of the time assumptions', () => {
    const doubled = computeStats(dataset!, { ...DEFAULT_SETTINGS, secondsPerReview: 120 }, FIXED_NOW)
    expect(doubled.curriculumProgress).toBe(stats!.curriculumProgress)
  })

  it('splits the catalog exactly into unlocked and locked', () => {
    expect(stats!.counts.unlocked + stats!.counts.locked).toBe(stats!.counts.total)
  })

  it('never reports more unlocked items than exist', () => {
    expect(stats!.counts.unlocked).toBeLessThanOrEqual(stats!.counts.total)
    expect(stats!.counts.burned).toBeLessThanOrEqual(stats!.counts.passed)
  })

  it('reports comparable quantities on the two headline cards', () => {
    // The cards sit side by side, so both sides must be lessons-and-reviews. Comparing
    // answers done against stage-ups remaining reads as nonsense.
    expect(stats!.invested.reviewsSessions).toBeGreaterThan(0)
    expect(stats!.workload.stageUpsRemaining).toBeGreaterThan(0)

    // Invested reviews come from completed work; remaining ones from outstanding work.
    // Neither should be mistaken for the answer count.
    expect(stats!.invested.reviewsSessions).not.toBe(stats!.invested.answersRecorded)
    expect(stats!.workload.stageUpsRemaining).not.toBe(stats!.workload.answersRemaining)
  })

  it('derives review sittings from the longest side of each item', () => {
    // One sitting quizzes meaning and reading together. A wrong part is re-asked, so
    // the number of times an item appeared is the larger of the two counters — never
    // half of the answer total, and never less than the meaning-only count.
    const expected = dataset!.reviewStatistics.reduce((sum, stat) => {
      const meaning = stat.meaning_correct + stat.meaning_incorrect
      const hasReading = stat.subject_type === 'kanji' || stat.subject_type === 'vocabulary'
      const reading = hasReading ? stat.reading_correct + stat.reading_incorrect : 0
      return sum + Math.max(meaning, reading)
    }, 0)
    expect(stats!.invested.reviewsSessions).toBe(expected)
  })

  it('counts a meaning-only item as one sitting per appearance', () => {
    // Radicals never record reading answers, so their sitting count equals their
    // meaning answers and must not be halved or doubled.
    const radicals = dataset!.reviewStatistics.filter((stat) => stat.subject_type === 'radical')
    const radicalSittings = radicals.reduce(
      (sum, stat) => sum + stat.meaning_correct + stat.meaning_incorrect,
      0,
    )
    expect(radicalSittings).toBeGreaterThan(0)
    expect(stats!.invested.reviewsSessions).toBeGreaterThan(radicalSittings)
  })

  it('counts remaining work in the same unit as invested work', () => {
    // Both sides of the curriculum subtraction must be answers, or the remaining time
    // is out by roughly a factor of two.
    expect(stats!.workload.answersRemaining).toBeGreaterThan(stats!.workload.stageUpsRemaining)
    expect(stats!.workload.reviewsMs).toBe(
      stats!.workload.answersRemaining * DEFAULT_SETTINGS.secondsPerReview * 1000,
    )
    expect(stats!.projection.totalCurriculumMs).toBeGreaterThan(stats!.invested.totalMs)
  })

  it('reconciles invested time with the per-item assumptions', () => {
    const expectedLessons = stats!.invested.lessonsCompleted * 1.5 * 60_000
    const expectedReviews = stats!.invested.answersRecorded * DEFAULT_SETTINGS.secondsPerReview * 1000
    expect(stats!.invested.lessonsMs).toBe(expectedLessons)
    expect(stats!.invested.reviewsMs).toBe(expectedReviews)
    expect(stats!.invested.totalMs).toBe(expectedLessons + expectedReviews)
  })

  it('reports the whole curriculum as invested plus remaining', () => {
    expect(stats!.projection.totalCurriculumMs).toBe(stats!.invested.totalMs + stats!.workload.totalMs)
  })

  it('counts the same lessons the API reports', () => {
    // started_at is the lesson counter, except for kana vocabulary, which WaniKani
    // grants without a lesson screen.
    const expected = dataset!.assignments.filter(
      (assignment) => assignment.started_at !== null && assignment.subject_type !== 'kana_vocabulary',
    ).length
    expect(stats!.invested.lessonsCompleted).toBe(expected)
  })

  it('accounts for every recorded answer', () => {
    const expected = dataset!.reviewStatistics.reduce((sum, stat) => {
      const hasReading = stat.subject_type === 'kanji' || stat.subject_type === 'vocabulary'
      return (
        sum +
        stat.meaning_correct +
        stat.meaning_incorrect +
        (hasReading ? stat.reading_correct + stat.reading_incorrect : 0)
      )
    }, 0)
    expect(stats!.invested.answersRecorded).toBe(expected)
  })

  it('exposes no per-day activity data at all', () => {
    // The API cannot support reviews-per-day: there is no review log, and assignment
    // timestamps only record the LAST update per item. Rather than ship a number that
    // looks precise and is not, the engine publishes no activity and no study-rate ETA.
    expect(stats).not.toHaveProperty('activity')
    expect(stats!.projection).not.toHaveProperty('studyMinutesPerDay')
    expect(stats!.projection).not.toHaveProperty('etaByStudyRate')
  })

  it('still reports a level-pace finish date', () => {
    // This one is real: it comes from timestamps of levels actually completed.
    expect(stats!.projection.etaByLevelPace).toBeInstanceOf(Date)
    expect(stats!.projection.sampleSize).toBeGreaterThan(0)
  })

  it('reports review sittings below the answer count', () => {
    // Answers count meaning and reading separately; a sitting quizzes them together.
    // So sittings must fall between half the answers and all of them.
    expect(stats!.invested.reviewsSessions).toBeLessThan(stats!.invested.answersRecorded)
    expect(stats!.invested.reviewsSessions).toBeGreaterThan(stats!.invested.answersRecorded / 2)
  })

  it('keeps accuracy between zero and one hundred', () => {
    expect(stats!.accuracy.overall.accuracy).toBeGreaterThanOrEqual(0)
    expect(stats!.accuracy.overall.accuracy).toBeLessThanOrEqual(100)
    expect(stats!.accuracy.overall.total).toBe(
      stats!.accuracy.overall.correct + stats!.accuracy.overall.incorrect,
    )
  })

  it('never reports reading accuracy beyond what was actually answered', () => {
    // Radicals and kana vocabulary are meaning-only, so if they leaked into the
    // reading totals this would fail.
    expect(stats!.accuracy.reading.total).toBeLessThan(stats!.accuracy.overall.total)
  })

  it('accounts for every assignment exactly once in the SRS breakdown', () => {
    const total = stats!.srs.stages.reduce((sum, stage) => sum + stage.count, 0)
    expect(total).toBe(stats!.counts.unlocked)
  })

  it('groups the SRS stages consistently with the stage counts', () => {
    const grouped = stats!.srs.groups.reduce((sum, group) => sum + group.count, 0)
    expect(grouped).toBe(stats!.counts.unlocked)
  })

  it('keeps hidden subjects out of the catalog total', () => {
    const withHidden = dataset!.subjects.filter((subject) => subject.hidden_at === null).length
    expect(stats!.counts.total).toBe(withHidden)
  })

  it('reports a plausible pace from real level history', () => {
    expect(stats!.projection.daysPerLevel).toBeGreaterThan(0)
    expect(stats!.projection.daysPerLevel).toBeLessThan(400)
    expect(stats!.projection.sampleSize).toBeGreaterThan(0)
  })

  it('orders recent level durations without reset artefacts', () => {
    for (const entry of stats!.levels.recentDurations) {
      expect(entry.days).toBeGreaterThan(0.25)
    }
  })

  it('has level rows covering the whole game', () => {
    expect(stats!.levels.rows).toHaveLength(60)
    expect(stats!.levels.rows[0].level).toBe(1)
    expect(stats!.levels.rows[59].level).toBe(60)
  })

  it('marks exactly one level as current', () => {
    expect(stats!.levels.rows.filter((row) => row.isCurrent)).toHaveLength(1)
  })

  it('produces burn forecast points in chronological order', () => {
    for (let index = 1; index < stats!.burnForecast.length; index += 1) {
      expect(stats!.burnForecast[index].day.getTime()).toBeGreaterThanOrEqual(
        stats!.burnForecast[index - 1].day.getTime(),
      )
    }
  })

  it('finds leeches in a six-year-old account', () => {
    expect(stats!.leeches.items.length).toBeGreaterThan(0)
    for (const leech of stats!.leeches.items) {
      expect(leech.incorrect).toBeGreaterThanOrEqual(4)
      expect(leech.srsStage).toBeGreaterThan(0)
      expect(leech.srsStage).toBeLessThan(9)
    }
  })

  it('ranks leeches from worst to least bad', () => {
    const scores = stats!.leeches.items.map((leech) => leech.score)
    for (let index = 1; index < scores.length; index += 1) {
      expect(scores[index]).toBeLessThanOrEqual(scores[index - 1])
    }
  })

  it('reports current-level kanji progress that matches the catalog', () => {
    const level = stats!.currentLevel.level
    const levelKanji = dataset!.subjects.filter(
      (subject) => subject.level === level && subject.object === 'kanji' && subject.hidden_at === null,
    )
    expect(stats!.currentLevel.kanjiTotal).toBe(levelKanji.length)
  })

  it('scales monotonically with the review assumption', () => {
    const doubled = DEFAULT_SETTINGS.secondsPerReview * 2
    const slower = computeStats(dataset!, { ...DEFAULT_SETTINGS, secondsPerReview: doubled }, FIXED_NOW)
    expect(slower.invested.reviewsMs).toBe(stats!.invested.reviewsMs * 2)
    expect(slower.workload.reviewsMs).toBe(stats!.workload.reviewsMs * 2)
    // Lesson time must not move when only the review rate changes.
    expect(slower.invested.lessonsMs).toBe(stats!.invested.lessonsMs)
  })

  it('is deterministic for a fixed clock', () => {
    const again = computeStats(dataset!, DEFAULT_SETTINGS, FIXED_NOW)
    expect(again.invested.totalMs).toBe(stats!.invested.totalMs)
    expect(again.workload.answersRemaining).toBe(stats!.workload.answersRemaining)
    expect(again.projection.etaByLevelPace?.toISOString()).toBe(
      stats!.projection.etaByLevelPace?.toISOString(),
    )
  })

  it('picks up documented resets', () => {
    for (const reset of stats!.levels.resets) {
      expect(reset.originalLevel).toBeGreaterThan(reset.targetLevel)
    }
    if (stats!.levels.resets.length > 0) {
      expect(stats!.levels.hasResets).toBe(true)
    }
  })
})
