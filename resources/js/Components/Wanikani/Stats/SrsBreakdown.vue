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

        <div class="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,180px)_1fr] lg:items-center">
            <DonutChart
                :labels="labels"
                :values="values"
                :colors="colors"
                :height="180"
                :center-value="formatNumber(total)"
                center-label="unlocked"
            />

            <ul class="space-y-2">
                <li v-for="ring in rings" :key="ring.key" class="flex items-center gap-3 text-xs">
                    <span class="rounded-full size-2.5 shrink-0" :style="{ backgroundColor: ring.color }" />
                    <span class="w-24 shrink-0 text-gray-500">{{ ring.label }}</span>
                    <span class="w-14 shrink-0 text-right font-semibold tabular-nums text-gray-900">
                        {{ formatNumber(ring.count) }}
                    </span>
                    <span class="flex-1">
                        <span class="block h-1.5 overflow-hidden bg-gray-100 rounded-full">
                            <span
                                class="block h-full rounded-full"
                                :style="{ width: `${ring.share}%`, backgroundColor: ring.color }"
                            />
                        </span>
                    </span>
                    <span class="w-10 shrink-0 text-right tabular-nums text-gray-400">
                        {{ ring.share.toFixed(0) }}%
                    </span>
                </li>
            </ul>
        </div>
    </StatPanel>
</template>
