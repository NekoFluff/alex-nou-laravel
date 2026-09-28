<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
    hasToken: boolean;
    loading: boolean;
    error: string | null;
    /** True when the token has no stored owner, so the baked-in account is showing. */
    isOwnerView: boolean;
}>();

const emit = defineEmits<{
    save: [token: string];
    clear: [];
}>();

const showForm = ref(false);
const draftToken = ref('');
const revealToken = ref(false);

/**
 * Which of the three mutually exclusive states to show.
 *
 * This used to be a hand-written `v-if` / `v-else-if` / `v-else` chain over `showForm`,
 * `hasToken` and `isOwnerView`. Submitting the form changes two of those in the same tick
 * (the form closes *and* `isOwnerView` flips), and Vue's patch lost track of the nodes —
 * "Cannot read properties of null (reading 'nextSibling')" — which aborted the render and
 * left the dashboard showing the previous account. Reducing it to one value makes the
 * branches unambiguous, and the keyed containers below let Vue swap them wholesale.
 */
/**
 * Titles are single interpolations rather than `<template v-if>` chains. Adjacent text
 * nodes inside a conditional branch are what Vue 3.4 failed to patch when the branch was
 * removed, which aborted the render.
 */
const inviteTitle = computed(() => {
    if (props.isOwnerView && props.loading) return "Syncing the site owner's progress…";
    if (props.isOwnerView) return "Showing the site owner's progress";
    return 'Want to see your own progress?';
});

const statusTitle = computed(() => {
    if (props.loading) return 'Syncing your progress…';
    if (props.error) return "Couldn't load your progress";
    return 'Viewing your own progress';
});

const mode = computed<'invite' | 'form' | 'status'>(() => {
    if (showForm.value) return 'form';
    if (!props.hasToken || props.isOwnerView) return 'invite';
    return 'status';
});

const openForm = () => {
    showForm.value = true;
};

const cancelForm = () => {
    showForm.value = false;
    draftToken.value = '';
};

const submit = () => {
    const trimmed = draftToken.value.trim();
    if (!trimmed) return;
    emit('save', trimmed);
    draftToken.value = '';
    showForm.value = false;
};
</script>

<template>
    <div class="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-5">
        <!--
            No token of their own: either nothing is configured, or the baked-in account is
            showing. Both want the same invitation, which is why this is not gated on
            `hasToken` — with a baked-in token that is always true.
        -->
        <div
            :class="mode === 'invite' ? 'flex' : 'hidden'"
            :inert="mode !== 'invite'"
            data-state="invite"
            class="flex-wrap items-center justify-between gap-3"
        >
            <div>
                <p class="text-sm font-medium text-gray-700">{{ inviteTitle }}</p>
                <p class="mt-0.5 text-xs text-gray-400">
                    Connect your WaniKani API token to see stats for your own account instead.
                </p>
            </div>
            <button
                type="button"
                class="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                @click="openForm"
            >
                Use my own token
            </button>
        </div>

        <!-- Token entry form -->
        <form
            :class="mode === 'form' ? 'block' : 'hidden'"
            :inert="mode !== 'form'"
            data-state="form"
            class="space-y-2"
            @submit.prevent="submit"
        >
            <label for="wanikani-token" class="block text-sm font-medium text-gray-700">
                WaniKani API token
            </label>
            <div class="flex gap-2">
                <input
                    id="wanikani-token"
                    v-model="draftToken"
                    :type="revealToken ? 'text' : 'password'"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    class="block w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                    type="button"
                    class="px-2 text-xs text-gray-400 border border-gray-200 rounded-lg hover:text-gray-600"
                    @click="revealToken = !revealToken"
                >
                    {{ revealToken ? 'Hide' : 'Show' }}
                </button>
            </div>
            <p class="text-xs text-gray-400">
                Stored only in your browser's local storage — it's never sent to this site's server, only directly
                to WaniKani. Grab a
                <a
                    href="https://www.wanikani.com/settings/personal_access_tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-indigo-600 underline hover:text-indigo-700"
                >read-only token here</a>.
            </p>
            <div class="flex gap-2">
                <button
                    type="submit"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                    :disabled="!draftToken.trim()"
                >
                    Connect
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                    @click="cancelForm"
                >
                    Cancel
                </button>
            </div>
        </form>

        <!-- The visitor's own token is in use: report its state. -->
        <div
            :class="mode === 'status' ? 'flex' : 'hidden'"
            :inert="mode !== 'status'"
            data-state="status"
            class="flex-wrap items-center justify-between gap-3"
        >
            <div class="flex items-center gap-2">
                <span
                    v-if="loading"
                    class="inline-block w-3.5 h-3.5 border-2 border-indigo-300 rounded-full border-t-indigo-600 animate-spin"
                />
                <span
                    v-else
                    class="inline-block w-2 h-2 rounded-full"
                    :class="error ? 'bg-amber-500' : 'bg-green-500'"
                />
                <p class="text-sm font-medium text-gray-700">{{ statusTitle }}</p>
            </div>
            <button
                v-if="!isOwnerView"
                type="button"
                class="px-3 py-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                @click="emit('clear')"
            >
                Forget token
            </button>
        </div>

        <p v-if="error" class="flex flex-wrap items-center gap-2 mt-3 text-xs text-amber-700">
            <span class="font-medium">{{ error }} Showing the site owner's progress below instead.</span>
            <button type="button" class="underline hover:text-amber-900" @click="emit('clear')">
                Remove token
            </button>
        </p>
    </div>
</template>
