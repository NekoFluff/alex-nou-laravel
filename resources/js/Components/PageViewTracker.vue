<script setup lang="ts">

import axios from "axios";
import { ref } from "vue";

let count = ref(0)
let isLoading = ref(false)

const pageViewed = () => {
    if (isLoading.value) return
    isLoading.value = true

    axios.post(route('page-views.store'))
        .then(response => {
            count.value = response.data.count
        })
        .catch(error => {
            console.error(error)
        })

    isLoading.value = false
}

pageViewed()

</script>

<template>
    <div class="flex justify-center bg-gray-100">
        <div class="p-2 text-lg font-semibold transition-all duration-700 rounded-md"
            :class="{ 'text-transparent': isLoading, 'tracking-widest': !isLoading }">
            {{ `${count}`.padStart(10, '0') }}
        </div>
    </div>
</template>
