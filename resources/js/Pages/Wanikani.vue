<script setup lang="ts">
import { Head } from "@inertiajs/vue3";
import GenericLayout from "@/Layouts/GenericLayout.vue";
import Calendar from "@/Components/Calendar.vue";
import { LevelProgression } from "@/types/levelProgression";

const props = defineProps<{
    levelProgressions: LevelProgression[];
    currentLevel: number;
}>();
</script>

<template>
    <Head title="Projects" />
    <GenericLayout>
        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <Calendar
                    :current-level="currentLevel"
                    :level-progressions="levelProgressions"
                />
            </div>
        </div>
    </GenericLayout>
</template>
