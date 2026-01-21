<script setup lang="ts"></script>

<template>
    <div
        class="flex flex-col gap-3 p-4 transition-all duration-300 bg-white border border-gray-200 shadow-lg sm:gap-4 sm:p-6 rounded-xl sm:rounded-2xl hover:shadow-2xl sm:hover:-translate-y-1"
    >
        <h2 data-cy="header" class="pb-2 text-xl font-bold text-gray-800 border-b border-gray-100 sm:pb-3 sm:text-2xl">
            <slot name="header"></slot>
        </h2>
        <div data-cy="body" class="flex-grow">
            <slot></slot>
        </div>
        <div
            data-cy="footer"
            v-if="!!$slots.actions"
            class="flex justify-end pt-3 mt-3 border-t border-gray-100 sm:pt-4 sm:mt-4"
        >
            <slot name="actions"></slot>
        </div>
    </div>
</template>
