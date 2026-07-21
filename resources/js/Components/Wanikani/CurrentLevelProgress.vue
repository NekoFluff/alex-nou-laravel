<script setup lang="ts">
import { LevelProgression } from '@/types/levelProgression';
import { diffDays } from '@/utils/date';
import { computed } from 'vue';

const props = defineProps<{
    currentProgression: LevelProgression | undefined;
    currentLevel: number;
    goalDays: number;
}>();

const daysElapsed = computed(() => {
    if (!props.currentProgression?.started_at) return 0;
    return diffDays(props.currentProgression.started_at, new Date());
});

const percentToGoal = computed(() => Math.min(100, Math.round((daysElapsed.value / props.goalDays) * 100)));

const isBehindGoal = computed(() => daysElapsed.value > props.goalDays);

const barColorClass = computed(() => (isBehindGoal.value ? 'bg-amber-500' : 'bg-indigo-500'));

const startDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
</script>

<template>
    <div class="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
        <div class="flex items-baseline justify-between">
            <h2 class="text-lg font-semibold text-gray-800">Level {{ currentLevel }} progress</h2>
            <span
                class="text-sm font-medium"
                :class="isBehindGoal ? 'text-amber-600' : 'text-indigo-600'"
            >
                Day {{ daysElapsed }} of {{ goalDays }}
            </span>
        </div>
        <p v-if="currentProgression?.started_at" class="mt-1 text-sm text-gray-400">
            Started {{ startDateFormatter.format(new Date(currentProgression.started_at)) }}
        </p>

        <div class="w-full h-3 mt-4 overflow-hidden bg-gray-100 rounded-full">
            <div
                class="h-full transition-all duration-500 rounded-full"
                :class="barColorClass"
                :style="{ width: percentToGoal + '%' }"
            />
        </div>
        <p class="mt-2 text-xs" :class="isBehindGoal ? 'text-amber-600' : 'text-gray-400'">
            <template v-if="isBehindGoal">
                {{ daysElapsed - goalDays }} day{{ daysElapsed - goalDays === 1 ? '' : 's' }} past the
                {{ goalDays }}-day goal
            </template>
            <template v-else>
                {{ goalDays - daysElapsed }} day{{ goalDays - daysElapsed === 1 ? '' : 's' }} remaining to hit the
                {{ goalDays }}-day goal
            </template>
        </p>
    </div>
</template>
