<script setup lang="ts">
/** Area chart wrapper, used for the cumulative burn forecast. */
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
        valueSuffix?: string
    }>(),
    {
        color: '#489cc1',
        height: 220,
        valueSuffix: '',
    },
)

const series = computed(() => [{ name: props.valueSuffix || 'Value', data: props.values }])

const options = computed<ApexOptions>(() => ({
    chart: {
        type: 'area',
        toolbar: { show: false },
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 300 },
    },
    colors: [props.color],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    markers: { size: 0, hover: { size: 5 } },
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
    <VueApexCharts type="area" :height="height" :options="options" :series="series" />
</template>
