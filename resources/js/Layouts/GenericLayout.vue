<script setup lang="ts">
import NavLink from '@/Components/NavLink.vue';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink.vue';
import SocialMediaBar from '@/Components/SocialMediaBar.vue';
import PageViewTracker from '@/Components/PageViewTracker.vue';
</script>

<template>
    <div>
        <div class="min-h-screen bg-gray-50">
            <nav class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" role="navigation" aria-label="Main navigation">
                <!-- Primary Navigation Menu -->
                <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div class="justify-between hidden h-16 sm:flex">
                        <div class="flex">
                            <!-- Logo -->
                            <div class="flex items-center shrink-0">
                                <!-- <Link :href="route('dashboard')">
                                <ApplicationLogo class="block w-auto text-gray-800 fill-current h-9" />
                                </Link> -->
                            </div>

                            <!-- Navigation Links -->
                            <div class="flex items-center h-16 space-x-1 sm:ms-10">
                                <NavLink
                                    :href="route('welcome')"
                                    :active="route().current('welcome')"
                                    aria-label="Go to home page"
                                >
                                    Home
                                </NavLink>
                                <NavLink
                                    :href="route('projects')"
                                    :active="route().current('projects')"
                                    aria-label="View projects"
                                >
                                    Projects
                                </NavLink>
                                <NavLink
                                    :href="route('wanikani')"
                                    :active="route().current('wanikani')"
                                    aria-label="View WaniKani dashboard"
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
                        <ResponsiveNavLink
                            :href="route('wanikani')"
                            :active="route().current('wanikani')"
                        >
                            WaniKani
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
