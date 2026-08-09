<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import GenericLayout from '@/Layouts/GenericLayout.vue';
import WanikaniStats from '@/Components/Wanikani/WanikaniStats.vue';
import CurrentLevelProgress from '@/Components/Wanikani/CurrentLevelProgress.vue';
import PaceBarChartApex from '@/Components/Wanikani/PaceBarChartApex.vue';
import LevelHistory from '@/Components/Wanikani/LevelHistory.vue';
import ApiTokenControl from '@/Components/Wanikani/ApiTokenControl.vue';
import { LevelProgression } from '@/types/levelProgression';
import { ProjectionMode } from '@/types/projectionMode';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/utils/wanikaniToken';
import { fetchItemCountsByLevel, fetchLevelProgressions, WanikaniApiError } from '@/utils/wanikaniApiClient';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
    itemCountsByLevel: Record<number, number>;
}>();

const goalDays = 14;
const itemsPerDay = 15;

const projectionMode = ref<ProjectionMode>('median');

const personalToken = ref<string | null>(null);
const personalLevelProgressions = ref<LevelProgression[] | null>(null);
const personalItemCounts = ref<Record<number, number> | null>(null);
const loadingPersonalData = ref(false);
const personalDataError = ref<string | null>(null);

const usingPersonalData = computed(() => personalToken.value !== null && personalLevelProgressions.value !== null);

const loadPersonalData = async (token: string) => {
    loadingPersonalData.value = true;
    personalDataError.value = null;
    try {
        const [levelProgressionsResult, itemCountsResult] = await Promise.all([
            fetchLevelProgressions(token),
            fetchItemCountsByLevel(token),
        ]);
        personalLevelProgressions.value = levelProgressionsResult;
        personalItemCounts.value = itemCountsResult;
    } catch (e) {
        personalDataError.value = e instanceof WanikaniApiError ? e.message : 'Could not load your WaniKani data. Please try again.';
    } finally {
        loadingPersonalData.value = false;
    }
};

const handleSaveToken = (token: string) => {
    setStoredToken(token);
    personalToken.value = token;
    loadPersonalData(token);
};

const handleClearToken = () => {
    clearStoredToken();
    personalToken.value = null;
    personalLevelProgressions.value = null;
    personalItemCounts.value = null;
    personalDataError.value = null;
};

onMounted(() => {
    const stored = getStoredToken();
    if (stored) {
        personalToken.value = stored;
        loadPersonalData(stored);
    }
});

const activeLevelProgressions = computed(() =>
    usingPersonalData.value ? (personalLevelProgressions.value ?? []) : props.levelProgressions,
);

const activeItemCountsByLevel = computed(() =>
    usingPersonalData.value ? (personalItemCounts.value ?? {}) : props.itemCountsByLevel,
);

const activeCurrentLevel = computed(() => {
    if (!usingPersonalData.value) return props.currentLevel;
    const progressions = personalLevelProgressions.value;
    return progressions && progressions.length ? progressions[progressions.length - 1].level : props.currentLevel;
});

const currentProgression = computed(() =>
    activeLevelProgressions.value.find((lp) => lp.level === activeCurrentLevel.value),
);
</script>

<template>
    <Head title="WaniKani Progress" />
    <GenericLayout>
        <div class="px-4 py-16 mx-auto max-w-7xl sm:px-8">
            <p class="mx-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">Progress Tracker</p>
            <h1 class="mx-4 mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                WaniKani
            </h1>
            <p class="mx-4 mt-2 text-sm text-gray-500 sm:text-base">
                <template v-if="usingPersonalData">Tracking your WaniKani level-up pace against a {{ goalDays }}-day-per-level goal.</template>
                <template v-else>Tracking my WaniKani level-up pace against a {{ goalDays }}-day-per-level goal.</template>
            </p>

            <div class="mx-4 mt-6">
                <ApiTokenControl
                    :has-token="personalToken !== null"
                    :loading="loadingPersonalData"
                    :error="personalDataError"
                    @save="handleSaveToken"
                    @clear="handleClearToken"
                />
            </div>

            <div class="mx-4 mt-8">
                <WanikaniStats
                    :level-progressions="activeLevelProgressions"
                    :current-level="activeCurrentLevel"
                    :item-counts-by-level="activeItemCountsByLevel"
                    :items-per-day="itemsPerDay"
                    :goal-days="goalDays"
                    v-model:projection-mode="projectionMode"
                />
            </div>

            <div class="mx-4 mt-6">
                <CurrentLevelProgress
                    :current-progression="currentProgression"
                    :current-level="activeCurrentLevel"
                    :goal-days="goalDays"
                />
            </div>

            <div class="mx-4 mt-6">
                <PaceBarChartApex :level-progressions="activeLevelProgressions" :goal-days="goalDays" />
            </div>

            <div class="mx-4 mt-6">
                <h2 class="mb-3 text-lg font-semibold text-gray-800">Level history</h2>
                <LevelHistory
                    :level-progressions="activeLevelProgressions"
                    :current-level="activeCurrentLevel"
                    :goal-days="goalDays"
                    :projection-mode="projectionMode"
                    :item-counts-by-level="activeItemCountsByLevel"
                    :items-per-day="itemsPerDay"
                />
            </div>
        </div>
    </GenericLayout>
</template>
