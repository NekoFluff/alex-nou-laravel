<script setup lang="ts">
/** Answer accuracy, overall and split by question type and subject type. */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import InfoTip from './InfoTip.vue'
import ProgressBar from './ProgressBar.vue'
import { formatNumber, formatPercent } from '@/domain/format'
import { toneForPercent } from '@/domain/wanikaniPalette'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

const accuracy = computed(() => props.stats.accuracy)

const breakdowns = computed(() =>
    [
        { key: 'meaning', label: 'Meaning', totals: accuracy.value.meaning, color: '#f472b6', note: 'English answers' },
        { key: 'reading', label: 'Reading', totals: accuracy.value.reading, color: '#38bdf8', note: 'Japanese answers' },
        { key: 'radical', label: 'Radicals', totals: accuracy.value.radical, color: '#00aaff', note: 'Meaning only' },
        { key: 'kanji', label: 'Kanji', totals: accuracy.value.kanji, color: '#ff00aa', note: 'Meaning + reading' },
        {
            key: 'vocabulary',
            label: 'Vocabulary',
            totals: accuracy.value.vocabulary,
            color: '#aa00ff',
            note: 'Meaning + reading',
        },
    ].filter((row) => row.totals.total > 0),
)
</script>

<template>
    <StatPanel title="Accuracy" subtitle="Every recorded answer, all time">
        <template #actions>
            <InfoTip
                text="WaniKani reports correct and incorrect counts per item rather than a review log, so these are exact counts of answers. A kanji or vocabulary review counts as two answers; a radical review counts as one."
            />
        </template>

        <div class="flex items-baseline gap-3">
            <span class="text-4xl font-semibold tabular-nums text-gray-900">
                {{ formatPercent(accuracy.overall.accuracy) }}
            </span>
            <span class="text-xs text-gray-500">
                {{ formatNumber(accuracy.overall.total) }} answers ·
                {{ formatNumber(accuracy.overall.incorrect) }} wrong
            </span>
        </div>

        <div class="mt-4">
            <ProgressBar
                :value="accuracy.overall.accuracy"
                :color="toneForPercent(accuracy.overall.accuracy)"
                :height="8"
            />
        </div>

        <ul class="mt-5 space-y-3">
            <li v-for="row in breakdowns" :key="row.key">
                <div class="flex items-baseline justify-between text-xs">
                    <span class="text-gray-500">
                        {{ row.label }}
                        <span class="ml-1 text-[10px] text-gray-400">{{ row.note }}</span>
                    </span>
                    <span class="tabular-nums text-gray-900">
                        {{ formatPercent(row.totals.accuracy) }}
                        <span class="ml-1.5 text-[10px] text-gray-400">
                            {{ formatNumber(row.totals.total) }}
                        </span>
                    </span>
                </div>
                <div class="mt-1.5">
                    <ProgressBar :value="row.totals.accuracy" :color="row.color" :height="5" />
                </div>
            </li>
        </ul>

        <p class="pt-4 mt-5 text-[11px] leading-relaxed border-t border-gray-100 text-gray-400">
            <strong class="text-gray-600">{{ formatNumber(accuracy.perfectItems) }} items</strong>
            ({{ formatPercent(accuracy.perfectShare, 0) }} of everything you have reviewed) have never
            been answered incorrectly.
        </p>

        <p class="px-3.5 py-3 mt-3 text-[11px] leading-relaxed text-gray-400 bg-gray-50 rounded-xl">
            <strong class="text-gray-600">Read this as answer accuracy, not review accuracy.</strong>
            A kanji or vocabulary review quizzes meaning and reading together, so one wrong review
            produces two wrong answers. That double-counts your mistakes, which means this percentage
            flatters you. Judged per review — did the item advance or not — the figure is a few points
            lower, and a better match for how the work actually feels.
        </p>
    </StatPanel>
</template>
