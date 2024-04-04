<script setup lang="ts">
import Card from "./Card.vue";

defineProps<{
    icon: string,
    link: string,
    externalLink?: boolean,
}>();

</script>

<template>
    <Card>
        <template #header>
            <slot name="header"></slot>
        </template>
        <slot></slot>
        <template #actions>
            <nav>
                <RouterLink v-if="!externalLink" class="p-2 font-bold text-white bg-green-900 rounded-sm" :to="link">Check
                    it out!
                </RouterLink>
                <a v-if="externalLink" class="p-2 font-bold text-white bg-green-900 rounded-sm" :href="link"
                    target="_blank">Check it out!
                </a>
            </nav>
        </template>
    </Card>
</template>
