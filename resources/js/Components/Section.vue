<script setup lang="ts">

defineProps<{
    header: string
}>()

</script>

<template>
    <div data-cy="section" class="p-2 pb-4 mb-3 text-green-500 border border-b-4 border-green-500 rounded-md">
        <h2 data-cy="section-header" class="mx-2 mb-3 ml-1 text-lg">
            {{ header }}
        </h2>
        <slot></slot>
    </div>
</template>