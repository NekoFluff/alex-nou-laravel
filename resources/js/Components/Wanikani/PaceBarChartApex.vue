<script setup lang="ts">
import { LevelProgression } from '@/types/levelProgression';
import { diffDays } from '@/utils/date';
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    goalDays: number;
}>();

const bars = computed(() =>
    [...props.levelProgressions]
        .filter((lp) => lp.started_at)
        .sort((a, b) => a.level - b.level)
        .map((lp) => {
            const inProgress = !lp.passed_at;
            const durationDays = inProgress
                ? diffDays(lp.started_at, new Date())
                : diffDays(lp.started_at, lp.passed_at);
            return {
                level: lp.level,
                durationDays,
                inProgress,
                metGoal: !inProgress && durationDays <= props.goalDays,
            };
        }),
);

const colorFor = (bar: (typeof bars.value)[number]) =>
    bar.inProgress ? '#818cf8' : bar.metGoal ? '#22c55e' : '#f59e0b';

const series = computed(() => [
    {
        name: 'Days on level',
        data: bars.value.map((bar) => ({
            x: `${bar.level}`,
            y: bar.durationDays,
            fillColor: colorFor(bar),
        })),
    },
]);

const chartOptions = computed<ApexOptions>(() => ({
    chart: {
        type: 'bar',
        toolbar: { show: false },
        fontFamily: 'inherit',
    },
    plotOptions: {
        bar: { borderRadius: 3, columnWidth: '70%' },
    },
    dataLabels: { enabled: false },
    xaxis: {
        labels: { rotate: -90, style: { fontSize: '9px' } },
        tickAmount: 20,
    },
    annotations: {
        yaxis: [
            {
                y: props.goalDays,
                borderColor: '#9ca3af',
                strokeDashArray: 4,
                label: {
                    text: `${props.goalDays}d goal`,
                    style: { fontSize: '10px', background: 'transparent', color: '#6b7280' },
                    borderWidth: 0,
                },
            },
        ],
    },
    tooltip: {
        y: { formatter: (val: number) => `${val} day${val === 1 ? '' : 's'}` },
    },
    grid: { borderColor: '#f3f4f6' },
}));
</script>

<template>
    <div class="p-4 bg-white border border-gray-200 shadow-sm rounded-xl sm:p-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">Pace per level</h2>
            <div class="flex items-center gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-green-500"></span> met goal</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> missed goal</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-indigo-400"></span> in progress</span>
            </div>
        </div>

        <VueApexCharts type="bar" height="260" :options="chartOptions" :series="series" />
    </div>
</template>
