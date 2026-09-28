<script setup lang="ts">
/**
 * Donut chart wrapper for the SRS stage distribution.
 *
 * Shares the bar/area wrappers' colour rule: hex literals only, because ApexCharts
 * paints these onto a canvas where a `var(--token)` reference renders black.
 */
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { UI_PALETTE } from '@/domain/wanikaniPalette'

const props = withDefaults(
    defineProps<{
        labels: string[]
        values: number[]
        colors: string[]
        height?: number
        /** Draws the total in the middle of the ring. */
        centerValue?: string
        centerLabel?: string
    }>(),
    { height: 220, centerValue: undefined, centerLabel: undefined },
)

const series = computed(() => props.values)

const options = computed<ApexOptions>(() => ({
    chart: { type: 'donut', fontFamily: 'inherit', animations: { enabled: true, speed: 300 } },
    labels: props.labels,
    colors: props.colors,
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
        pie: {
            donut: {
                size: '70%',
                labels: {
                    show: Boolean(props.centerValue),
                    name: {
                        show: Boolean(props.centerLabel),
                        fontSize: '11px',
                        color: UI_PALETTE.slate400,
                    },
                    value: {
                        show: true,
                        fontSize: '20px',
                        fontWeight: 600,
                        color: UI_PALETTE.slate900,
                        formatter: () => props.centerValue ?? '',
                    },
                    total: {
                        show: Boolean(props.centerLabel),
                        label: props.centerLabel ?? '',
                        fontSize: '11px',
                        color: UI_PALETTE.slate400,
                        formatter: () => props.centerValue ?? '',
                    },
                },
            },
        },
    },
    tooltip: {
        y: { formatter: (val: number) => `${val.toLocaleString()} items` },
    },
}))
</script>

<template>
    <VueApexCharts type="donut" :height="height" :options="options" :series="series" />
</template>
