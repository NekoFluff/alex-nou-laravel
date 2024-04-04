<script setup lang="ts">
import Login from './Login.vue';
import Logout from './Logout.vue';
import { useAuth0 } from '@auth0/auth0-vue';

const { user, isAuthenticated } = useAuth0();

</script>

<template>
    <div class="flex text-green-500">
        <nav class="py-2 mb-5 space-x-5 ">
            <RouterLink class="p-2" to="/">Home</RouterLink>
            <RouterLink class="p-2" to="/projects">Projects</RouterLink>
        </nav>
        <div class="flex-grow"></div>

        <!-- <Logout v-if="user && isAuthenticated" />
            <Login v-else /> -->
    </div>
</template>