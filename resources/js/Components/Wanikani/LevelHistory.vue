<script setup lang="ts">
import { LevelProgression } from '@/types/levelProgression';
import { addDays, diffDays } from '@/utils/date';
import { average, median } from '@/utils/pace';
import { computed, nextTick, onMounted, ref } from 'vue';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
    goalDays: number;
    projectionMode: 'median' | 'average';
}>();

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const durations = computed(() =>
    props.levelProgressions
        .filter((lp) => lp.started_at && lp.passed_at)
        .sort((a, b) => a.level - b.level)
        .map((lp) => diffDays(lp.started_at, lp.passed_at)),
);

const recentDurations = computed(() => durations.value.slice(-10));

const pace = computed(() => {
    const value = props.projectionMode === 'median' ? median(durations.value) : average(recentDurations.value);
    return value ?? props.goalDays;
});

const actualRows = computed(() =>
    [...props.levelProgressions]
        .filter((lp) => lp.started_at)
        .sort((a, b) => a.level - b.level)
        .map((lp) => {
            const inProgress = !lp.passed_at;
            const startedAt = new Date(lp.started_at);
            const durationDays = inProgress ? diffDays(startedAt, new Date()) : diffDays(startedAt, lp.passed_at);
            return {
                level: lp.level,
                startedAt,
                passedAt: lp.passed_at ? new Date(lp.passed_at) : null,
                projectedPassedAt: inProgress ? addDays(startedAt, pace.value) : null,
                durationDays,
                inProgress,
                isProjected: false,
                metGoal: !inProgress && durationDays <= props.goalDays,
            };
        }),
);

const futureRows = computed(() => {
    const lastActual = actualRows.value[actualRows.value.length - 1];
    if (!lastActual) return [];

    const rows: {
        level: number;
        startedAt: Date | null;
        passedAt: Date | null;
        projectedPassedAt: Date | null;
        durationDays: number;
        inProgress: boolean;
        isProjected: boolean;
        metGoal: boolean;
    }[] = [];

    let cursor = lastActual.passedAt ?? lastActual.projectedPassedAt ?? new Date();
    for (let level = lastActual.level + 1; level <= 60; level++) {
        const startedAt = cursor;
        const projectedPassedAt = addDays(startedAt, pace.value);
        rows.push({
            level,
            startedAt: null,
            passedAt: null,
            projectedPassedAt,
            durationDays: Math.round(pace.value),
            inProgress: false,
            isProjected: true,
            metGoal: false,
        });
        cursor = projectedPassedAt;
    }
    return rows;
});

const rows = computed(() => [...actualRows.value, ...futureRows.value]);

const scrollContainer = ref<HTMLDivElement>();

onMounted(() => {
    nextTick(() => {
        const container = scrollContainer.value;
        const target = container?.querySelector<HTMLElement>(`[data-level="${props.currentLevel}"]`);
        if (container && target) {
            container.scrollTop = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
        }
    });
});
</script>

<template>
    <div class="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
        <div ref="scrollContainer" class="max-h-[28rem] overflow-x-auto overflow-y-auto">
            <table class="w-full text-sm">
                <thead class="sticky top-0 bg-gray-50">
                    <tr class="text-xs font-medium tracking-wide text-left text-gray-500 uppercase">
                        <th class="px-2 py-3 sm:px-6">Level</th>
                        <th class="px-2 py-3 sm:px-6">Started</th>
                        <th class="px-2 py-3 sm:px-6">Passed</th>
                        <th class="px-2 py-3 sm:px-6">Duration</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr
                        v-for="row in rows"
                        :key="row.level"
                        :data-level="row.level"
                        class="hover:bg-gray-50"
                        :class="[row.inProgress && 'bg-indigo-50/50', row.isProjected && 'text-gray-400']"
                    >
                        <td
                            class="px-2 py-3 font-semibold whitespace-nowrap sm:px-6"
                            :class="row.isProjected ? 'text-gray-400' : 'text-gray-800'"
                        >
                            {{ row.level }}
                            <span
                                v-if="row.inProgress"
                                class="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                            >
                                current
                            </span>
                        </td>
                        <td class="px-2 py-3 whitespace-nowrap sm:px-6" :class="row.isProjected ? 'text-gray-400' : 'text-gray-500'">
                            <template v-if="row.startedAt">
                                <span class="sm:hidden">{{ shortDateFormatter.format(row.startedAt) }}</span>
                                <span class="hidden sm:inline">{{ dateFormatter.format(row.startedAt) }}</span>
                            </template>
                            <template v-else>—</template>
                        </td>
                        <td class="px-2 py-3 whitespace-nowrap sm:px-6" :class="row.isProjected ? 'italic text-gray-400' : 'text-gray-500'">
                            <template v-if="row.passedAt">
                                <span class="sm:hidden">{{ shortDateFormatter.format(row.passedAt) }}</span>
                                <span class="hidden sm:inline">{{ dateFormatter.format(row.passedAt) }}</span>
                            </template>
                            <template v-else-if="row.projectedPassedAt">
                                <span class="sm:hidden">~{{ shortDateFormatter.format(row.projectedPassedAt) }}</span>
                                <span class="hidden sm:inline">~{{ dateFormatter.format(row.projectedPassedAt) }}</span>
                            </template>
                            <template v-else>—</template>
                        </td>
                        <td class="px-2 py-3 sm:px-6">
                            <span
                                :class="[
                                    'font-medium',
                                    row.isProjected
                                        ? 'italic text-gray-400'
                                        : row.inProgress
                                          ? 'text-indigo-600'
                                          : row.metGoal
                                            ? 'text-green-600'
                                            : 'text-amber-600',
                                ]"
                            >
                                {{ row.durationDays }}d
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
