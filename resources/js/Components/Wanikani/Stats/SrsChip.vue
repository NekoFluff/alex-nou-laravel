<script setup lang="ts">
/** The SRS stage pill shown next to item names. */
defineProps<{ name: string; color: string; compact?: boolean }>()
</script>

<template>
    <span
        class="inline-flex items-center font-medium border rounded-full whitespace-nowrap"
        :class="compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'"
        :style="{
            borderColor: `${color}73`,
            backgroundColor: `${color}1f`,
            color,
        }"
    >
        {{ name }}
    </span>
</template>
