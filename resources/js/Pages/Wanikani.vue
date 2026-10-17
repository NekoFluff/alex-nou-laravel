<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import GenericLayout from '@/Layouts/GenericLayout.vue';
import ApiTokenControl from '@/Components/Wanikani/ApiTokenControl.vue';
import KpiRow from '@/Components/Wanikani/Stats/KpiRow.vue';
import AssumptionsPanel from '@/Components/Wanikani/Stats/AssumptionsPanel.vue';
import TimeInvestmentPanel from '@/Components/Wanikani/Stats/TimeInvestmentPanel.vue';
import CurrentLevelPanel from '@/Components/Wanikani/Stats/CurrentLevelPanel.vue';
import SrsBreakdown from '@/Components/Wanikani/Stats/SrsBreakdown.vue';
import LevelHeatmap from '@/Components/Wanikani/Stats/LevelHeatmap.vue';
import AccuracyPanel from '@/Components/Wanikani/Stats/AccuracyPanel.vue';
import ContentProgressPanel from '@/Components/Wanikani/Stats/ContentProgressPanel.vue';
import LeechesPanel from '@/Components/Wanikani/Stats/LeechesPanel.vue';
import ProgressBar from '@/Components/Wanikani/Stats/ProgressBar.vue';
import InfoTip from '@/Components/Wanikani/Stats/InfoTip.vue';
import {
    clearStoredToken,
    getBakedInToken,
    getStoredToken,
    setStoredToken,
    tokenCreationUrl,
} from '@/utils/wanikaniToken';
import { useWanikaniStats } from '@/composables/useWanikaniStats';
import { formatFreshness, formatNumber } from '@/domain/format';
import type { DownloadStep } from '@/api/loader';

/**
 * Which token the dashboard is currently reading.
 *
 * A visitor's own token always wins; otherwise the baked-in read-only token is used so
 * the page shows the site owner's stats by default. Set programmatically rather than
 * derived, because swapping it fires the composable's watcher and must do so exactly once.
 */
const activeToken = ref<string | null>(null);
const personalToken = ref<string | null>(null);

const bakedInToken = getBakedInToken();

const { stats, settings, isLoading, isRefreshing, error, progress, load, refresh, resetAssumptions, loadedAt } =
    useWanikaniStats(activeToken);

const downloadPercent = (download: DownloadStep): number => {
    if (download.status === 'done') {
        return 100;
    }
    return download.total > 0 ? (download.loaded / download.total) * 100 : download.status === 'active' ? 5 : 0;
};

/** Ticks so the freshness label ages while the page stays open. */
const now = ref(new Date());
const clock = window.setInterval(() => {
    now.value = new Date();
}, 30_000);
onBeforeUnmount(() => window.clearInterval(clock));

const hasToken = computed(() => activeToken.value !== null);
const showDashboard = computed(() => hasToken.value && stats.value !== null);

/** True while the dashboard is showing the baked-in account rather than the visitor's. */
const isViewingOwner = computed(() => personalToken.value === null && bakedInToken !== null);

const handleSaveToken = (token: string) => {
    setStoredToken(token);
    personalToken.value = token;
    // Swapping the value triggers the composable's watcher; re-loading here as well would
    // abort this request and surface an abort error.
    activeToken.value = token;
};

const handleClearToken = () => {
    clearStoredToken();
    personalToken.value = null;

    /*
     * The active token has to move back to the baked-in account, not just the personal one
     * to null.
     *
     * `load()` reads the active token, so leaving it pointing at the visitor's token meant
     * "forget token" faithfully re-fetched *their* data — the dashboard looked frozen and
     * only a full page reload, which re-seeds from the baked-in token, fixed it. Assigning
     * it here fires the watcher exactly once, so there is no explicit `load()` to race.
     */
    activeToken.value = bakedInToken;
};

onMounted(() => {
    const stored = getStoredToken();
    if (stored) {
        personalToken.value = stored;
        // Assigning the token is enough: the composable watches it and starts the load.
        // Calling load() here as well started a second request that aborted the first.
        activeToken.value = stored;
        return;
    }

    if (bakedInToken) {
        // Seed the ref before the watcher exists so mounting issues one request, then
        // load the owner's stats.
        activeToken.value = bakedInToken;
        void load();
    }
});
</script>

