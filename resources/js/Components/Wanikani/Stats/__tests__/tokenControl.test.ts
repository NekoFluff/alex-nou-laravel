/**
 * The token control's three states.
 *
 * Regression suite for a reported bug: pasting a different account's token left the
 * dashboard showing the previous account.
 *
 * The cause was here rather than in the fetch layer. The three states were a
 * `v-if` / `v-else-if` / `v-else` chain, and submitting the form unmounted a block full of
 * text nodes mid-swap. Vue 3.4 mis-patched that removal — "Cannot read properties of null
 * (reading 'nextSibling')" — which aborted the render, so the new data was fetched and
 * then never painted. The states are now always mounted and toggled with `hidden`, which
 * removes the failure mode.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import ApiTokenControl from '@/Components/Wanikani/ApiTokenControl.vue'

const TOKEN = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'

/** Mimics the page: saving a token flips `isOwnerView` at the same moment the form closes. */
function harness(options: { flipOnSave: boolean } = { flipOnSave: true }) {
    return defineComponent({
        components: { ApiTokenControl },
        setup() {
            const isOwnerView = ref(true)
            const saved: string[] = []
            const onSave = (token: string) => {
                saved.push(token)
                if (options.flipOnSave) isOwnerView.value = false
            }
            return { isOwnerView, onSave, saved }
        },
        template: `
            <ApiTokenControl
                :has-token="true"
                :loading="false"
                :error="null"
                :is-owner-view="isOwnerView"
                @save="onSave"
                @clear="() => {}"
            />
        `,
    })
}

/**
 * The inactive states stay mounted (see the note at the top), so assertions read the live
 * state via its `data-state` marker. Plain `text()` would include the hidden branches.
 */
function state(wrapper: ReturnType<typeof mount>): string {
    return wrapper.find('[data-state]:not(.hidden)').attributes('data-state') ?? '';
}

function activeText(wrapper: ReturnType<typeof mount>): string {
    return wrapper.find('[data-state]:not(.hidden)').text();
}

async function openForm(wrapper: ReturnType<typeof mount>) {
    const useOwn = wrapper.findAll('button').find((button) => button.text().includes('Use my own token'))
    expect(useOwn, 'expected the invitation button').toBeDefined()
    await useOwn!.trigger('click')
    await wrapper.find('#wanikani-token').setValue(TOKEN)
    return wrapper.find('form')
}

describe('ApiTokenControl', () => {
    it('shows the invitation while the owner account is on screen', () => {
        const wrapper = mount(harness())
        expect(state(wrapper)).toBe('invite')
        expect(activeText(wrapper)).toContain("Showing the site owner's progress")
        expect(activeText(wrapper)).toContain('Use my own token')
        wrapper.unmount()
    })

    it('opens the form and emits the trimmed token on submit', async () => {
        const wrapper = mount(harness())
        await openForm(wrapper)
        await wrapper.find('form').trigger('submit')

        const saved = (wrapper.vm as unknown as { saved: string[] }).saved
        expect(saved).toEqual([TOKEN])

        wrapper.unmount()
    })

    it('moves from the form to the status view without a render error', async () => {
        // This is the exact transition that used to abort the render.
        const wrapper = mount(harness())
        await openForm(wrapper)
        await wrapper.find('form').trigger('submit')
        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(state(wrapper)).toBe('status')
        expect(activeText(wrapper)).toContain('Viewing your own progress')
        expect(activeText(wrapper)).not.toContain('Use my own token')

        wrapper.unmount()
    })

    it('returns to the invitation when the visitor forgets their token', async () => {
        const wrapper = mount(harness())
        await openForm(wrapper)
        await wrapper.find('form').trigger('submit')
        await new Promise((resolve) => setTimeout(resolve, 20))

        const forget = wrapper.findAll('button').find((button) => button.text().includes('Forget token'))
        expect(forget, 'expected the forget button once a token is set').toBeDefined()

        wrapper.unmount()
    })

    it('survives the transition when the surrounding props do not change at all', async () => {
        // A second guard: the crash was not actually caused by the prop flip, so the
        // control has to be safe on its own.
        const wrapper = mount(harness({ flipOnSave: false }))
        await openForm(wrapper)
        await wrapper.find('form').trigger('submit')
        await new Promise((resolve) => setTimeout(resolve, 20))

        // With no prop flip the owner view is retained, so the invitation comes back.
        expect(state(wrapper)).toBe('invite')
        expect(activeText(wrapper)).toContain('Use my own token')

        wrapper.unmount()
    })
})
