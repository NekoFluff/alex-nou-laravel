<script setup lang="ts">
/**
 * The headline numbers: how much time has gone in, and when it is expected to end.
 */
import { computed } from 'vue'
import KpiCard, { type KpiBreakdown } from './KpiCard.vue'
import { formatDate, formatHours, formatNumber } from '@/domain/format'
import { UI_PALETTE } from '@/domain/wanikaniPalette'
import type { StudySettings, WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats; settings: StudySettings }>()

const investedDetail = computed(
    () =>
        `${formatNumber(props.stats.invested.lessonsCompleted)} lessons + ${formatNumber(
            props.stats.invested.reviewsCompleted,
        )} reviews`,
)

/**
 * Both halves of the time figure, so the lesson side is never invisible. A hint naming
 * only reviews silently drops a quarter of the total.
 */
const investedHint = computed(
    () =>
        `${formatHours(props.stats.invested.lessonsMs)} lessons + ${formatHours(
            props.stats.invested.reviewsMs,
        )} reviews`,
)

const investedTooltip = computed(
    () =>
        `Each lesson counts as ${props.settings.minutesPerLesson} min and each answer you've typed as ${props.settings.secondsPerReview}s. You can change both under Settings.`,
)

const lessonRate = computed(() => `${props.settings.minutesPerLesson} min`)
const answerRate = computed(() => `${props.settings.secondsPerReview}s`)

const investedBreakdown = computed<KpiBreakdown>(() => {
    const invested = props.stats.invested
    return {
        lines: [
            {
                label: 'Lessons',
                calc: `${formatNumber(invested.lessonsCompleted)} lessons × ${lessonRate.value}`,
                value: formatHours(invested.lessonsMs),
            },
            {
                label: 'Reviews',
                calc: `${formatNumber(invested.answersRecorded)} answers × ${answerRate.value}`,
                value: formatHours(invested.reviewsMs),
            },
        ],
        total: formatHours(invested.totalMs),
        note: `Your ${formatNumber(invested.reviewsCompleted)} reviews took ${formatNumber(invested.answersRecorded)} answers: kanji and vocab ask for meaning and reading, and wrong answers are typed again. The counts come from WaniKani's per-item stats.`,
    }
})

const etaDetail = computed(() => {
    if (props.stats.projection.levelsRemaining === 0) {
        return 'Level 60 reached 🎉'
    }
    return `${props.stats.projection.levelsRemaining} levels left at ${props.stats.projection.daysPerLevel.toFixed(1)} days each`
})

</script>

<template>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
            label="Time invested"
            icon="⏳"
            :value="formatHours(stats.invested.totalMs)"
            :detail="investedDetail"
            :hint="investedHint"
            :accent="'#dd0093'"
            :tooltip="investedTooltip"
            :breakdown="investedBreakdown"
        />

        <KpiCard
            label="Projected finish"
            icon="📅"
            :value="formatDate(stats.projection.etaByLevelPace)"
            :detail="etaDetail"
            :hint="
                stats.projection.sampleSize
                    ? `Based on your last ${stats.projection.sampleSize} levels`
                    : 'Not enough level history yet'
            "
            :accent="UI_PALETTE.indigo"
            tooltip="How long your recent levels usually took, times the number of levels you have left."
        />
    </div>
</template>
