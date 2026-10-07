<script setup lang="ts">
/**
 * The headline numbers. Order matters: time invested and time remaining are the two the
 * whole dashboard exists to answer, so they lead.
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
        `Each lesson counts as ${props.settings.minutesPerLesson} min and each answer you've typed as ${props.settings.secondsPerReview}s. You can change both under Assumptions.`,
)

/** Same shape and order as the invested hint, so the two cards read against each other. */
const remainingDetail = computed(
    () =>
        `${formatNumber(props.stats.workload.lessonsRemaining)} lessons + ${formatNumber(
            props.stats.workload.stageUpsRemaining,
        )} reviews`,
)

const remainingHint = computed(
    () =>
        `${formatHours(props.stats.workload.lessonsMs)} lessons + ${formatHours(
            props.stats.workload.reviewsMs,
        )} reviews`,
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

const remainingBreakdown = computed<KpiBreakdown>(() => {
    const workload = props.stats.workload
    return {
        lines: [
            {
                label: 'Lessons left',
                calc: `${formatNumber(workload.lessonsRemaining)} lessons × ${lessonRate.value}`,
                value: formatHours(workload.lessonsMs),
            },
            {
                label: 'Reviews left',
                calc: `${formatNumber(workload.answersRemaining)} answers × ${answerRate.value}`,
                value: formatHours(workload.reviewsMs),
            },
        ],
        total: formatHours(workload.totalMs),
        note: `Each item needs one correct review per stage until it burns: 9 minus its current stage, or 7 if you haven't started it. That's ${formatNumber(workload.stageUpsRemaining)} reviews, and kanji and vocab count twice (meaning and reading), giving ${formatNumber(workload.answersRemaining)} answers. Assumes no more mistakes.`,
    }
})

const journeyBreakdown = computed<KpiBreakdown>(() => ({
    lines: [
        { label: 'Time invested', value: formatHours(props.stats.invested.totalMs) },
        { label: 'Time remaining', value: formatHours(props.stats.workload.totalMs) },
    ],
    total: formatHours(props.stats.projection.totalCurriculumMs),
    note: `${formatNumber(props.stats.counts.unlocked)} of ${formatNumber(props.stats.counts.total)} items unlocked so far.`,
}))

const etaDetail = computed(() => {
    if (props.stats.projection.levelsRemaining === 0) {
        return 'Level 60 reached 🎉'
    }
    return `${props.stats.projection.levelsRemaining} levels left at ${props.stats.projection.daysPerLevel.toFixed(1)} days each`
})

const journeyProgress = computed(() => props.stats.curriculumProgress)
</script>

<template>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            label="Time remaining"
            icon="🎯"
            :value="formatHours(stats.workload.totalMs)"
            :detail="remainingDetail"
            :hint="remainingHint"
            :accent="'#294ddb'"
            tooltip="The lessons you have left, plus the reviews needed to burn every item, including ones you haven't unlocked yet. Assumes you don't miss anything from here on."
            :breakdown="remainingBreakdown"
        />

        <KpiCard
            label="Whole journey"
            icon="🏔️"
            :value="formatHours(stats.projection.totalCurriculumMs)"
            :detail="`${journeyProgress.toFixed(1)}% unlocked`"
            hint="Level 1 through 60, lessons and reviews"
            :accent="'#0093dd'"
            tooltip="Time invested plus time remaining: the whole course, level 1 to 60. The percentage is how many items you've unlocked, not how much of the time you've spent."
            :breakdown="journeyBreakdown"
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
