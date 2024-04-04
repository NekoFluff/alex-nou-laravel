<script setup lang="ts">

</script>

<template>
    <div class="flex flex-col gap-2 p-3 m-3 text-green-500 border border-green-500 rounded-md shadow-lg">

        <div data-cy="header" class="font-bold">
            <slot name="header"></slot>
        </div>
        <div data-cy="body" class="flex-grow">
            <slot></slot>
        </div>
        <div data-cy="footer" v-if="!!$slots.actions" class="flex justify-end pb-2 mt-5">
            <slot name="actions"></slot>
        </div>

    </div>
</template>
