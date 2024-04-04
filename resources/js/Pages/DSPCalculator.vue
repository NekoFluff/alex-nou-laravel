<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import GenericLayout from '@/Layouts/GenericLayout.vue';
import ProjectCard from '@/Components/ProjectCard.vue';

</script>

<template>
    <Head title="Projects" />
    <GenericLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <!-- <div class="bg-transparent overflow-hidden shadow-sm sm:rounded-lg"> -->
                <div class="grid gap-4 md:grid-cols-3 xs:grid-cols-1">
                    <ProjectCard :link="route('dsp')" icon="project">
                        <template #header>DSP Calculator</template>
                        <p>A tool for the game Dyson Sphere Program that helps identify the necessary resources
                            and buildings required to produce an item.</p>
                    </ProjectCard>
                    <ProjectCard link="https://www.wahtako.com" externalLink icon="project">
                        <template #header>WAH Tako</template>
                        <p>Calulates how profitable it is to craft items in the game FFXIV.</p>
                    </ProjectCard>
                </div>
            </div>
        </div>
    </GenericLayout>
</template>
