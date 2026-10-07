<script setup lang="ts">
/**
 * A headline number. `value` is already formatted by the caller so this stays a dumb
 * presentational component.
 *
 * `breakdown` adds a "How is this calculated?" toggle that shows the sum behind the
 * number, line by line, with the account's own figures plugged in.
 */
import { ref } from 'vue'
import InfoTip from './InfoTip.vue'

export interface KpiBreakdown {
    lines: Array<{ label: string; calc?: string; value: string }>
    total: string
    note?: string
}

const isOpen = ref(false)

withDefaults(
    defineProps<{
        label: string
        value: string
        hint?: string
        detail?: string
        accent?: string
        tooltip?: string
        icon?: string
        breakdown?: KpiBreakdown
    }>(),
    {
        hint: undefined,
        detail: undefined,
        accent: '#6366f1',
        tooltip: undefined,
        icon: undefined,
        breakdown: undefined,
    },
)
</script>

<template>
    <div class="relative p-4 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl sm:p-5">
        <div
            class="absolute inset-x-0 top-0 h-px"
            :style="{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }"
            aria-hidden="true"
        />
        <div class="flex items-center gap-1.5">
            <span v-if="icon" aria-hidden="true" class="text-sm">{{ icon }}</span>
            <h3 class="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                {{ label }}
            </h3>
            <InfoTip v-if="tooltip" :text="tooltip" :label="`About ${label}`" />
        </div>

        <p class="mt-3 text-2xl font-semibold leading-none tabular-nums text-gray-900 sm:text-3xl">
            {{ value }}
        </p>

        <p v-if="detail" class="mt-2 text-xs text-gray-500">{{ detail }}</p>
        <p v-if="hint" class="mt-1.5 text-[11px] text-gray-400">{{ hint }}</p>

        <template v-if="breakdown">
            <button
                type="button"
                class="mt-3 text-[11px] font-medium text-indigo-600 hover:underline"
                :aria-expanded="isOpen"
                @click="isOpen = !isOpen"
            >
                {{ isOpen ? 'Hide calculation' : 'How is this calculated?' }}
            </button>

            <div v-if="isOpen" class="pt-3 mt-2 text-[11px] border-t border-gray-100">
                <dl class="space-y-1.5">
                    <div v-for="line in breakdown.lines" :key="line.label" class="flex justify-between gap-3">
                        <dt class="min-w-0 text-gray-500">
                            {{ line.label }}
                            <span v-if="line.calc" class="block text-gray-400 tabular-nums">{{ line.calc }}</span>
                        </dt>
                        <dd class="font-medium text-gray-900 tabular-nums shrink-0">{{ line.value }}</dd>
                    </div>
                    <div class="flex justify-between gap-3 pt-1.5 border-t border-gray-100">
                        <dt class="font-medium text-gray-700">Total</dt>
                        <dd class="font-semibold text-gray-900 tabular-nums shrink-0">{{ breakdown.total }}</dd>
                    </div>
                </dl>
                <p v-if="breakdown.note" class="mt-2.5 leading-relaxed text-gray-400">{{ breakdown.note }}</p>
            </div>
        </template>
    </div>
</template>
