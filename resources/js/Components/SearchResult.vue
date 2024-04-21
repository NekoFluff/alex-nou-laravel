<script setup lang="ts">
defineProps<{
    text: string;
}>();

defineEmits(['click']);
</script>

<template>
    <button
        data-cy="searchResult"
        class="flex flex-row w-full p-3 text-sm rounded-md hover:bg-gray-200"
        @click="$emit('click', text)"
    >
        <slot name="icon"></slot>

        <span class="ml-2">
            {{ text }}
        </span>
    </button>
</template>
