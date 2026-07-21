<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { socialLinks } from '@/socialLinks';
</script>

<template>
    <div class="p-4 bg-white rounded-lg shadow-md w-min">
        <nav class="flex space-x-10">
            <a
                v-for="social in socialLinks"
                :key="social.name"
                :href="social.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="social.name"
            >
                <FontAwesomeIcon :icon="social.icon" size="lg" />
            </a>
        </nav>
    </div>
</template>
