<script setup lang="ts">
import { LevelProgression } from '@/types/levelProgression';
import { PROJECTION_MODES, ProjectionMode } from '@/types/projectionMode';
import { addDays, diffDays } from '@/utils/date';
import { buildPaceContext, paceForLevel } from '@/utils/projection';
import { computed } from 'vue';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
    projectionMode: ProjectionMode;
    itemCountsByLevel: Record<number, number>;
    itemsPerDay: number;
    goalDays: number;
}>();

const emit = defineEmits<{
    'update:projectionMode': [mode: ProjectionMode];
}>();

const currentProgression = computed(() =>
    props.levelProgressions.find((lp) => lp.level === props.currentLevel),
);

const paceContext = computed(() =>
    buildPaceContext(props.levelProgressions, props.goalDays, props.itemsPerDay, props.itemCountsByLevel),
);

const averagePace = computed(() => paceContext.value.averagePace);
const medianPace = computed(() => paceContext.value.medianPace);
const recentLevelCount = computed(() => Math.min(10, props.levelProgressions.filter((lp) => lp.started_at && lp.passed_at).length));

const projectedLevel60Date = computed(() => {
    if (props.currentLevel >= 60) return null;
    const anchor = currentProgression.value?.started_at ? new Date(currentProgression.value.started_at) : new Date();

    let totalDays = 0;
    for (let level = props.currentLevel; level <= 60; level++) {
        totalDays += paceForLevel(level, props.projectionMode, paceContext.value);
    }
    return addDays(anchor, totalDays);
});

const daysRemaining = computed(() => {
    if (props.currentLevel >= 60) return 0;
    if (!projectedLevel60Date.value) return null;
    return Math.max(0, diffDays(new Date(), projectedLevel60Date.value));
});

const journeyPercent = computed(() => {
    const percent = ((props.currentLevel - 1) / 59) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
});

const circumference = 2 * Math.PI * 42;
const ringOffset = computed(() => circumference - (journeyPercent.value / 100) * circumference);

const projectionModeLabel = computed(() =>
    props.projectionMode === 'items'
        ? `${props.itemsPerDay} items/day`
        : props.projectionMode === 'goal'
          ? `${props.goalDays}-day goal`
          : `${props.projectionMode} pace`,
);

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<template>
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Projection pace</p>
            <div class="inline-flex p-1 bg-gray-100 rounded-lg" role="tablist" aria-label="Projection pace">
                <button
                    v-for="mode in PROJECTION_MODES"
                    :key="mode.value"
                    type="button"
                    role="tab"
                    :aria-selected="projectionMode === mode.value"
                    class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                        projectionMode === mode.value
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    "
                    @click="emit('update:projectionMode', mode.value)"
                >
                    {{ mode.label }}
                </button>
            </div>
        </div>

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
                <p class="mt-1 text-xs text-gray-400">last {{ recentLevelCount }} levels</p>
            </div>
            <div class="p-4 text-center bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Median Pace</p>
                <p class="mt-1 text-3xl font-bold text-gray-800">
                    {{ medianPace ?? '—' }}<span v-if="medianPace" class="text-base font-normal text-gray-400"> d/lvl</span>
                </p>
            </div>
            <div class="p-4 text-center bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
                <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Projected Lvl 60</p>
                <p class="mt-1 text-3xl font-bold text-gray-800">
                    {{ projectedLevel60Date ? dateFormatter.format(projectedLevel60Date) : '—' }}
                </p>
                <p class="mt-1 text-xs text-gray-400">at {{ projectionModeLabel }}</p>
            </div>
        </div>

        <div class="relative overflow-hidden text-white shadow-lg rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600">
            <div class="absolute rounded-full pointer-events-none -right-10 -top-10 h-40 w-40 bg-white/10 blur-2xl" />
            <div class="absolute rounded-full pointer-events-none -bottom-12 -left-12 h-40 w-40 bg-white/10 blur-2xl" />

            <div class="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between sm:p-8">
                <div>
                    <p class="text-xs font-semibold tracking-widest uppercase text-indigo-100/90">
                        {{ currentLevel >= 60 ? 'Journey complete' : 'Countdown to Level 60' }}
                    </p>
                    <p class="mt-2 text-6xl font-extrabold leading-none tabular-nums sm:text-7xl">
                        <template v-if="currentLevel >= 60">🎉</template>
                        <template v-else-if="daysRemaining !== null">{{ daysRemaining }}</template>
                        <template v-else>—</template>
                    </p>
                    <p class="mt-2 text-sm font-medium text-indigo-100">
                        <template v-if="currentLevel >= 60">You've reached the top!</template>
                        <template v-else-if="daysRemaining !== null">
                            day{{ daysRemaining === 1 ? '' : 's' }} left at {{ projectionModeLabel }}
                        </template>
                        <template v-else>not enough data yet</template>
                    </p>
                    <p v-if="projectedLevel60Date" class="flex items-center gap-1.5 mt-3 text-xs text-indigo-100/80">
                        <span class="relative flex w-2 h-2">
                            <span class="absolute inline-flex w-full h-full bg-white rounded-full opacity-75 animate-ping" />
                            <span class="relative inline-flex w-2 h-2 bg-white rounded-full" />
                        </span>
                        arriving {{ dateFormatter.format(projectedLevel60Date) }}
                    </p>
                </div>

                <div class="relative flex items-center justify-center shrink-0 h-36 w-36">
                    <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8" />
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="white"
                            stroke-width="8"
                            stroke-linecap="round"
                            :stroke-dasharray="circumference"
                            :stroke-dashoffset="ringOffset"
                            class="transition-[stroke-dashoffset] duration-700 ease-out"
                        />
                    </svg>
                    <div class="absolute flex flex-col items-center">
                        <span class="text-2xl font-bold">{{ journeyPercent }}%</span>
                        <span class="text-[10px] uppercase tracking-wide text-indigo-100/80">of the way</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
