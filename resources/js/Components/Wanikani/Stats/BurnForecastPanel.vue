<script setup lang="ts">
/**
 * When the items you already know will finish burning.
 *
 * Burn dates are inferred by walking the SRS interval ladder from each item's next
 * review. That assumes no further mistakes, so it is an optimistic floor — labelled as
 * an estimate rather than presented as fact.
 */
import { computed, ref } from 'vue'
import StatPanel from './StatPanel.vue'
import InfoTip from './InfoTip.vue'
import AreaChart from './AreaChart.vue'
import { formatDate, formatHours, formatNumber } from '@/domain/format'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

/**
 * Windows for the burn chart. Labels are day counts in every case, so the buttons are
 * directly comparable; the default sits in the middle of the range.
 */
const horizons = [
    { label: '30d', days: 30 },
    { label: '60d', days: 60 },
    { label: '90d', days: 90 },
    { label: '120d', days: 120 },
] as const

const horizon = ref<number>(90)
const now = new Date()
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

const series = computed(() => {
    const cutoff = new Date(now.getTime() + horizon.value * 86_400_000)
    let cumulative = 0
    const within: Array<{ day: Date; cumulative: number }> = []

    for (const point of props.stats.burnForecast) {
        if (point.day.getTime() > cutoff.getTime()) {
            break
        }
        cumulative += point.burnedCount
        within.push({ day: point.day, cumulative })
    }

    return within
})

/*
 * Anchored at today (0) and at the end of the window (the final total), so the x-axis
 * always spans exactly the window chosen rather than stopping at the last burn.
 */
const plotted = computed(() => {
    const end = now.getTime() + horizon.value * 86_400_000
    const last = series.value.length === 0 ? 0 : series.value[series.value.length - 1].cumulative
    return [
        { time: startOfToday.getTime(), cumulative: 0 },
        ...series.value.map((point) => ({ time: point.day.getTime(), cumulative: point.cumulative })),
        { time: end, cumulative: last },
    ]
})
const timestamps = computed(() => plotted.value.map((point) => point.time))
const values = computed(() => plotted.value.map((point) => point.cumulative))

const horizonTotal = computed(() =>
    series.value.length === 0 ? 0 : series.value[series.value.length - 1].cumulative,
)

const horizonMs = computed(() => {
    const cutoff = new Date(now.getTime() + horizon.value * 86_400_000)
    return props.stats.burnForecast
        .filter((point) => point.day.getTime() <= cutoff.getTime())
        .reduce((sum, point) => sum + point.reviewMs, 0)
})

const finalDate = computed(() => {
    const points = props.stats.burnForecast
    return points.length === 0 ? null : points[points.length - 1].day
})

const remainingToBurn = computed(() => props.stats.counts.unlocked - props.stats.counts.burned)
</script>

<template>
    <StatPanel title="Burn forecast" subtitle="When your items will be burned">
        <template #actions>
            <InfoTip
                text="When each item would burn if you never miss it again, so this is the earliest it could happen."
            />
            <div class="flex overflow-hidden border border-gray-200 rounded-lg">
                <button
                    v-for="option in horizons"
                    :key="option.days"
                    type="button"
                    class="px-2.5 py-1 text-[11px] font-medium transition-colors"
                    :class="
                        horizon === option.days
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-500 hover:text-gray-900'
                    "
                    @click="horizon = option.days"
                >
                    {{ option.label }}
                </button>
            </div>
        </template>

        <div class="grid grid-cols-2 gap-3">
            <div class="px-3 py-2.5 bg-gray-50 rounded-xl">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Burning in this window</p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {{ formatNumber(horizonTotal) }}
                </p>
            </div>
            <div class="px-3 py-2.5 bg-gray-50 rounded-xl">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Reviews it will take</p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {{ formatHours(horizonMs) }}
                </p>
            </div>
        </div>

        <div v-if="series.length > 0" class="mt-5">
            <AreaChart :timestamps="timestamps" :values="values" color="#489cc1" :height="200" value-suffix="burned" />
        </div>
        <p v-else class="mt-5 text-sm text-gray-500">
            No items are scheduled to burn inside this window.
        </p>

        <template #footer>
            <span>
                {{ formatNumber(remainingToBurn) }} unlocked items still to burn.
                <template v-if="finalDate">
                    The last one burns around
                    <strong class="text-gray-600">{{ formatDate(finalDate) }}</strong
                    >.
                </template>
            </span>
        </template>
    </StatPanel>
</template>
