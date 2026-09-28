<script setup lang="ts">
/**
 * Renders a single WaniKani item.
 *
 * Two things make this less trivial than it looks:
 *
 * - Radicals WaniKani invented (like "ground") have no Unicode character at all, so they
 *   only exist as an SVG hosted by WaniKani. Those get an image.
 * - Item length varies wildly, from the single character 一 to vocabulary like 乱れる.
 *   A fixed square with a fixed font size overflows on the long ones, so the font scales
 *   with the character count and the box grows horizontally to fit.
 */
import { computed } from 'vue'
import type { SubjectType } from '@/api/types'
import { SUBJECT_PALETTE } from '@/domain/wanikaniPalette'

const props = withDefaults(
    defineProps<{
        characters: string | null
        type: SubjectType
        imageUrl?: string | null
        size?: 'sm' | 'md' | 'lg'
    }>(),
    { imageUrl: null, size: 'md' },
)

/** Box height for each size; the width is derived from the content. */
const BOX_HEIGHT = { sm: 30, md: 42, lg: 58 } as const
/** A little more than the glyph advance width, so characters do not touch. */
const ADVANCE_RATIO = 1.12

const height = computed(() => BOX_HEIGHT[props.size])
const text = computed(() => props.characters ?? '')
const length = computed(() => [...text.value].length)

const showImage = computed(() => length.value === 0 && Boolean(props.imageUrl))

/** Long items get smaller type so the box never becomes a banner. */
const fontSize = computed(() => {
    const base = { sm: 16, md: 22, lg: 30 }[props.size]
    const scale = { 1: 1, 2: 0.7, 3: 0.56, 4: 0.48 }[Math.min(length.value, 4)] ?? 0.42
    return Math.max(9, Math.round(base * scale))
})

const width = computed(() => {
    if (showImage.value || length.value === 0) {
        return height.value
    }
    const textWidth = length.value * fontSize.value * ADVANCE_RATIO
    // Single characters stay square; anything longer is as wide as it needs to be.
    return Math.round(Math.max(height.value, textWidth + 10))
})

const tint = computed(() => SUBJECT_PALETTE[props.type])

/** Very long items are allowed to spill slightly rather than shrink to unreadable. */
const isVeryLong = computed(() => length.value > 4)
</script>

<template>
    <span
        class="inline-grid font-medium border rounded-lg shrink-0 place-items-center"
        :style="{
            height: `${height}px`,
            width: `${width}px`,
            borderColor: `${tint}66`,
            backgroundColor: `${tint}1f`,
            color: tint,
            paddingInline: '3px',
        }"
        :title="`${type}: ${text || 'image'}`"
    >
        <img
            v-if="showImage"
            :src="imageUrl ?? ''"
            alt=""
            class="max-h-[64%] max-w-[64%]"
            style="filter: invert(1) brightness(0.35)"
            loading="lazy"
        />
        <span
            v-else-if="length > 0"
            class="leading-none whitespace-nowrap jp"
            :style="{ fontSize: `${fontSize}px`, letterSpacing: isVeryLong ? '-0.02em' : undefined }"
        >
            {{ text }}
        </span>
    </span>
</template>

<style scoped>
/* Japanese glyphs need a different stack from the site's Figtree default. */
.jp {
    font-family: 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', Meiryo, sans-serif;
    letter-spacing: 0.02em;
}
</style>
