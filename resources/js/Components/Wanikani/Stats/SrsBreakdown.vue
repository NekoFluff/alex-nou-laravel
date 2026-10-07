<script setup lang="ts">
/** Where every unlocked item currently sits in the SRS ladder. */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import DonutChart from './DonutChart.vue'
import { formatNumber } from '@/domain/format'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

const rings = computed(() =>
    props.stats.srs.groups
        .filter((group) => group.count > 0)
        .map((group) => ({
            key: group.key,
            label: group.label,
            color: group.color,
            count: group.count,
            share:
                props.stats.counts.unlocked === 0
                    ? 0
                    : (group.count / props.stats.counts.unlocked) * 100,
        })),
)

const labels = computed(() => rings.value.map((ring) => ring.label))
const values = computed(() => rings.value.map((ring) => ring.count))
const colors = computed(() => rings.value.map((ring) => ring.color))
const total = computed(() => props.stats.counts.unlocked)
</script>

<template>
    <StatPanel title="SRS stages" subtitle="All unlocked items by stage" flush>
        <template #actions>
            <span class="text-xs tabular-nums text-gray-500">{{ formatNumber(total) }} items</span>
        </template>

        <!--
            Explicit minmax(0, …) tracks: an implicit 'auto' track grows to fit the chart's
            rendered width and never shrinks, which pushed the legend off the card and the
            donut off-centre on phones.
        -->
        <div
            class="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)] lg:items-center"
        >
            <div class="w-full max-w-[220px] mx-auto">
                <DonutChart
                    :labels="labels"
                    :values="values"
                    :colors="colors"
                    :height="180"
                    :center-value="formatNumber(total)"
                    center-label="unlocked"
                />
            </div>

            <ul class="min-w-0 space-y-2">
                <li v-for="ring in rings" :key="ring.key" class="flex items-center gap-2 text-xs sm:gap-3">
                    <span class="rounded-full size-2.5 shrink-0" :style="{ backgroundColor: ring.color }" />
                    <span class="w-20 truncate shrink-0 text-gray-500">{{ ring.label }}</span>
                    <span class="w-12 shrink-0 text-right font-semibold tabular-nums text-gray-900">
                        {{ formatNumber(ring.count) }}
                    </span>
                    <span class="flex-1 min-w-0">
                        <span class="block h-1.5 overflow-hidden bg-gray-100 rounded-full">
                            <span
                                class="block h-full rounded-full"
                                :style="{ width: `${ring.share}%`, backgroundColor: ring.color }"
                            />
                        </span>
                    </span>
                    <span class="w-9 shrink-0 text-right tabular-nums text-gray-400">
                        {{ ring.share.toFixed(0) }}%
                    </span>
                </li>
            </ul>
        </div>
    </StatPanel>
</template>
