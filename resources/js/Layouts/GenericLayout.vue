<script setup lang="ts">
import { ref } from 'vue';
import ApplicationLogo from '@/Components/ApplicationLogo.vue';
import Dropdown from '@/Components/Dropdown.vue';
import DropdownLink from '@/Components/DropdownLink.vue';
import NavLink from '@/Components/NavLink.vue';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink.vue';
import { Link } from '@inertiajs/vue3';
import SocialMediaBar from '@/Components/SocialMediaBar.vue';
import PageViewTracker from '@/Components/PageViewTracker.vue';

const showingNavigationDropdown = ref(false);
</script>

<template>
    <div>
        <div class="min-h-screen bg-gray-100">
            <nav class="bg-white border-b border-gray-100">
                <!-- Primary Navigation Menu -->
                <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex">
                            <!-- Logo -->
                            <div class="flex items-center shrink-0">
                                <!-- <Link :href="route('dashboard')">
                                <ApplicationLogo class="block w-auto text-gray-800 fill-current h-9" />
                                </Link> -->
                            </div>

                            <!-- Navigation Links -->
                            <div class="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    :href="route('welcome')"
                                    :active="route().current('welcome')"
                                >
                                    Home
                                </NavLink>
                                <NavLink
                                    :href="route('projects')"
                                    :active="route().current('projects')"
                                >
                                    Projects
                                </NavLink>
                                <NavLink
                                    :href="route('wanikani')"
                                    :active="route().current('wanikani')"
                                >
                                    WaniKani
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Responsive Navigation Menu -->
                <div class="sm:hidden">
                    <div class="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink
                            :href="route('welcome')"
                            :active="route().current('welcome')"
                        >
                            Home
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            :href="route('projects')"
                            :active="route().current('projects')"
                        >
                            Projects
                        </ResponsiveNavLink>
                    </div>

                    <!-- Responsive Settings Options -->
                </div>
            </nav>

            <!-- Page Heading -->
            <header class="bg-white shadow" v-if="$slots.header">
                <div class="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <slot name="header" />
                </div>
            </header>

            <!-- Page Content -->
            <main>
                <slot />
            </main>

            <!-- Page Footer -->
            <footer class="sticky bottom-0 pb-3 mt-6 ml-10">
                <SocialMediaBar />
            </footer>
        </div>
    </div>
    <PageViewTracker />
</template>
