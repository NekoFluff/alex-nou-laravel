<script setup lang="ts">
import { Head } from '@inertiajs/vue3';

import Card from '@/Components/Card.vue';
import GenericLayout from '@/Layouts/GenericLayout.vue';
</script>

<template>
    <Head title="Alex Nou" />
    <GenericLayout>
        <div class="py-6 sm:py-12">
            <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <section
                    class="relative mb-8 overflow-hidden bg-white border border-gray-200 shadow-lg sm:mb-16 rounded-2xl sm:rounded-3xl"
                    aria-label="Introduction"
                >
                    <div
                        class="absolute inset-0 opacity-[0.03]"
                        style="
                            background-image: radial-gradient(
                                circle at 2px 2px,
                                rgb(0 0 0) 1px,
                                transparent 0
                            );
                            background-size: 32px 32px;
                        "
                        aria-hidden="true"
                    ></div>

                    <div class="relative px-6 py-12 text-center sm:px-8 sm:py-20 lg:py-32">
                        <h1
                            class="mb-3 text-3xl font-bold text-gray-900 sm:mb-4 sm:text-5xl md:text-6xl lg:text-7xl"
                        >
                            <span class="inline-block animate-fade-in">Hello</span>
                        </h1>
                        <p
                            class="text-xl font-light text-gray-700 sm:text-2xl md:text-3xl lg:text-4xl"
                        >
                            I'm <span class="font-bold text-gray-900">Alex Nou</span>
                        </p>
                        <p class="mt-4 text-base text-gray-600 sm:mt-6 sm:text-lg lg:text-xl">
                            Software Engineer • Code Enthusiast • Problem Solver
                        </p>
                    </div>
                </section>

                <!-- Cards Grid -->
                <div class="grid gap-4 sm:gap-6 md:grid-cols-2">
                    <Card>
                        <template #header>
                            <h2 class="text-xl font-bold text-gray-800 sm:text-2xl">About Me</h2>
                        </template>
                        <div class="space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
                            <p>
                                Software Engineer at
                                <span class="font-medium text-gray-900">BackgroundChecks.com</span>,
                                passionate about building scalable and maintainable systems.
                            </p>
                            <p>
                                Graduated from
                                <span class="font-medium text-gray-900"
                                    >Arizona State University</span
                                >
                                with a 4.0 GPA and the Moeur Award for academic excellence.
                            </p>
                            <p>
                                Loves working with Laravel, Docker, and exploring new technologies to solve complex problems.
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <template #header>
                            <h2 class="text-xl font-bold text-gray-800 sm:text-2xl">
                                Technical Skills
                            </h2>
                        </template>
                        <div class="space-y-4">
                            <div>
                                <div class="mb-2 text-sm font-semibold text-gray-900 sm:text-base">
                                    Languages
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200 rounded-md bg-purple-50 sm:text-sm"
                                        >PHP (Love Laravel)</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-yellow-700 border border-yellow-200 rounded-md bg-yellow-50 sm:text-sm"
                                        >Javascript/TypeScript (Love Vue.js)</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md bg-blue-50 sm:text-sm"
                                        >Go</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md bg-gray-50 sm:text-sm"
                                        >Python</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md bg-gray-50 sm:text-sm"
                                        >Swift</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md bg-gray-50 sm:text-sm"
                                        >Java</span
                                    >
                                </div>
                            </div>
                            <div>
                                <div class="mb-2 text-sm font-semibold text-gray-900 sm:text-base">
                                    Infrastructure & DevOps
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md bg-blue-50 sm:text-sm"
                                        >Docker</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md bg-blue-50 sm:text-sm"
                                        >Helm</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md bg-blue-50 sm:text-sm"
                                        >Argo CD</span
                                    >
                                </div>
                            </div>
                            <div>
                                <div class="mb-2 text-sm font-semibold text-gray-900 sm:text-base">
                                    Data & Databases
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md bg-green-50 sm:text-sm"
                                        >PostgreSQL</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md bg-green-50 sm:text-sm"
                                        >MySQL</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-green-700 border border-green-200 rounded-md bg-green-50 sm:text-sm"
                                        >MongoDB</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200 rounded-md bg-orange-50 sm:text-sm"
                                        >TensorFlow</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200 rounded-md bg-orange-50 sm:text-sm"
                                        >Pandas</span
                                    >
                                    <span
                                        class="px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200 rounded-md bg-orange-50 sm:text-sm"
                                        >Keras</span
                                    >
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card class="md:col-span-2">
                        <template #header>
                            <h2 class="text-xl font-bold text-gray-800 sm:text-2xl">Interests</h2>
                        </template>
                        <div class="space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
                            <p>
                                <span class="font-medium text-gray-900">Favorite Games:</span> Factorio, Dyson Sphere Program, CIV 6, Dark Souls, Hollow Knight, and
                                Monster Hunter.
                            </p>
                            <p>
                                <span class="font-medium text-gray-900">Japanese Culture:</span>
                                Learning Japanese using in-person courses and WaniKani. Favorite anime include KonoSuba, Sangatsu no Lion, Wotakoi and too many more.
                            </p>
                            <p>
                                <span class="font-medium text-gray-900"
                                    >Machine Learning Enthusiast:</span
                                >
                                Exploring neural networks and computer vision applications, with a
                                focus on convolutional neural networks.
                            </p>
                        </div>
                    </Card>
                </div>

                <!-- Contact Section -->
                <div class="mt-8 sm:mt-12">
                    <Card>
                        <template #header>
                            <h2 class="text-xl font-bold text-center text-gray-800 sm:text-2xl">
                                Feel Free to Reach Out
                            </h2>
                        </template>
                        <div class="text-center">
                            <div class="flex flex-wrap justify-center gap-3">
                                <a
                                    href="https://github.com/alexnou"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 bg-gray-900 rounded-lg shadow-md hover:bg-gray-800 hover:shadow-lg sm:text-base"
                                >
                                    <svg
                                        class="w-5 h-5 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                        />
                                    </svg>
                                    GitHub
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/alexnou"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg sm:text-base"
                                >
                                    <svg
                                        class="w-5 h-5 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                        />
                                    </svg>
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    </GenericLayout>
</template>
