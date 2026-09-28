<script setup lang="ts">
/**
 * Bar chart wrapper.
 *
 * Colours are hex literals rather than CSS custom properties on purpose: ApexCharts
 * passes colour strings to the canvas, where a `var(--token)` reference is not a
 * paintable value and silently renders black.
 */
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { UI_PALETTE } from '@/domain/wanikaniPalette'

const props = withDefaults(
    defineProps<{
        labels: string[]
        values: number[]
        color?: string
        height?: number
        /** Formats the tooltip value, e.g. adding "reviews". */
        valueSuffix?: string
        /** Renders the bars horizontally, for long category names. */
        horizontal?: boolean
    }>(),
    {
        color: UI_PALETTE.indigo,
        height: 220,
        valueSuffix: '',
        horizontal: false,
    },
)

const series = computed(() => [{ name: props.valueSuffix || 'Value', data: props.values }])

const options = computed<ApexOptions>(() => ({
    chart: {
        type: 'bar',
        toolbar: { show: false },
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 300 },
    },
    colors: [props.color],
    plotOptions: {
        bar: {
            horizontal: props.horizontal,
            borderRadius: 3,
            columnWidth: '70%',
        },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
        categories: props.labels,
        labels: { style: { fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: {
        labels: { style: { fontSize: '11px' }, formatter: (val: number) => String(Math.round(val)) },
    },
    grid: { borderColor: UI_PALETTE.slate200, strokeDashArray: 3 },
    tooltip: {
        y: {
            formatter: (val: number) =>
                `${val.toLocaleString()}${props.valueSuffix ? ` ${props.valueSuffix}` : ''}`,
        },
    },
}))
</script>

<template>
    <VueApexCharts type="bar" :height="height" :options="options" :series="series" />
</template>
