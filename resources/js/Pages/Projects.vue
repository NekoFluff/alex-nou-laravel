<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import GenericLayout from '@/Layouts/GenericLayout.vue';

const projects = [
    {
        key: 'jp-image-translator',
        title: 'JP Image Translator',
        description:
            'Translate Japanese text in images using AI-powered OCR and translation technology.',
        link: 'https://jpimagetranslator.com',
        externalLink: true,
    },
    {
        key: 'wah-tako',
        title: 'WAH Tako',
        description: 'Calculates how profitable it is to craft items in the game FFXIV.',
        link: 'https://www.wahtako.com',
        externalLink: true,
    },
    {
        key: 'dsp-calculator',
        title: 'DSP Calculator',
        description:
            'A tool for the game Dyson Sphere Program that helps identify the necessary resources and buildings required to produce an item.',
        link: route('dsp'),
        externalLink: false,
    },
];
</script>

<template>
    <Head title="Projects" />
    <GenericLayout>
        <div class="px-4 py-16 mx-auto max-w-4xl sm:px-8">
            <p class="mx-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">Selected Work</p>
            <h1 class="mx-4 mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Projects
            </h1>

            <div class="mt-12 border-t border-gray-200 divide-y divide-gray-200">
                <component
                    :is="project.externalLink ? 'a' : Link"
                    v-for="(project, index) in projects"
                    :key="project.key"
                    :href="project.link"
                    v-bind="project.externalLink ? { target: '_blank', rel: 'noopener noreferrer' } : {}"
                    class="flex flex-col gap-1 px-4 py-8 transition-colors group sm:flex-row sm:gap-8 sm:items-baseline hover:bg-gray-50"
                >
                    <span class="font-mono text-sm text-gray-300 sm:w-8 shrink-0">
                        {{ String(index + 1).padStart(2, '0') }}
                    </span>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-900 sm:text-3xl">
                            <span class="transition-colors group-hover:text-indigo-600">
                                {{ project.title }}
                            </span>
                            <span
                                class="inline-block ml-1 transition-transform text-indigo-600 group-hover:translate-x-1.5"
                                aria-hidden="true"
                            >
                                &rarr;
                            </span>
                        </h2>
                        <p class="max-w-xl mt-2 text-sm text-gray-500 sm:text-base">
                            {{ project.description }}
                        </p>
                    </div>
                </component>
            </div>
        </div>
    </GenericLayout>
</template>
