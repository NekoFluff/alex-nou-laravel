<script setup lang="ts">
/** How much of each subject type has been unlocked, passed and burned. */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import { formatNumber } from '@/domain/format'
import { SUBJECT_PALETTE } from '@/domain/wanikaniPalette'
import { SUBJECT_TYPE_LABELS } from '@/domain/constants'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

const rows = computed(() =>
    props.stats.countsByType
        .filter((row) => row.counts.total > 0)
        .map((row) => ({
            ...row,
            color: SUBJECT_PALETTE[row.type],
            share: row.counts.total === 0 ? 0 : (row.counts.burned / row.counts.total) * 100,
            unlockedShare: row.counts.total === 0 ? 0 : (row.counts.unlocked / row.counts.total) * 100,
        })),
)
</script>

<template>
    <StatPanel title="Content progress" subtitle="How much of each subject type you have worked through">
        <ul class="space-y-4">
            <li v-for="row in rows" :key="row.type">
                <div class="flex items-baseline justify-between text-xs">
                    <span class="flex items-center gap-2 text-gray-500">
                        <span class="rounded-full size-2.5" :style="{ backgroundColor: row.color }" />
                        {{ SUBJECT_TYPE_LABELS[row.type] }}
                    </span>
                    <span class="tabular-nums text-gray-900">
                        {{ formatNumber(row.counts.burned) }}
                        <span class="text-gray-400">/ {{ formatNumber(row.counts.total) }} burned</span>
                    </span>
                </div>
                <!-- Grey track shows unlocked items, coloured fill shows burned ones. -->
                <div class="relative h-2 mt-2 overflow-hidden bg-gray-100 rounded-full">
                    <div
                        class="absolute inset-y-0 left-0 rounded-full bg-gray-300"
                        :style="{ width: `${row.unlockedShare}%` }"
                    />
                    <div
                        class="absolute inset-y-0 left-0 rounded-full"
                        :style="{ width: `${row.share}%`, backgroundColor: row.color }"
                    />
                </div>
                <p class="mt-1 text-[10px] text-gray-400">
                    {{ formatNumber(row.counts.unlocked) }} unlocked ·
                    {{ formatNumber(row.counts.total - row.counts.unlocked) }} still locked
                </p>
            </li>
        </ul>
    </StatPanel>
</template>
