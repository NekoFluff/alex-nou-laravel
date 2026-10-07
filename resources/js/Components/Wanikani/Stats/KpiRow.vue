<script setup lang="ts">
/**
 * The headline numbers. Order matters: time invested and time remaining are the two the
 * whole dashboard exists to answer, so they lead.
 */
import { computed } from 'vue'
import KpiCard from './KpiCard.vue'
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
        />

        <KpiCard
            label="Time remaining"
            icon="🎯"
            :value="formatHours(stats.workload.totalMs)"
            :detail="remainingDetail"
            :hint="remainingHint"
            :accent="'#294ddb'"
            tooltip="The lessons you have left, plus the reviews needed to burn every item, including ones you haven't unlocked yet. Assumes you don't miss anything from here on."
        />

        <KpiCard
            label="Whole journey"
            icon="🏔️"
            :value="formatHours(stats.projection.totalCurriculumMs)"
            :detail="`${journeyProgress.toFixed(1)}% unlocked`"
            hint="Level 1 through 60, lessons and reviews"
            :accent="'#0093dd'"
            tooltip="Time invested plus time remaining: the whole course, level 1 to 60. The percentage is how many items you've unlocked, not how much of the time you've spent."
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
