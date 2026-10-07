<script setup lang="ts">
/**
 * Panel wrapper for the dashboard sections.
 *
 * Matches the visual language of the existing `Components/Card.vue` (white, gray-200
 * border, xl radius) but with a header row this dashboard needs: a title, optional
 * subtitle, and a right-hand slot for controls and the info affordance.
 */
withDefaults(
    defineProps<{
        title?: string
        subtitle?: string
        /** Removes inner padding, for panels that own their own edges (tables, grids). */
        flush?: boolean
    }>(),
    { title: undefined, subtitle: undefined, flush: false },
)
</script>

<template>
    <section class="min-w-0 bg-white border border-gray-200 shadow-sm rounded-xl">
        <header
            v-if="title || $slots.actions"
            class="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-gray-100 sm:px-5 sm:py-4"
        >
            <div class="min-w-0">
                <h2 v-if="title" class="text-sm font-semibold tracking-wide text-gray-800">
                    {{ title }}
                </h2>
                <p v-if="subtitle" class="mt-0.5 text-xs text-gray-500">{{ subtitle }}</p>
            </div>
            <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
                <slot name="actions" />
            </div>
        </header>

        <div :class="flush ? '' : 'p-4 sm:p-5'">
            <slot />
        </div>

        <footer
            v-if="$slots.footer"
            class="px-4 py-3 text-xs border-t border-gray-100 sm:px-5 text-gray-500"
        >
            <slot name="footer" />
        </footer>
    </section>
</template>
