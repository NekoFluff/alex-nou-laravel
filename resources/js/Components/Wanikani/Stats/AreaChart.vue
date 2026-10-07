<script setup lang="ts">
/**
 * Area chart wrapper, used for the cumulative burn forecast.
 *
 * Pass `timestamps` to plot against a real time axis. ApexCharts then spaces ticks by
 * date and drops labels that would overlap, instead of printing one per data point,
 * which made long windows unreadable.
 */
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { UI_PALETTE } from '@/domain/wanikaniPalette'

const props = withDefaults(
    defineProps<{
        labels?: string[]
        /** Epoch milliseconds per value; switches the x-axis to datetime. */
        timestamps?: number[]
        values: number[]
        color?: string
        height?: number
        valueSuffix?: string
    }>(),
    {
        labels: () => [],
        timestamps: undefined,
        color: '#489cc1',
        height: 220,
        valueSuffix: '',
    },
)

const isTimeAxis = computed(() => props.timestamps !== undefined)

const series = computed(() => [
    {
        name: props.valueSuffix || 'Value',
        data: isTimeAxis.value
            ? props.values.map((value, index) => ({ x: props.timestamps![index], y: value }))
            : props.values,
    },
])

const options = computed<ApexOptions>(() => ({
    chart: {
        type: 'area',
        toolbar: { show: false },
        fontFamily: 'inherit',
        animations: { enabled: true, speed: 300 },
    },
    colors: [props.color],
    // A running total only rises in steps; a smoothed line would overshoot between them.
    stroke: { curve: isTimeAxis.value ? 'stepline' : 'smooth', width: 2 },
    fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: isTimeAxis.value
        ? {
              type: 'datetime',
              labels: {
                  style: { fontSize: '11px' },
                  datetimeUTC: false,
                  formatter: (_value: string, timestamp?: number) =>
                      timestamp === undefined
                          ? ''
                          : new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              },
              axisBorder: { show: false },
              axisTicks: { show: false },
              tooltip: { enabled: false },
          }
        : {
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
        x: { format: 'MMM d, yyyy' },
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
