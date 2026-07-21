<script setup lang="ts">
import { ref, watch } from 'vue';
import { Link } from '@inertiajs/vue3';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import SocialMediaBar from '@/Components/SocialMediaBar.vue';
import PageViewTracker from '@/Components/PageViewTracker.vue';
import { socialLinks } from '@/socialLinks';

const navItems = [
    { name: 'Home', route: 'welcome' },
    { name: 'Projects', route: 'projects' },
    { name: 'WaniKani', route: 'wanikani' },
];

const isActive = (routeName: string) => route().current(routeName);

const mobileMenuOpen = ref(false);

watch(mobileMenuOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : '';
});
</script>

<template>
    <div>
        <div class="min-h-screen bg-gray-50">
            <header class="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
                <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <!-- Logo / Wordmark -->
                        <Link
                            :href="route('welcome')"
                            class="flex items-center gap-2.5 shrink-0 group"
                            aria-label="Go to home page"
                        >
                            <span
                                class="flex items-center justify-center text-sm font-bold text-white transition-transform bg-gray-900 rounded-xl h-9 w-9 group-hover:scale-105"
                            >
                                AN
                            </span>
                            <span class="hidden text-base font-semibold tracking-tight text-gray-900 sm:block">
                                Alex Nou
                            </span>
                        </Link>

                        <!-- Desktop nav -->
                        <nav
                            class="items-center hidden gap-1 p-1 bg-gray-100 rounded-full sm:flex"
                            aria-label="Primary"
                        >
                            <Link
                                v-for="item in navItems"
                                :key="item.route"
                                :href="route(item.route)"
                                :class="[
                                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150',
                                    isActive(item.route)
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900',
                                ]"
                            >
                                {{ item.name }}
                            </Link>
                        </nav>

                        <!-- Desktop socials -->
                        <div class="items-center hidden gap-4 sm:flex">
                            <a
                                v-for="social in socialLinks"
                                :key="social.name"
                                :href="social.href"
                                target="_blank"
                                rel="noopener noreferrer"
                                :aria-label="social.name"
                                class="text-gray-400 transition-colors hover:text-gray-900"
                            >
                                <FontAwesomeIcon :icon="social.icon" size="lg" />
                            </a>
                        </div>

                        <!-- Mobile hamburger -->
                        <button
                            type="button"
                            @click="mobileMenuOpen = !mobileMenuOpen"
                            class="inline-flex items-center justify-center text-gray-500 transition-colors rounded-lg sm:hidden h-9 w-9 hover:bg-gray-100 hover:text-gray-900"
                            :aria-expanded="mobileMenuOpen"
                            aria-controls="mobile-menu"
                            aria-label="Toggle navigation menu"
                        >
                            <FontAwesomeIcon :icon="mobileMenuOpen ? faXmark : faBars" size="lg" />
                        </button>
                    </div>
                </div>

                <!-- Mobile menu -->
                <Transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="-translate-y-2 opacity-0"
                    enter-to-class="translate-y-0 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="translate-y-0 opacity-100"
                    leave-to-class="-translate-y-2 opacity-0"
                >
                    <div
                        v-if="mobileMenuOpen"
                        id="mobile-menu"
                        class="border-t border-gray-200 sm:hidden bg-white/95 backdrop-blur-md"
                    >
                        <nav class="px-4 pt-3 pb-4 space-y-1" aria-label="Mobile">
                            <Link
                                v-for="item in navItems"
                                :key="item.route"
                                :href="route(item.route)"
                                @click="mobileMenuOpen = false"
                                :class="[
                                    'block rounded-xl px-4 py-2.5 text-base font-medium transition-colors',
                                    isActive(item.route)
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                ]"
                            >
                                {{ item.name }}
                            </Link>
                        </nav>
                    </div>
                </Transition>
            </header>

            <!-- Page Heading -->
            <div class="bg-white shadow" v-if="$slots.header">
                <div class="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <slot name="header" />
                </div>
            </div>

            <!-- Page Content -->
            <main>
                <slot />
            </main>

            <!-- Page Footer -->
            <footer class="pb-6 mt-12 border-t border-gray-200 sm:mt-16" role="contentinfo">
                <div class="flex justify-center pt-6">
                    <SocialMediaBar />
                </div>
                <div class="mt-4 text-center">
                    <p class="text-sm text-gray-600">
                        © {{ new Date().getFullYear() }} Alex Nou. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    </div>
    <PageViewTracker />
</template>
