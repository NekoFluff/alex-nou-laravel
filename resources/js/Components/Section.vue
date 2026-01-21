<script setup lang="ts">
defineProps<{
    header: string;
}>();
</script>

<template>
    <div data-cy="section" class="bg-white border border-slate-300 rounded">
        <h2 data-cy="section-header" class="px-4 py-3 text-base font-medium text-slate-900 border-b border-slate-300">
            {{ header }}
        </h2>
        <div class="p-4">
            <slot></slot>
        </div>
    </div>
</template>
