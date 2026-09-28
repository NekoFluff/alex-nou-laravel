<script setup lang="ts">
/**
 * The next 48 hours of reviews, straight from WaniKani's own forecast endpoint. This is
 * the one genuinely forward-looking dataset the API provides.
 */
import { computed } from 'vue'
import StatPanel from './StatPanel.vue'
import BarChart from './BarChart.vue'
import { formatNumber, formatRelative, formatTime } from '@/domain/format'
import type { WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats }>()

const points = computed(() => props.stats.reviewForecast)

const labels = computed(() =>
    points.value.map((point) => `${point.hour.getHours().toString().padStart(2, '0')}:00`),
)
const values = computed(() => points.value.map((point) => point.count))

const totalUpcoming = computed(() => values.value.reduce((sum, value) => sum + value, 0))

const peak = computed(() => {
    const list = points.value
    if (list.length === 0) {
        return null
    }
    return list.reduce((best, point) => (point.count > best.count ? point : best), list[0])
})

</script>

<template>
    <StatPanel title="Next 48 hours" subtitle="Reviews WaniKani has scheduled, by the hour">
        <template #actions>
            <span class="text-xs tabular-nums text-gray-500">
                {{ formatNumber(totalUpcoming) }} scheduled
            </span>
        </template>

        <div class="grid grid-cols-3 gap-3">
            <div class="px-3 py-2.5 bg-gray-50 rounded-xl">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Waiting now</p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {{ formatNumber(stats.availableNow) }}
                </p>
            </div>
            <div class="px-3 py-2.5 bg-gray-50 rounded-xl">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Lessons ready</p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {{ formatNumber(stats.lessonsAvailable) }}
                </p>
            </div>
            <div class="px-3 py-2.5 bg-gray-50 rounded-xl">
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Next batch</p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {{ stats.nextReviewAt ? formatRelative(stats.nextReviewAt) : '—' }}
                </p>
            </div>
        </div>

        <div v-if="points.length > 0" class="mt-5">
            <BarChart
                :labels="labels"
                :values="values"
                color="#294ddb"
                :height="200"
                value-suffix="reviews"
            />
        </div>
        <p v-else class="mt-5 text-sm text-gray-500">
            Nothing scheduled in the next 48 hours. Use the lessons above to add more.
        </p>

        <template #footer>
            <span v-if="peak">
                Biggest batch at
                <strong class="text-gray-600">{{ formatTime(peak.hour) }}</strong>
                with {{ formatNumber(peak.count) }} reviews.
            </span>
        </template>
    </StatPanel>
</template>
