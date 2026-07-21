<script setup lang="ts">
import { LevelProgression } from '@/types/levelProgression';
import { addDays, diffDays } from '@/utils/date';
import { average, median } from '@/utils/pace';
import { daysForLevel } from '@/utils/itemPace';
import { computed } from 'vue';

type ProjectionMode = 'median' | 'average' | 'items';

const projectionModes: ProjectionMode[] = ['median', 'average', 'items'];

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
    projectionMode: ProjectionMode;
    itemCountsByLevel: Record<number, number>;
    itemsPerDay: number;
}>();

const emit = defineEmits<{
    'update:projectionMode': [mode: ProjectionMode];
}>();

const completedLevels = computed(() =>
    props.levelProgressions
        .filter((lp) => lp.started_at && lp.passed_at)
        .sort((a, b) => a.level - b.level),
);

const currentProgression = computed(() =>
    props.levelProgressions.find((lp) => lp.level === props.currentLevel),
);

const durations = computed(() =>
    completedLevels.value.map((lp) => diffDays(lp.started_at, lp.passed_at)),
);

const recentDurations = computed(() => durations.value.slice(-10));

const averagePace = computed(() => {
    const avg = average(recentDurations.value);
    return avg === null ? null : Math.round(avg * 10) / 10;
});

const medianPace = computed(() => median(durations.value));

const fallbackPace = computed(() => medianPace.value ?? 14);

const toggleProjectionMode = () => {
    const nextIndex = (projectionModes.indexOf(props.projectionMode) + 1) % projectionModes.length;
    emit('update:projectionMode', projectionModes[nextIndex]);
};

const projectedLevel60Date = computed(() => {
    if (props.currentLevel >= 60) return null;
    const anchor = currentProgression.value?.started_at ? new Date(currentProgression.value.started_at) : new Date();

    if (props.projectionMode === 'items') {
        let totalDays = 0;
        for (let level = props.currentLevel; level <= 60; level++) {
            totalDays += daysForLevel(level, props.itemCountsByLevel, props.itemsPerDay, fallbackPace.value);
        }
        return addDays(anchor, totalDays);
    }

    const pace = props.projectionMode === 'median' ? medianPace.value : averagePace.value;
    if (!pace) return null;
    const levelsToComplete = 60 - props.currentLevel + 1;
    return addDays(anchor, pace * levelsToComplete);
});

const projectionModeLabel = computed(() =>
    props.projectionMode === 'items' ? `${props.itemsPerDay} items/day` : `${props.projectionMode} pace`,
);

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<template>
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="p-4 text-center bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
            <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Current Level</p>
            <p class="mt-1 text-3xl font-bold text-indigo-600">{{ currentLevel }}</p>
        </div>
        <div class="p-4 text-center bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
            <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Average Pace</p>
            <p class="mt-1 text-3xl font-bold text-gray-800">
                {{ averagePace ?? '—' }}<span v-if="averagePace" class="text-base font-normal text-gray-400"> d/lvl</span>
            </p>
            <p class="mt-1 text-xs text-gray-400">last {{ recentDurations.length }} levels</p>
        </div>
        <div class="p-4 text-center bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
            <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Median Pace</p>
            <p class="mt-1 text-3xl font-bold text-gray-800">
                {{ medianPace ?? '—' }}<span v-if="medianPace" class="text-base font-normal text-gray-400"> d/lvl</span>
            </p>
        </div>
        <button
            type="button"
            class="p-4 text-center bg-white border border-gray-200 shadow-sm cursor-pointer rounded-xl sm:p-6 hover:border-indigo-300 hover:bg-indigo-50/40"
            @click="toggleProjectionMode"
        >
            <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Projected Lvl 60</p>
            <p class="mt-1 text-3xl font-bold text-gray-800">
                {{ projectedLevel60Date ? dateFormatter.format(projectedLevel60Date) : '—' }}
            </p>
            <p class="mt-1 text-xs text-gray-400">at {{ projectionModeLabel }}</p>
        </button>
    </div>
</template>
