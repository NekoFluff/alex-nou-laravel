<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    hasToken: boolean;
    loading: boolean;
    error: string | null;
}>();

const emit = defineEmits<{
    save: [token: string];
    clear: [];
}>();

const showForm = ref(false);
const draftToken = ref('');
const revealToken = ref(false);

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
        <!-- Viewing someone else's data, no personal token set -->
        <div v-if="!hasToken && !showForm" class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="text-sm font-medium text-gray-700">Want to see your own progress?</p>
                <p class="mt-0.5 text-xs text-gray-400">
                    Connect your WaniKani API token to view your own stats here.
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
        <form v-else-if="showForm" class="space-y-2" @submit.prevent="submit">
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

        <!-- Token set: show status -->
        <div v-else class="flex flex-wrap items-center justify-between gap-3">
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
                <p class="text-sm font-medium text-gray-700">
                    {{ loading ? 'Syncing your progress…' : error ? "Couldn't load your progress" : 'Viewing your own progress' }}
                </p>
            </div>
            <button
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