<template>
    <Head title="WaniKani Progress" />
    <GenericLayout>
        <div class="px-4 py-16 mx-auto max-w-7xl sm:px-8">
            <div class="flex flex-wrap items-end justify-between gap-4 mx-4">
                <div>
                    <p class="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        Progress Tracker
                    </p>
                    <h1 class="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        WaniKani
                    </h1>
                    <p class="mt-2 text-sm text-gray-500 sm:text-base">
                        Study time, level pace and accuracy.
                    </p>
                </div>

                <div v-if="showDashboard" class="flex items-center gap-2">
                    <span v-if="loadedAt" class="text-[11px] text-gray-400">
                        Data loaded {{ formatFreshness(loadedAt, now) }}
                    </span>
                    <button
                        type="button"
                        class="grid h-[30px] w-[30px] text-base leading-none text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg place-items-center hover:border-indigo-400 hover:text-gray-900 disabled:opacity-50"
                        :disabled="isRefreshing"
                        :aria-label="isRefreshing ? 'Refreshing' : 'Refresh'"
                        :title="isRefreshing ? 'Refreshing…' : 'Refresh'"
                        @click="refresh"
                    >
                        <svg
                            class="size-3.5"
                            :class="isRefreshing ? 'animate-spin' : ''"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <path d="M21 3v6h-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="px-3 py-1.5 text-xs font-medium transition-colors border rounded-lg"
                        :class="
                            settings.isPanelOpen
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-gray-900'
                        "
                        :aria-pressed="settings.isPanelOpen"
                        @click="settings.isPanelOpen = !settings.isPanelOpen"
                    >
                        Settings
                    </button>
                </div>
            </div>

            <div class="mx-4 mt-6">
                <ApiTokenControl
                    :has-token="hasToken"
                    :loading="isLoading"
                    :error="error"
                    :is-owner-view="isViewingOwner"
                    @save="handleSaveToken"
                    @clear="handleClearToken"
                />
            </div>

            <!-- First load pulls ~20 pages, so progress is shown honestly. -->
            <div v-if="isLoading && !stats" class="p-6 mx-4 mt-8 bg-white border border-gray-200 rounded-xl">
                <p class="text-sm font-semibold text-gray-800">
                    {{ progress.label || 'Loading WaniKani data' }}
                </p>

                <!-- Each collection downloads in parallel, so each gets its own row and bar. -->
                <ul v-if="progress.downloads?.length" class="mt-4 space-y-3">
                    <li v-for="download in progress.downloads" :key="download.key" :data-download="download.key">
                        <div class="flex items-baseline justify-between gap-3 text-xs">
                            <span :class="download.status === 'pending' ? 'text-gray-400' : 'text-gray-700'">
                                {{ download.label }}
                            </span>
                            <span class="tabular-nums text-gray-400 shrink-0">
                                <template v-if="download.status === 'done' && download.cached">Up to date</template>
                                <template v-else-if="download.total > 0">
                                    {{ formatNumber(download.loaded) }} / {{ formatNumber(download.total) }}
                                </template>
                                <template v-else-if="download.status === 'active'">Starting…</template>
                                <template v-else>Waiting</template>
                            </span>
                        </div>
                        <div class="mt-1.5">
                            <ProgressBar
                                :value="downloadPercent(download)"
                                :color="download.status === 'done' ? '#10b981' : '#6366f1'"
                                :height="4"
                            />
                        </div>
                    </li>
                </ul>
                <p v-else class="mt-1 text-xs text-gray-500">This first load can take a moment.</p>
            </div>

            <!--
                A token is present but the load failed. Without this branch the body would
                render nothing at all, leaving the failure visible only inside the token
                control. Errors are recoverable, so this offers the retry.
            -->
            <div
                v-else-if="hasToken && error"
                role="alert"
                class="p-6 mx-4 mt-8 bg-white border rounded-xl border-red-200"
            >
                <h2 class="text-sm font-semibold text-red-800">Could not load your WaniKani data</h2>
                <p class="mt-1 text-xs leading-relaxed text-red-700">{{ error }}</p>
                <button
                    type="button"
                    class="mt-4 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:text-gray-900"
                    @click="load()"
                >
                    Try again
                </button>
                <p class="mt-3 text-[11px] text-gray-400">
                    Or use “Forget token” above to go back to the public level-pace view.
                </p>
            </div>

            <!-- Full dashboard, when a token is available. -->
            <template v-else-if="showDashboard && stats">
                <div class="mx-4 mt-6 space-y-4">
                    <AssumptionsPanel :stats="stats" :settings="settings" @reset="resetAssumptions" />

                    <!-- The answer, stated plainly. -->
                    <section class="p-6 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
                        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
                            <div>
                                <p class="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                    The short version
                                </p>
                                <h2 class="mt-2 text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl">
                                    You have spent
                                    <span class="text-pink-600">
                                        {{ Math.round(stats.invested.totalMs / 3_600_000).toLocaleString() }}h
                                    </span>
                                    learning Japanese.
                                </h2>
                                <p class="max-w-2xl mt-3 text-sm leading-relaxed text-gray-500">
                                    You have unlocked
                                    {{ stats.curriculumProgress.toFixed(1) }}% of everything there is to
                                    learn.
                                    <template v-if="stats.projection.levelsRemaining > 0">
                                        At your recent pace of
                                        {{ stats.projection.daysPerLevel.toFixed(1) }} days per level
                                        you reach level 60 around
                                        <strong class="text-gray-800">{{
                                            stats.projection.etaByLevelPace?.toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })
                                        }}</strong
                                        >.
                                    </template>
                                    <template v-else> You have reached the final level. </template>
                                </p>
                            </div>

                            <div class="p-4 bg-gray-50 rounded-xl">
                                <div class="flex items-baseline justify-between text-xs">
                                    <span class="flex items-center gap-1.5 text-gray-500">
                                        WaniKani unlock progress
                                        <InfoTip
                                            text="The share of all WaniKani items you have unlocked."
                                        />
                                    </span>
                                    <span class="font-semibold tabular-nums text-gray-900">
                                        {{ stats.curriculumProgress.toFixed(1) }}%
                                    </span>
                                </div>
                                <div class="mt-2">
                                    <ProgressBar
                                        :value="stats.curriculumProgress"
                                        color="#6366f1"
                                        :height="10"
                                    />
                                </div>
                                <dl class="grid grid-cols-2 gap-3 mt-4 text-xs">
                                    <div>
                                        <dt class="text-gray-400">Items completed</dt>
                                        <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">
                                            {{ formatNumber(stats.counts.burned) }}
                                            <span class="text-[10px] font-normal text-gray-400">burned</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-gray-400">Items unlocked</dt>
                                        <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">
                                            {{ formatNumber(stats.counts.unlocked) }}
                                            <span class="text-[10px] font-normal text-gray-400">
                                                / {{ formatNumber(stats.counts.total) }}
                                            </span>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </section>

                    <KpiRow :stats="stats" :settings="settings" />

                    <!-- Where things stand right now. -->
                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <CurrentLevelPanel :stats="stats" />
                        <SrsBreakdown :stats="stats" />
                    </div>

                    <!-- How it got here. -->
                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <LevelHeatmap :stats="stats" />
                        <div class="grid min-w-0 grid-cols-1 gap-4 content-start">
                            <TimeInvestmentPanel :stats="stats" :settings="settings" />
                            <AccuracyPanel :stats="stats" />
                        </div>
                    </div>

                    <ContentProgressPanel :stats="stats" />

                    <LeechesPanel :stats="stats" :settings="settings" />
                </div>
            </template>

            <!--
                No token yet. The dashboard needs the visitor's own token, so this explains
                what it does and how to get one rather than showing someone else's data.
            -->
            <div v-else-if="!hasToken" class="p-6 mx-4 mt-8 bg-white border border-gray-200 rounded-xl sm:p-8">
                <h2 class="text-lg font-semibold text-gray-900">Your WaniKani year in numbers</h2>
                <p class="max-w-2xl mt-2 text-sm leading-relaxed text-gray-500">
                    Paste an API token above and this page works out how long you have actually
                    spent studying, how long is left, when you will reach level 60, which items
                    keep tripping you up, and where the hours went.
                </p>

                <ol class="max-w-2xl mt-5 space-y-2.5 text-sm text-gray-600">
                    <li class="flex gap-3">
                        <span
                            class="grid text-xs font-bold text-gray-500 bg-gray-100 rounded-full size-5 shrink-0 place-items-center"
                            >1</span
                        >
                        <span>
                            Open
                            <a
                                :href="tokenCreationUrl()"
                                target="_blank"
                                rel="noreferrer noopener"
                                class="font-medium text-indigo-600 hover:underline"
                                >WaniKani's token page</a
                            >.
                        </span>
                    </li>
                    <li class="flex gap-3">
                        <span
                            class="grid text-xs font-bold text-gray-500 bg-gray-100 rounded-full size-5 shrink-0 place-items-center"
                            >2</span
                        >
                        <span>
                            Generate a token with the read permissions. The default permissions are
                            already enough — nothing needs to be enabled for writing.
                        </span>
                    </li>
                    <li class="flex gap-3">
                        <span
                            class="grid text-xs font-bold text-gray-500 bg-gray-100 rounded-full size-5 shrink-0 place-items-center"
                            >3</span
                        >
                        <span>Paste it above. It is stored in this browser only.</span>
                    </li>
                </ol>

                <p class="max-w-2xl px-4 py-3 mt-6 text-xs leading-relaxed text-gray-500 bg-gray-50 rounded-xl">
                    <strong class="text-gray-700">Where your token goes:</strong>
                    only to <code class="text-gray-700">api.wanikani.com</code>, directly from your
                    browser — it is never sent to this site's server. Signing out removes it.
                </p>
            </div>
        </div>
    </GenericLayout>
</template>
