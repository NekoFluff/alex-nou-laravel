<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGithub, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
</script>

<template>
    <div class="p-4 bg-white rounded-lg shadow-md w-min">
        <nav class="flex space-x-10">
            <a href="https://twitter.com/SheavinNou" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon :icon="faXTwitter" size="lg" />
            </a>
            <a
                href="https://www.linkedin.com/in/alex-nou-271323138/"
                target="_blank"
                rel="noopener noreferrer"
            >
                <FontAwesomeIcon :icon="faLinkedin" size="lg" />
            </a>
            <a href="https://github.com/NekoFluff" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon :icon="faGithub" size="lg" />
            </a>
        </nav>
    </div>
</template>
