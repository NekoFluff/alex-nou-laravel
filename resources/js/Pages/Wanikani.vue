<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import GenericLayout from '@/Layouts/GenericLayout.vue';
import WanikaniStats from '@/Components/Wanikani/WanikaniStats.vue';
import CurrentLevelProgress from '@/Components/Wanikani/CurrentLevelProgress.vue';
import PaceBarChartApex from '@/Components/Wanikani/PaceBarChartApex.vue';
import LevelHistory from '@/Components/Wanikani/LevelHistory.vue';
import { LevelProgression } from '@/types/levelProgression';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
}>();

const goalDays = 14;

const currentProgression = computed(() =>
    props.levelProgressions.find((lp) => lp.level === props.currentLevel),
);

const projectionMode = ref<'median' | 'average'>('median');
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
                Tracking my WaniKani level-up pace against a {{ goalDays }}-day-per-level goal.
            </p>

            <div class="mx-4 mt-8">
                <WanikaniStats
                    :level-progressions="levelProgressions"
                    :current-level="currentLevel"
                    v-model:projection-mode="projectionMode"
                />
            </div>

            <div class="mx-4 mt-6">
                <CurrentLevelProgress
                    :current-progression="currentProgression"
                    :current-level="currentLevel"
                    :goal-days="goalDays"
                />
            </div>

            <div class="mx-4 mt-6">
                <PaceBarChartApex :level-progressions="levelProgressions" :goal-days="goalDays" />
            </div>

            <div class="mx-4 mt-6">
                <h2 class="mb-3 text-lg font-semibold text-gray-800">Level history</h2>
                <LevelHistory
                    :level-progressions="levelProgressions"
                    :current-level="currentLevel"
                    :goal-days="goalDays"
                    :projection-mode="projectionMode"
                />
            </div>
        </div>
    </GenericLayout>
</template>
