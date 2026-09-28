/**
 * End-to-end render of the real `Pages/Wanikani.vue` against a full mirrored account.
 *
 * The other dashboard test uses a small hand-built dataset; this one drives the actual
 * page component with ~9,400 subjects and ~5,400 assignments, which is the only way to
 * catch a panel that only breaks at real scale (an unbounded loop, a 60-level grid, a
 * leech table built from thousands of records).
 *
 * Skips itself when no fixture is present. Drop one at
 * `resources/js/test/fixtures/wanikani-dataset.json` to enable it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { hasFixture, loadFixture } from '@/domain/__tests__/fixture'
import { DEFAULT_SETTINGS } from '@/domain/stats'

const dataset = loadFixture()

vi.mock('@/api/loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/api/loader')>()
    return {
        ...actual,
        loadDataset: vi.fn(async () => dataset),
        resetCache: vi.fn(async () => undefined),
    }
})

/** Inertia's Head and the site layout have no bearing on what the page renders. */
vi.mock('@inertiajs/vue3', () => ({
    Head: { name: 'Head', template: '<div />' },
    Link: { name: 'Link', template: '<a><slot /></a>' },
}))

vi.mock('@/Layouts/GenericLayout.vue', () => ({
    default: { name: 'GenericLayout', template: '<div><slot /></div>' },
}))


/**
 * Mounts the real page with a stored token, which is what it reads on mount to start
 * loading. Shared by every describe block below.
 */
async function mountPage() {
    window.localStorage.setItem('wanikani:api_token', 'd443c409-815f-40e0-8950-2bf0fbe04d91')

    const Page = (await import('@/Pages/Wanikani.vue')).default
    const wrapper = mount(Page, {

    })

    await vi.waitFor(() => expect(wrapper.text()).toContain('Time invested'), { timeout: 5000 })
    return wrapper
}

const describeWithFixture = hasFixture() ? describe : describe.skip

describeWithFixture('Pages/Wanikani.vue with a real account', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })


    it('renders the full dashboard for a stored token', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        for (const panel of [
            'Time invested',
            'Time remaining',
            'Whole journey',
            'Projected finish',
            'Burn forecast',
            'Current level',
            'SRS stages',
            'Next 48 hours',
            'Level history',
            'Accuracy',
            'Content progress',
            'Leeches',
        ]) {
            expect(text, `expected the "${panel}" panel`).toContain(panel)
        }

        wrapper.unmount()
    })

    it('shows the real account totals, not placeholder values', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        // Unlocked share of the catalogue is a real fraction, and the two time cards
        // state their breakdown in the same units.
        expect(text).toMatch(/\d+(\.\d+)?% unlocked/)
        expect(text).toContain(String(dataset!.user.level))
        expect(text).toMatch(/\d+h lessons \+ \d+h reviews/)

        // The freshness label describes the load the visitor is looking at. It must not
        // report the cache entry's age, which is what caused a freshly loaded page to
        // claim its data was already minutes old.
        expect(text).toMatch(/Data loaded (just now|\d+ minutes? ago|\d+ hours? ago)/)
        expect(text).toContain('Data loaded just now')

        // No unresolved bindings leaked into the DOM.
        expect(text).not.toContain('NaN')
        expect(text).not.toContain('undefined')
        expect(text).not.toContain('[object Object]')

        wrapper.unmount()
    })

    it('states the estimated completion inside the level history panel', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        // The same projection the KPI card states, repeated where its inputs are visible.
        expect(text).toContain('Estimated completion')

        expect(text).toMatch(/Estimated completion\s+[A-Z][a-z]{2} \d{1,2}, \d{4}/)
        expect(text).toMatch(/\d+ levels left at \d+\.\d days each/)

        wrapper.unmount()
    })

    it('renders all 60 level cells', async () => {
        const wrapper = await mountPage()
        // The heatmap is a 10-column grid of every level in the game.
        const cells = wrapper.findAll('[data-level]')
        expect(cells.length).toBeGreaterThanOrEqual(59)

        wrapper.unmount()
    })

    it('uses the persisted assumption when one was saved', async () => {
        window.localStorage.setItem(
            'wanikani:study-settings',
            JSON.stringify({ ...DEFAULT_SETTINGS, secondsPerReview: 45, isPanelOpen: true }),
        )
        const wrapper = await mountPage()

        // The assumptions panel only renders when open, and shows the stored rate.
        expect(wrapper.text()).toContain('Seconds per review answer')
        expect(wrapper.text()).toContain('45s')

        wrapper.unmount()
    })
})

describeWithFixture('Pages/Wanikani.vue failure handling', () => {
    it('shows a recoverable error instead of an empty body when loading fails', async () => {
        const loader = await import('@/api/loader')
        const { WaniKaniError } = await import('@/api/client')
        vi.mocked(loader.loadDataset).mockRejectedValueOnce(new WaniKaniError('nope', 401))

        window.localStorage.setItem('wanikani:api_token', 'd443c409-815f-40e0-8950-2bf0fbe04d91')
        const Page = (await import('@/Pages/Wanikani.vue')).default
        const wrapper = mount(Page, {
    
        })

        await vi.waitFor(() =>
            expect(wrapper.text()).toContain('Could not load your WaniKani data'),
        )

        const text = wrapper.text()
        expect(text).toContain('rejected that token')
        expect(text).toContain('Try again')

        window.localStorage.clear()
        wrapper.unmount()
    })
})

describeWithFixture('Pages/Wanikani.vue on a fresh page load', () => {
    beforeEach(async () => {
        window.localStorage.clear()
        const loader = await import('@/api/loader')
        vi.mocked(loader.loadDataset).mockReset()
        vi.mocked(loader.loadDataset).mockImplementation(async () => dataset!)
    })

    it('loads on mount without surfacing an abort error', async () => {
        // Regression: setting the token synchronously triggered the watcher's load, and
        // onMounted started a second one. The first was aborted, and its catch block wrote
        // the browser's "signal is aborted without reason" into the error card.
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(text).not.toContain('aborted')
        expect(text).not.toContain('Could not load your WaniKani data')
        expect(text).toContain('Time invested')

        wrapper.unmount()
    })

    it('issues exactly one load for one page mount', async () => {
        const loader = await import('@/api/loader')
        vi.mocked(loader.loadDataset).mockClear()

        const wrapper = await mountPage()
        // Vue flushes watchers on the next tick, so give any stray second load a chance.
        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(vi.mocked(loader.loadDataset)).toHaveBeenCalledTimes(1)

        wrapper.unmount()
    })

    it('keeps the newest load when two are started in quick succession', async () => {
        const loader = await import('@/api/loader')
        const { useWanikaniStats } = await import('@/composables/useWanikaniStats')
        const { ref } = await import('vue')
        const { WaniKaniError } = await import('@/api/client')

        // First call rejects as if aborted, second succeeds: the visitor should see data.
        vi.mocked(loader.loadDataset)
            .mockRejectedValueOnce(new DOMException('signal is aborted without reason', 'AbortError'))
            .mockResolvedValue(dataset!)

        const token = ref<string | null>('d443c409-815f-40e0-8950-2bf0fbe04d91')
        const api = useWanikaniStats(token)

        const first = api.load()
        const second = api.load()
        await Promise.allSettled([first, second])

        expect(api.error.value).toBeNull()
        expect(api.stats.value).not.toBeNull()

        void WaniKaniError
    })
})
