<script setup lang="ts">
/**
 * Where the hours actually went: lessons vs reviews, and the same work at three reading
 * speeds so the assumptions can be sanity-checked against experience.
 */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import InfoTip from './InfoTip.vue'
import { formatHours, formatNumber } from '@/domain/format'
import type { StudySettings, WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats; settings: StudySettings }>()

/**
 * Brackets the default pace (12s) with a faster and a slower reading, so the same work
 * can be seen at three speeds rather than only at the current setting.
 */
const SCENARIO_SECONDS = [8, 12, 16]

/** Answers a flawless climb from lesson to burned takes: 7 stage-ups x 2 quizzings. */
const FLAWLESS_ANSWERS_PER_ITEM = 14

const lessonsMs = computed(() => props.stats.invested.lessonsMs)
const reviewsMs = computed(() => props.stats.invested.reviewsMs)
const totalMs = computed(() => props.stats.invested.totalMs)

const lessonsShare = computed(() => (totalMs.value === 0 ? 0 : (lessonsMs.value / totalMs.value) * 100))
const reviewsShare = computed(() => (totalMs.value === 0 ? 0 : (reviewsMs.value / totalMs.value) * 100))

const scenarios = computed(() => {
    const lessons = props.stats.invested.lessonsCompleted
    // The review side is measured in ANSWERS, so the comparison is per answer too.
    const answers = props.stats.invested.answersRecorded
    return SCENARIO_SECONDS.map((seconds) => ({
        seconds,
        isCurrent: seconds === props.settings.secondsPerReview,
        ms: lessons * props.settings.minutesPerLesson * 60_000 + answers * seconds * 1000,
    }))
})

/**
 * Straight from the engine, which counts only the answers belonging to burned items.
 * Deriving it here from the account-wide answer total mixed two populations and
 * overstated it by more than 2x.
 */
const averageAnswersPerBurned = computed(() => props.stats.invested.answersPerBurnedItem)

/** How much extra work the same item cost versus a perfect run. */
const overheadRatio = computed(() =>
    averageAnswersPerBurned.value === 0 ? 0 : averageAnswersPerBurned.value / FLAWLESS_ANSWERS_PER_ITEM,
)
</script>

<template>
    <StatPanel title="Time invested" subtitle="Every completed lesson and recorded review answer">
        <template #actions>
            <InfoTip
                text="Lesson time is the count of items whose lesson you have completed. Review time is every correct and incorrect meaning/reading answer WaniKani still reports, at your seconds-per-review setting."
            />
        </template>

        <p class="text-3xl font-semibold tabular-nums text-gray-900">
            {{ formatHours(totalMs) }}
        </p>
        <p class="mt-1 text-xs text-gray-500">
            {{ (totalMs / 3_600_000).toFixed(1) }} hours across
            {{ formatNumber(stats.invested.lessonsCompleted) }} lessons and
            {{ formatNumber(stats.invested.answersRecorded) }} answers
        </p>

        <!-- Stacked share bar -->
        <div class="flex h-3 mt-5 overflow-hidden bg-gray-100 rounded-full">
            <div
                class="h-full transition-[width] duration-700"
                :style="{ width: `${reviewsShare}%`, backgroundColor: '#294ddb' }"
                :title="`Reviews: ${formatHours(reviewsMs)}`"
            />
            <div
                class="h-full transition-[width] duration-700"
                :style="{ width: `${lessonsShare}%`, backgroundColor: '#0093dd' }"
                :title="`Lessons: ${formatHours(lessonsMs)}`"
            />
        </div>

        <dl class="grid grid-cols-2 gap-4 mt-4">
            <div class="flex items-start gap-2">
                <span class="mt-1 rounded-full size-2.5" :style="{ backgroundColor: '#294ddb' }" aria-hidden="true" />
                <div>
                    <dt class="text-xs text-gray-500">Reviews</dt>
                    <dd class="text-sm font-semibold tabular-nums text-gray-900">
                        {{ formatHours(reviewsMs) }}
                    </dd>
                    <dd class="text-[11px] text-gray-400">
                        {{ reviewsShare.toFixed(0) }}% · {{ formatNumber(stats.invested.answersRecorded) }} answers
                    </dd>
                </div>
            </div>
            <div class="flex items-start gap-2">
                <span class="mt-1 rounded-full size-2.5" :style="{ backgroundColor: '#0093dd' }" aria-hidden="true" />
                <div>
                    <dt class="text-xs text-gray-500">Lessons</dt>
                    <dd class="text-sm font-semibold tabular-nums text-gray-900">
                        {{ formatHours(lessonsMs) }}
                    </dd>
                    <dd class="text-[11px] text-gray-400">
                        {{ lessonsShare.toFixed(0) }}% · {{ formatNumber(stats.invested.lessonsCompleted) }} items
                    </dd>
                </div>
            </div>
        </dl>

        <div class="pt-4 mt-5 border-t border-gray-100">
            <p class="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                If each review answer took…
            </p>
            <ul class="mt-2 space-y-1.5">
                <li
                    v-for="scenario in scenarios"
                    :key="scenario.seconds"
                    class="flex items-center justify-between px-2 py-1 text-xs rounded-lg"
                    :class="
                        scenario.isCurrent
                            ? 'bg-indigo-50 font-semibold text-gray-900'
                            : 'text-gray-500'
                    "
                >
                    <span>
                        {{ scenario.seconds }} seconds
                        <span v-if="scenario.isCurrent" class="ml-1 text-[10px] text-indigo-600">
                            (your setting)
                        </span>
                    </span>
                    <span class="tabular-nums">{{ formatHours(scenario.ms) }}</span>
                </li>
            </ul>
        </div>

        <p
            v-if="averageAnswersPerBurned > 0"
            class="pt-3 mt-4 text-[11px] leading-relaxed border-t border-gray-100 text-gray-400"
        >
            Your burned items took
            <strong class="text-gray-600">{{ averageAnswersPerBurned.toFixed(1) }} answers</strong>
            each on average, counting only those items. A flawless climb takes exactly
            {{ FLAWLESS_ANSWERS_PER_ITEM }} (meaning and reading at each of the 7 stage-ups), so you
            paid
            <strong class="text-gray-600">{{ overheadRatio.toFixed(2) }}×</strong>
            the minimum — everything above 1.00× is corrections and repeated reviews.
        </p>
    </StatPanel>
</template>
