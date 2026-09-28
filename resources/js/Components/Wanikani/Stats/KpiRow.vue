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

const paceLabel = computed(
    () => `${props.settings.secondsPerReview}s per review · ${props.settings.minutesPerLesson} min per lesson`,
)

const investedDetail = computed(
    () =>
        `${formatNumber(props.stats.invested.lessonsCompleted)} lessons + ${formatNumber(
            props.stats.invested.reviewsSessions,
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

const investedTooltip = computed(() =>
    [
        'A review quizzes meaning and reading together, so each one counts once here even though it produces two answers.',
        `The time figure is built from all ${formatNumber(props.stats.invested.answersRecorded)} answers at ${props.settings.secondsPerReview}s each, plus ${formatNumber(props.stats.invested.lessonsCompleted)} lessons at ${props.settings.minutesPerLesson} min each.`,
        paceLabel.value,
    ].join(' '),
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
            tooltip="Every review still owed on an unlocked item, plus a full seven-step climb for every subject you have not unlocked yet. Counted in answers, the same unit as time invested: a kanji or vocabulary review quizzes meaning and reading separately, so each of those stage-ups costs two answers, while a radical costs one."
        />

        <KpiCard
            label="Whole journey"
            icon="🏔️"
            :value="formatHours(stats.projection.totalCurriculumMs)"
            :detail="`${journeyProgress.toFixed(1)}% unlocked`"
            hint="Level 1 through 60, lessons and reviews"
            :accent="'#0093dd'"
            tooltip="Time invested plus time remaining — the total cost of the entire WaniKani curriculum at your assumptions. The percentage is how much of the catalogue you have unlocked, not how much of this time you have spent, because the two move at different rates: unlocking the last item is the midpoint of the work, not the end of it."
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
            tooltip="Your median days-per-level, multiplied by the levels you have left. This respects WaniKani's real SRS wait times, which is why it is usually later — and more honest — than dividing remaining hours by hours studied per day."
        />
    </div>
</template>
