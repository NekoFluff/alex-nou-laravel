<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import GenericLayout from '@/Layouts/GenericLayout.vue';
import Calendar from '@/Components/Calendar.vue';
import { LevelProgression } from '@/types/levelProgression';

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
}>();
</script>

<template>
    <Head title="WaniKani Progress" />
    <GenericLayout>
        <div class="px-8 py-12 mx-auto max-w-7xl">
            <h1 class="mx-4 text-xl">WaniKani progress tracker</h1>
            <p class="mx-4 mt-2 text-sm italic">
                This is a yearly calendar to keep track of my WaniKani goals and progress. I
                am currently on level
                <span class="text-lg font-bold"> {{ currentLevel }}</span>
            </p>
            <Calendar :current-level="currentLevel" :level-progressions="levelProgressions" />
        </div>
    </GenericLayout>
</template>
