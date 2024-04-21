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
        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="pl-8">
                    <h1 class="text-xl">WaniKani progress tracker</h1>
                    <p class="mt-2 text-sm italic">
                        This is a yearly calendar to keep track of my WaniKani goals and progress. I
                        am currently on level
                        <span class="text-lg font-bold"> {{ currentLevel }}</span>
                    </p>
                </div>
                <Calendar :current-level="currentLevel" :level-progressions="levelProgressions" />
            </div>
        </div>
    </GenericLayout>
</template>
