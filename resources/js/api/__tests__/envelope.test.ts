import { describe, expect, it } from 'vitest'
import { isApiRecord, unwrapRecord, unwrapRecords } from '@/api/envelope'

/** A collection item exactly as WaniKani returns it. */
function radicalRecord() {
  return {
    id: 1,
    object: 'radical',
    url: 'https://api.wanikani.com/v2/subjects/1',
    data_updated_at: '2026-09-14T03:23:59.161863Z',
    data: {
      level: 1,
      slug: 'ground',
      characters: '一',
      hidden_at: null,
      meanings: [{ meaning: 'Ground', primary: true, accepted_answer: true }],
    },
  }
}

describe('isApiRecord', () => {
  it('recognises a collection item envelope', () => {
    expect(isApiRecord(radicalRecord())).toBe(true)
  })

  it('rejects a bare payload that merely has a data key', () => {
    // Assignments carry `subject_type`, and a naive `'data' in record` check would
    // treat any payload with a `data` key as an envelope.
    expect(isApiRecord({ level: 1, slug: 'ground' })).toBe(false)
    expect(isApiRecord(null)).toBe(false)
    expect(isApiRecord('nope')).toBe(false)
  })

  it('does not treat an individual subject as an envelope', () => {
    // A real subject payload has `object`, but no `url` or `data_updated_at`.
    expect(
      isApiRecord({
        object: 'radical',
        level: 1,
        data: { anything: true },
      }),
    ).toBe(false)
  })
})

describe('unwrapRecord', () => {
  it('lifts the payload out of the envelope', () => {
    const subject = unwrapRecord<Record<string, unknown>>(radicalRecord())
    expect(subject.slug).toBe('ground')
    expect(subject.level).toBe(1)
  })

  it('carries the envelope id down onto the payload', () => {
    // This is the bug that gutted the first implementation: subjects have no `id`
    // inside `data`, so keying a lookup map on it collapsed every subject to one.
    const subject = unwrapRecord<{ id: number }>(radicalRecord())
    expect(subject.id).toBe(1)
  })

  it('carries object and data_updated_at down onto the payload', () => {
    const subject = unwrapRecord<{ object: string; data_updated_at: string }>(radicalRecord())
    expect(subject.object).toBe('radical')
    expect(subject.data_updated_at).toBe('2026-09-14T03:23:59.161863Z')
  })

  it('does not overwrite a payload field that already exists', () => {
    const record = {
      ...radicalRecord(),
      id: 99,
      data: { ...radicalRecord().data, id: 7, object: 'kanji' },
    }
    const subject = unwrapRecord<{ id: number; object: string }>(record)
    expect(subject.id).toBe(7)
    expect(subject.object).toBe('kanji')
  })

  it('passes a bare payload through untouched', () => {
    const payload = { level: 3, slug: 'cat' }
    expect(unwrapRecord(payload)).toBe(payload)
  })

  it('does not mutate the source record', () => {
    const record = radicalRecord()
    unwrapRecord(record)
    expect(Object.keys(record.data)).not.toContain('id')
  })
})

describe('unwrapRecords', () => {
  it('unwraps a whole page', () => {
    const page = [radicalRecord(), { ...radicalRecord(), id: 2 }]
    const subjects = unwrapRecords<{ id: number }>(page)
    expect(subjects.map((subject) => subject.id)).toEqual([1, 2])
  })

  it('keeps distinct ids distinct', () => {
    const page = Array.from({ length: 50 }, (_, index) => ({ ...radicalRecord(), id: index + 1 }))
    const subjects = unwrapRecords<{ id: number }>(page)
    expect(new Set(subjects.map((subject) => subject.id)).size).toBe(50)
  })
})
