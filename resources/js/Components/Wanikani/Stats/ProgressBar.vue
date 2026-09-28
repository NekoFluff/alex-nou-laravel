<script setup lang="ts">
withDefaults(
    defineProps<{
        value: number
        max?: number
        color?: string
        height?: number
        label?: string
    }>(),
    { max: 100, color: '#6366f1', height: 8, label: undefined },
)
</script>

<template>
    <div
        class="w-full overflow-hidden rounded-full bg-gray-100"
        :style="{ height: `${height}px` }"
        role="progressbar"
        :aria-valuenow="Math.round(value)"
        aria-valuemin="0"
        :aria-valuemax="Math.round(max)"
        :aria-label="label"
    >
        <div
            class="h-full rounded-full transition-[width] duration-700 ease-out"
            :style="{
                width: `${Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100))}%`,
                backgroundColor: color,
            }"
        />
    </div>
</template>
