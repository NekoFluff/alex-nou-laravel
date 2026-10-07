<script setup lang="ts">
/**
 * The whole climb at a glance: all 60 levels, shaded by how finished each one is.
 *
 * Shading is computed in JS rather than through Tailwind classes because the colour
 * depends on data — and Tailwind cannot see class names built at runtime.
 */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import InfoTip from './InfoTip.vue'
import BarChart from './BarChart.vue'
import { formatDate, formatNumber } from '@/domain/format'
import { UI_PALETTE } from '@/domain/wanikaniPalette'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

const rows = computed(() => props.stats.levels.rows)

function levelStyle(row: (typeof rows.value)[number]): Record<string, string> {
    if (row.subjectCount === 0) {
        return { backgroundColor: UI_PALETTE.slate100, color: UI_PALETTE.slate400 }
    }
    if (row.burned === row.subjectCount) {
        return { backgroundColor: '#4b5563', color: '#fff' }
    }

    const burnShare = row.burned / row.subjectCount
    const passedShare = row.passed / row.subjectCount

    if (burnShare > 0) {
        return { backgroundColor: `color-mix(in oklab, #489cc1 ${35 + burnShare * 65}%, white)`, color: '#fff' }
    }
    if (passedShare > 0) {
        return { backgroundColor: `color-mix(in oklab, #882d9e ${30 + passedShare * 50}%, white)`, color: '#fff' }
    }
    if (row.started > 0) {
        return { backgroundColor: '#dd00934d', color: '#831843' }
    }
    if (row.unlocked > 0) {
        return { backgroundColor: '#6366f11f', color: UI_PALETTE.slate700 }
    }
    return { backgroundColor: UI_PALETTE.slate100, color: UI_PALETTE.slate400 }
}

/**
 * The tile tooltip.
 *
 * Carries the level's date as well as its counts: the day it was actually passed, or the
 * day it is expected at the measured pace. A level that was never passed and has no
 * projection (a reset leaves these behind) simply omits the date rather than inventing one.
 */
function levelTooltip(row: (typeof rows.value)[number]): string {
    const parts: string[] = []

    if (row.passedAt) {
        parts.push(`Passed ${formatDate(row.passedAt)}`)
    } else if (row.projectedPassAt) {
        parts.push(`Est. ${formatDate(row.projectedPassAt)}`)
    }

    if (row.subjectCount === 0) {
        parts.push('no subjects')
        return parts.join(' · ')
    }

    if (row.isCurrent) {
        parts.push('current')
    }
    parts.push(`${row.unlocked}/${row.subjectCount} unlocked`, `${row.passed} passed`, `${row.burned} burned`)
    if (row.daysSpent !== null) {
        parts.push(`${row.daysSpent.toFixed(1)} days`)
    }

    return parts.join(' · ')
}

const recent = computed(() => props.stats.levels.recentDurations)
const chartLabels = computed(() => recent.value.map((entry) => `L${entry.level}`))
const chartValues = computed(() => recent.value.map((entry) => Number(entry.days.toFixed(1))))

const fastest = computed(() =>
    recent.value.length === 0
        ? null
        : recent.value.reduce((best, entry) => (entry.days < best.days ? entry : best), recent.value[0]),
)

const slowest = computed(() =>
    recent.value.length === 0
        ? null
        : recent.value.reduce((worst, entry) => (entry.days > worst.days ? entry : worst), recent.value[0]),
)

const completedLevels = computed(() => rows.value.filter((row) => row.isComplete).length)

/** Resets explain duplicated level progressions and impossible gaps in the pace chart. */
const resets = computed(() => props.stats.levels.resets)
</script>

