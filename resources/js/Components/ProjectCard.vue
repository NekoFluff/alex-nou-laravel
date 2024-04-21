<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import Card from './Card.vue';

defineProps<{
    icon: string;
    link: string;
    externalLink?: boolean;
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
                <Link
                    v-if="!externalLink"
                    class="p-2 font-bold text-white bg-gray-900 rounded-sm"
                    :href="link"
                >
                    Check it out!
                </Link>
                <a
                    v-if="externalLink"
                    class="p-2 font-bold text-white bg-gray-900 rounded-sm"
                    :href="link"
                    target="_blank"
                    >Check it out!
                </a>
            </nav>
        </template>
    </Card>
</template>
