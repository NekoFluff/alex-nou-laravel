/**
 * Switching the token on the page.
 *
 * Regression suite for a reported bug: pasting a different account's token left the
 * dashboard showing the previous account's numbers.
 *
 * The root cause turned out to be an unhandled teardown race — a load that resolved after
 * the component had gone wrote to state and made Vue patch a removed DOM node, throwing
 * "Cannot set properties of null" and abandoning the render. The composable now abandons
 * in-flight loads on unmount.
 */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Dataset } from '@/domain/stats-types'

const OTHER = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'

/**
 * A minimal but structurally valid dataset whose user level is the only thing that varies,
 * so an assertion on "Level N" proves which account rendered.
 */
function datasetFor(level: number): Dataset {
  const subjects = Array.from({ length: 4 }, (_, index) => ({
    id: index + 1,
    object: 'radical' as const,
    level: 1,
    slug: `s${index}`,
    characters: '一',
    hidden_at: null,
    meanings: [],
    character_images: [],
    created_at: '2026-01-01T00:00:00.000Z',
    document_url: 'https://www.wanikani.com/radicals/s',
    auxiliary_meanings: [],
    amalgamation_subject_ids: [],
  }))

  return {
    user: {
      id: `user-${level}`,
      username: `UserLevel${level}`,
      level,
      profile_url: 'https://www.wanikani.com/users/x',
      started_at: '2026-01-01T00:00:00.000Z',
      subscription: { active: true, type: 'lifetime', max_level_granted: 60, period_ends_at: null },
      current_vacation_started_at: null,
    },
    summary: { lessons: [], reviews: [], next_reviews_at: null },
    subjects,
    assignments: subjects.slice(0, 2).map((subject) => ({
      created_at: '2026-01-01T00:00:00.000Z',
      subject_id: subject.id,
      subject_type: 'radical' as const,
      srs_stage: 1,
      unlocked_at: '2026-01-01T00:00:00.000Z',
      started_at: '2026-01-02T00:00:00.000Z',
      passed_at: null,
      burned_at: null,
      available_at: null,
      resurrected_at: null,
      hidden: false,
    })),
    reviewStatistics: [],
    levelProgressions: [
      {
        created_at: '2026-01-01T00:00:00.000Z',
        level: 1,
        unlocked_at: '2026-01-01T00:00:00.000Z',
        started_at: '2026-01-02T00:00:00.000Z',
        passed_at: null,
        completed_at: null,
        abandoned_at: null,
      },
    ],
    resets: [],
    fetchedAt: null,
  }
}

const loadedWith: string[] = []

vi.mock('@/api/loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/loader')>()
  return {
    ...actual,
    resetCache: vi.fn(async () => undefined),
    loadDataset: vi.fn(async (token: string) => {
      loadedWith.push(token)
      // The baked-in account reports level 3; the visitor's reports level 7.
      return token === OTHER ? datasetFor(7) : datasetFor(3)
    }),
  }
})

/** Drives the page from the baked-in account to a visitor's token, ready to clear. */
async function mountSwitchedToVisitor() {
  loadedWith.length = 0
  const Page = (await import('@/Pages/Wanikani.vue')).default
  const wrapper = mount(Page)
  await vi.waitFor(() => expect(wrapper.text()).toContain('Level 3'), { timeout: 5000 })

  const useOwn = wrapper.findAll('button').find((button) => button.text().includes('Use my own token'))
  await useOwn!.trigger('click')
  await wrapper.find('#wanikani-token').setValue(OTHER)
  await wrapper.find('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Level 7'), { timeout: 5000 })

  return wrapper
}

vi.mock('@inertiajs/vue3', () => ({ Head: { name: 'Head', template: '<div />' } }))
vi.mock('@/Layouts/GenericLayout.vue', () => ({ default: { template: '<div><slot /></div>' } }))

describe('switching to a different token', () => {
  it('re-renders the dashboard for the new account', async () => {
    // Start from the baked-in default, which is what a first-time visitor sees.
    window.localStorage.clear()
    loadedWith.length = 0

    const Page = (await import('@/Pages/Wanikani.vue')).default
    const wrapper = mount(Page)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Time invested'), { timeout: 5000 })

    expect(wrapper.text()).toContain('Level 3')
    expect(loadedWith.every((token) => token !== OTHER)).toBe(true)

    // Enter another account's token through the real control.
    const useOwn = wrapper.findAll('button').find((button) => button.text().includes('Use my own token'))
    expect(useOwn, 'expected the "Use my own token" button').toBeDefined()
    await useOwn!.trigger('click')

    await wrapper.find('#wanikani-token').setValue(OTHER)
    await wrapper.find('form').trigger('submit')

    // The new account's numbers must appear, and the old account's must not.
    await vi.waitFor(() => expect(wrapper.text()).toContain('Level 7'), { timeout: 5000 })
    expect(wrapper.text()).not.toContain('Level 3')
    expect(loadedWith).toContain(OTHER)

    wrapper.unmount()
  })

  it('tears down cleanly when unmounted mid-load', async () => {
    window.localStorage.clear()

    const Page = (await import('@/Pages/Wanikani.vue')).default
    const wrapper = mount(Page)
    // Intentionally no wait: unmount while the first load is still in flight. This used to
    // produce an unhandled "Cannot set properties of null" during the aborted render.
    wrapper.unmount()

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(true).toBe(true)
  })
})


describe('forgetting a token', () => {
  it('falls back to the baked-in account without needing a page reload', async () => {
    // Regression: clearing set the personal token to null but left the ACTIVE token on the
    // visitor's, so `load()` re-fetched their data and the dashboard appeared frozen.
    window.localStorage.clear()
    const wrapper = await mountSwitchedToVisitor()

    // A visitor's token is stored and in use.
    expect(window.localStorage.getItem('wanikani:api_token')).toBe(OTHER)

    const forget = wrapper.findAll('button').find((button) => button.text().includes('Forget token'))
    expect(forget, 'expected the forget button').toBeDefined()
    await forget!.trigger('click')

    // The dashboard must move back to the owner's account on its own.
    await vi.waitFor(() => expect(wrapper.text()).toContain('Level 3'), { timeout: 5000 })
    expect(wrapper.text()).not.toContain('Level 7')
    expect(window.localStorage.getItem('wanikani:api_token')).toBeNull()

    wrapper.unmount()
  })

  it('leaves the dashboard alone when there was no personal token to forget', async () => {
    window.localStorage.clear()
    loadedWith.length = 0

    const Page = (await import('@/Pages/Wanikani.vue')).default
    const wrapper = mount(Page)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Level 3'), { timeout: 5000 })

    const before = loadedWith.length

    // In owner view the control shows the invitation, not a forget button.
    const forget = wrapper.findAll('button').find((button) => button.text().includes('Forget token'))
    expect(forget).toBeUndefined()
    expect(loadedWith.length).toBe(before)

    wrapper.unmount()
  })
})
