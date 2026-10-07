<script setup lang="ts">
/**
 * Progress through the current level. Kanji are what gate a level-up, so they get the
 * headline ring; radicals and vocabulary are shown for completeness.
 */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import ProgressBar from './ProgressBar.vue'
import { SUBJECT_PALETTE } from '@/domain/wanikaniPalette'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

const level = computed(() => props.stats.currentLevel)

const rows = computed(() => [
    {
        label: 'Kanji',
        passed: level.value.kanjiPassed,
        total: level.value.kanjiTotal,
        color: SUBJECT_PALETTE.kanji,
        note: 'Gate the next level',
    },
    {
        label: 'Radicals',
        passed: level.value.radicalsPassed,
        total: level.value.radicalsTotal,
        color: SUBJECT_PALETTE.radical,
        note: 'Unlock the kanji',
    },
    {
        label: 'Vocabulary',
        passed: level.value.vocabularyPassed,
        total: level.value.vocabularyTotal,
        color: SUBJECT_PALETTE.vocabulary,
        note: 'Follow the kanji',
    },
])

const pace = computed(() => {
    const typical = props.stats.projection.daysPerLevel
    if (!Number.isFinite(typical) || typical <= 0) {
        return null
    }
    const elapsed = level.value.daysOnLevel
    return {
        typical,
        elapsed,
        /** What is left of a typical level, from where you actually are. */
        remaining: Math.max(0, typical - elapsed),
    }
})

const estimate = computed(() => {
    if (level.value.isComplete) {
        return 'All kanji guru’d — the next level is ready'
    }
    if (pace.value === null) {
        return 'Not enough level history to estimate yet'
    }
    if (pace.value.remaining <= 0) {
        // Past the typical duration: promising a number of days would be inventing one.
        return `Levels usually take you ${pace.value.typical.toFixed(1)} days and this one is at day ${pace.value.elapsed.toFixed(1)}. Pass the remaining kanji to level up.`
    }
    return `About ${pace.value.remaining.toFixed(1)} more days at your ${pace.value.typical.toFixed(1)}-day pace`
})
</script>

<template>
    <StatPanel title="Current level" :subtitle="`Level ${level.level}`">
        <template #actions>
            <span
                v-if="level.isComplete"
                class="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700"
            >
                Complete
            </span>
        </template>

        <div class="flex items-baseline gap-3">
            <span class="text-4xl font-semibold tabular-nums text-gray-900">
                {{ level.progress.toFixed(0) }}%
            </span>
            <span class="text-xs text-gray-500">
                {{ level.kanjiPassed }} of {{ level.kanjiTotal }} kanji passed
            </span>
        </div>

        <div class="mt-4 space-y-3">
            <div v-for="row in rows" :key="row.label">
                <div class="flex items-baseline justify-between text-xs">
                    <span class="text-gray-500">
                        {{ row.label }}
                        <span class="ml-1 text-[10px] text-gray-400">{{ row.note }}</span>
                    </span>
                    <span class="tabular-nums text-gray-900">
                        {{ row.passed }}<span class="text-gray-400">/{{ row.total }}</span>
                    </span>
                </div>
                <div class="mt-1.5">
                    <ProgressBar :value="row.passed" :max="row.total" :color="row.color" :height="6" />
                </div>
            </div>
        </div>

        <dl class="grid grid-cols-2 gap-3 pt-4 mt-5 text-xs border-t border-gray-100">
            <div>
                <dt class="text-gray-400">Time on this level</dt>
                <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">
                    {{ level.daysOnLevel.toFixed(1) }} days
                </dd>
            </div>
            <div>
                <dt class="text-gray-400">Your typical level</dt>
                <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">
                    {{ stats.projection.daysPerLevel.toFixed(1) }} days
                </dd>
            </div>
        </dl>

        <p class="mt-3 text-[11px] leading-relaxed text-gray-400">
            {{ estimate }}
        </p>
    </StatPanel>
</template>
