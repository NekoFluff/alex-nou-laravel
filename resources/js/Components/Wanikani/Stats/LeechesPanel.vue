<script setup lang="ts">
/**
 * Leeches: items you keep getting wrong.
 *
 * WaniKani has no concept of a leech in its API, so one is defined here as an item still
 * short of burned that has been missed at least four times. The score weights misses by
 * how far the item is from graduating, which surfaces the ones actually costing time.
 */
import { computed, ref } from 'vue'
import StatPanel from './StatPanel.vue'
import InfoTip from './InfoTip.vue'
import ItemGlyph from './ItemGlyph.vue'
import SrsChip from './SrsChip.vue'
import { formatHours, formatNumber, formatPercent } from '@/domain/format'
import { SRS_PALETTE, SUBJECT_PALETTE } from '@/domain/wanikaniPalette'
import { SUBJECT_TYPE_LABELS } from '@/domain/constants'
import type { StudySettings, WaniKaniStats } from '@/domain/stats-types'

const props = defineProps<{ stats: WaniKaniStats; settings: StudySettings }>()

const isExpanded = ref(false)
const VISIBLE = 8

const items = computed(() => props.stats.leeches.items)
const visibleItems = computed(() => (isExpanded.value ? items.value : items.value.slice(0, VISIBLE)))

/** What these problem items alone will cost in review time, mistakes included. */
const leechCost = computed(() => {
    const totalMisses = items.value.reduce((sum, item) => sum + item.incorrect, 0)
    const remaining = items.value.reduce((sum, item) => sum + (9 - item.srsStage), 0)
    return (totalMisses + remaining) * props.settings.secondsPerReview * 1000
})

const totalMisses = computed(() => items.value.reduce((sum, item) => sum + item.incorrect, 0))
</script>

<template>
    <StatPanel title="Leeches" subtitle="Unlocked items you keep missing" flush>
        <template #actions>
            <InfoTip
                text="An item counts as a leech when it is short of burned and has at least four recorded wrong answers. Keep missing an item at Guru or above and WaniKani drops it four stages, which is why these consume so much review time."
            />
            <span
                v-if="items.length > 0"
                class="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700"
            >
                {{ formatNumber(items.length) }} found
            </span>
        </template>

        <div v-if="items.length > 0">
            <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                            <th class="px-4 py-2 font-medium sm:px-5">Item</th>
                            <th class="px-3 py-2 font-medium">Stage</th>
                            <th class="px-3 py-2 font-medium text-right">Misses</th>
                            <th class="px-3 py-2 font-medium text-right">Accuracy</th>
                            <th class="px-3 py-2 font-medium text-right">Streak</th>
                            <th class="px-4 py-2 font-medium text-right sm:px-5">Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="item in visibleItems"
                            :key="item.subjectId"
                            class="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >
                            <td class="px-4 py-2.5 sm:px-5">
                                <!--
                                    Links to WaniKani's own page for the item, which is where
                                    you would actually go to study it again. Opens in a new
                                    tab so a session on this dashboard is not lost.
                                -->
                                <a
                                    v-if="item.documentUrl"
                                    :href="item.documentUrl"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    class="flex items-center gap-2.5 -mx-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50"
                                    :title="`Open ${item.primaryMeaning} on WaniKani`"
                                >
                                    <ItemGlyph
                                        :characters="item.characters"
                                        :type="item.type"
                                        :image-url="item.imageUrl"
                                        size="sm"
                                    />
                                    <div class="min-w-0">
                                        <p
                                            class="font-medium truncate text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-500"
                                        >
                                            {{ item.primaryMeaning }}
                                        </p>
                                        <p class="text-[10px] text-gray-400">
                                            {{ SUBJECT_TYPE_LABELS[item.type] }}
                                        </p>
                                    </div>
                                </a>
                                <div v-else class="flex items-center gap-2.5">
                                    <ItemGlyph
                                        :characters="item.characters"
                                        :type="item.type"
                                        :image-url="item.imageUrl"
                                        size="sm"
                                    />
                                    <div class="min-w-0">
                                        <p class="font-medium truncate text-gray-900">
                                            {{ item.primaryMeaning }}
                                        </p>
                                        <p class="text-[10px] text-gray-400">
                                            {{ SUBJECT_TYPE_LABELS[item.type] }}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-3 py-2.5">
                                <SrsChip
                                    :name="item.srsStageName"
                                    :color="SRS_PALETTE[item.srsStage] ?? '#6b7280'"
                                    compact
                                />
                            </td>
                            <td class="px-3 py-2.5 font-semibold tabular-nums text-right text-red-600">
                                {{ item.incorrect }}
                            </td>
                            <td class="px-3 py-2.5 tabular-nums text-right text-gray-500">
                                {{ formatPercent(item.accuracy, 0) }}
                            </td>
                            <td class="px-3 py-2.5 tabular-nums text-right text-gray-500">
                                {{ item.currentStreak }}<span class="text-gray-400">/{{ item.maxStreak }}</span>
                            </td>
                            <td class="px-4 py-2.5 tabular-nums text-right sm:px-5 text-gray-400">
                                {{ item.level }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="items.length > VISIBLE" class="px-4 py-3 sm:px-5">
                <button
                    type="button"
                    class="text-xs font-medium text-indigo-600 hover:underline"
                    @click="isExpanded = !isExpanded"
                >
                    {{ isExpanded ? 'Show fewer' : `Show all ${items.length}` }}
                </button>
            </div>
        </div>

        <div v-else class="px-5 py-8 text-sm text-center text-gray-500">
            No leeches right now — nothing short of burned has four or more misses. 🎉
        </div>

        <template v-if="items.length > 0" #footer>
            <span>
                {{ formatNumber(totalMisses) }} recorded misses across these items. Clearing them will
                take roughly
                <strong class="text-gray-600">{{ formatHours(leechCost) }}</strong>
                of extra review time.
            </span>
        </template>
    </StatPanel>
</template>