<template>
    <StatPanel title="Level history" subtitle="All 60 levels, shaded by progress">
        <template #actions>
            <InfoTip
                text="Purple means items passed, blue means items burned. Levels fill in slowly because burning takes months. Hover a square for details."
            />
        </template>

        <div class="grid grid-cols-10 gap-1.5">
            <div
                v-for="row in rows"
                :key="row.level"
                class="relative grid text-[10px] font-semibold tabular-nums transition-transform rounded-md aspect-square place-items-center hover:scale-110"
                :style="levelStyle(row)"
                :title="levelTooltip(row)"
                :data-level="row.level"
            >
                {{ row.level }}
                <span
                    v-if="row.isCurrent"
                    class="absolute -top-1 -right-1 rounded-full size-2.5 border-2 border-white bg-indigo-600"
                    aria-label="current level"
                />
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[10px] text-gray-400">
            <span class="flex items-center gap-1.5">
                <span class="rounded-sm size-2.5" :style="{ backgroundColor: '#6366f1', opacity: 0.35 }" />
                Unlocked
            </span>
            <span class="flex items-center gap-1.5">
                <span class="rounded-sm size-2.5" :style="{ backgroundColor: '#dd0093', opacity: 0.6 }" />
                Started
            </span>
            <span class="flex items-center gap-1.5">
                <span class="rounded-sm size-2.5" :style="{ backgroundColor: '#882d9e' }" />
                Passed
            </span>
            <span class="flex items-center gap-1.5">
                <span class="rounded-sm size-2.5" :style="{ backgroundColor: '#489cc1' }" />
                Burning
            </span>
            <span class="flex items-center gap-1.5">
                <span class="rounded-sm size-2.5" :style="{ backgroundColor: '#4b5563' }" />
                Fully burned
            </span>
            <span class="ml-auto">
                {{ formatNumber(completedLevels) }} of {{ rows.length }} levels passed
            </span>
        </div>

        <div
            v-if="resets.length > 0"
            class="px-3.5 py-3 mt-5 text-[11px] leading-relaxed border border-amber-200 bg-amber-50 rounded-xl text-amber-900"
        >
            <p class="font-semibold">
                {{ resets.length === 1 ? 'This account was reset' : 'This account was reset more than once' }}
            </p>
            <ul class="mt-1.5 space-y-1">
                <li v-for="(reset, index) in resets" :key="index">
                    Level {{ reset.originalLevel }} → {{ reset.targetLevel }} on
                    {{ formatDate(reset.confirmedAt) }}
                </li>
            </ul>
            <p class="mt-1.5 text-amber-700">
                After a reset you redo earlier levels, so those repeat level-ups are left out of
                your pace.
            </p>
        </div>

        <div v-if="recent.length > 1" class="pt-4 mt-5 border-t border-gray-100">
            <p class="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Days spent on recent levels
            </p>
            <div class="mt-3">
                <BarChart
                    :labels="chartLabels"
                    :values="chartValues"
                    color="#0093dd"
                    :height="170"
                    value-suffix="days"
                />
            </div>
            <p class="mt-3 text-[11px] leading-relaxed text-gray-400">
                Median
                <strong class="text-gray-600">{{ stats.levels.medianLevelDays.toFixed(1) }} days</strong>
                <template v-if="fastest">
                    · fastest L{{ fastest.level }} at {{ fastest.days.toFixed(1) }} days</template
                >
                <template v-if="slowest">
                    · slowest L{{ slowest.level }} at {{ slowest.days.toFixed(1) }} days</template
                >
            </p>

        </div>

        <!--
            The same projection the KPI card shows, stated where its inputs are
            visible: the median above, applied to the levels still to come.
        -->
        <div class="flex flex-wrap items-baseline justify-between gap-2 px-3.5 py-3 mt-4 bg-gray-50 rounded-xl">
            <span class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                Estimated completion
            </span>
            <span class="text-sm font-semibold text-gray-900">
                <template v-if="stats.projection.levelsRemaining === 0">
                    Level 60 reached 🎉
                </template>
                <template v-else-if="stats.projection.etaByLevelPace">
                    {{ formatDate(stats.projection.etaByLevelPace) }}
                    <span class="text-[11px] font-normal text-gray-400">
                        · {{ stats.projection.levelsRemaining }} levels left at
                        {{ stats.projection.daysPerLevel.toFixed(1) }} days each
                    </span>
                </template>
                <template v-else> Not enough level history yet </template>
            </span>
        </div>
    </StatPanel>
</template>
