<script setup lang="ts">
/**
 * A small "?" affordance with a hover/focus tooltip.
 *
 * The tooltip is teleported to `<body>` and positioned fixed rather than absolutely
 * inside the panel. Inline positioning looks fine until a tooltip near a panel edge or
 * the top of the viewport is clipped by an ancestor's bounds — which is exactly what
 * happened in the standalone version of this dashboard, cutting the text off.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { computeTooltipPlacement } from '@/domain/tooltipPlacement'

defineProps<{ text: string; label?: string }>()

const anchor = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const position = ref({ top: 0, left: 0, placement: 'top' as 'top' | 'bottom' })

const TOOLTIP_WIDTH = 240

function reposition(): void {
    const element = anchor.value
    if (!element) {
        return
    }

    position.value = computeTooltipPlacement(
        element.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        { width: TOOLTIP_WIDTH },
    )
}

function open(): void {
    reposition()
    isOpen.value = true
}

function close(): void {
    isOpen.value = false
}

/** Keeps the tooltip glued to its icon while the panel or window moves. */
function onViewportChange(): void {
    if (isOpen.value) {
        reposition()
    }
}

window.addEventListener('scroll', onViewportChange, true)
window.addEventListener('resize', onViewportChange)

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
})

const tooltipStyle = computed(() => ({
    top: `${position.value.top}px`,
    left: `${position.value.left}px`,
    width: `${TOOLTIP_WIDTH}px`,
    transform: position.value.placement === 'top' ? 'translateY(-100%)' : 'none',
}))
</script>

<template>
    <span ref="anchor" class="relative inline-flex align-middle">
        <button
            type="button"
            class="grid text-[9px] font-bold text-gray-400 transition-colors border border-gray-300 rounded-full cursor-help size-4 place-items-center hover:border-indigo-500 hover:text-indigo-500"
            :aria-label="label ?? 'More information'"
            :aria-expanded="isOpen"
            @mouseenter="open"
            @mouseleave="close"
            @focus="open"
            @blur="close"
            @click.prevent="isOpen ? close() : open()"
        >
            ?
        </button>

        <Teleport to="body">
            <div
                v-if="isOpen"
                role="tooltip"
                class="pointer-events-none fixed z-[100] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-gray-600 shadow-xl"
                :style="tooltipStyle"
            >
                {{ text }}
            </div>
        </Teleport>
    </span>
</template>
