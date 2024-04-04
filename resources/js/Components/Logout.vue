<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
const { logout } = useAuth0();

const login = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
}
</script>

<template>
    <div>
        <button @click="login">Log out</button>
    </div>
</template>