<script setup lang="ts">
/**
 * A headline number. `value` is already formatted by the caller so this stays a dumb
 * presentational component.
 */
import InfoTip from './InfoTip.vue'

withDefaults(
    defineProps<{
        label: string
        value: string
        hint?: string
        detail?: string
        accent?: string
        tooltip?: string
        icon?: string
    }>(),
    {
        hint: undefined,
        detail: undefined,
        accent: '#6366f1',
        tooltip: undefined,
        icon: undefined,
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
    </div>
</template>
