<script setup lang="ts">
/**
 * Lets the two pace assumptions be tuned. Everything downstream recomputes from these,
 * so this is the one panel that can meaningfully change every number on the page.
 */
import { computed } from 'vue'
import { formatHours, formatNumber } from '@/domain/format'
import { DEFAULT_SETTINGS } from '@/domain/stats'
import type { StudySettings, WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats; settings: StudySettings }>()
const emit = defineEmits<{ reset: [] }>()

const totals = computed(() => ({
    invested: formatHours(props.stats.invested.totalMs),
    remaining: formatHours(props.stats.workload.totalMs),
    total: formatHours(props.stats.projection.totalCurriculumMs),
    unlocked: formatNumber(props.stats.counts.unlocked),
    catalogue: formatNumber(props.stats.counts.total),
}))

const isCustomised = computed(() => props.stats.assumptions.source === 'custom')
</script>

<template>
    <section v-if="settings.isPanelOpen" class="p-4 border rounded-xl border-indigo-200 bg-indigo-50/50 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h2 class="text-sm font-semibold text-gray-900">
                    Time assumptions
                    <span
                        v-if="isCustomised"
                        class="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700"
                    >
                        custom
                    </span>
                </h2>
                <p class="max-w-2xl mt-1 text-xs text-gray-500">
                    WaniKani doesn't track study time, so every time on this page is an estimate built
                    from these two numbers. Adjust them to match your pace.
                </p>
            </div>
            <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:text-gray-900"
                @click="emit('reset')"
            >
                Reset to defaults
            </button>
        </div>

        <div class="grid gap-6 mt-5 sm:grid-cols-2">
            <label class="block">
                <span class="flex items-baseline justify-between text-xs font-medium text-gray-900">
                    Seconds per review answer
                    <span class="text-sm tabular-nums text-indigo-600">
                        {{ settings.secondsPerReview }}s
                    </span>
                </span>
                <input
                    v-model.number="settings.secondsPerReview"
                    type="range"
                    min="5"
                    max="120"
                    step="1"
                    class="w-full mt-3 accent-indigo-600"
                />
                <span class="block mt-1 text-[11px] text-gray-400">
                    One answer, meaning or reading. Kanji and vocab reviews need two.
                </span>
            </label>

            <label class="block">
                <span class="flex items-baseline justify-between text-xs font-medium text-gray-900">
                    Minutes per lesson
                    <span class="text-sm tabular-nums text-indigo-600">
                        {{ settings.minutesPerLesson.toFixed(1) }} min
                    </span>
                </span>
                <input
                    v-model.number="settings.minutesPerLesson"
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    class="w-full mt-3 accent-indigo-600"
                />
                <span class="block mt-1 text-[11px] text-gray-400">
                    Learning one new item, including its quiz.
                </span>
            </label>
        </div>

        <dl class="grid grid-cols-2 gap-4 pt-4 mt-5 text-xs border-t border-indigo-100 sm:grid-cols-4">
            <div>
                <dt class="text-gray-400">Invested</dt>
                <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">{{ totals.invested }}</dd>
            </div>
            <div>
                <dt class="text-gray-400">Remaining</dt>
                <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">{{ totals.remaining }}</dd>
            </div>
            <div>
                <dt class="text-gray-400">Total</dt>
                <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">{{ totals.total }}</dd>
            </div>
            <div>
                <dt class="text-gray-400">Items unlocked</dt>
                <dd class="mt-0.5 font-semibold tabular-nums text-gray-900">
                    {{ totals.unlocked }}
                    <span class="text-[10px] font-normal text-gray-400">/ {{ totals.catalogue }}</span>
                </dd>
            </div>
        </dl>
    </section>
</template>
