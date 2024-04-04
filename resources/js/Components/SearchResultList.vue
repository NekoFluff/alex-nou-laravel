<script setup lang="ts">
import SearchResult from "./SearchResult.vue";
import type { Option } from "./SearchBar.vue";

defineProps<{
    results: Option[];
}>();

defineEmits(['searchResultClick'])

</script>


<template>
    <div class="absolute z-10 bg-black" v-show="results.length > 0">
        <ul data-cy="searchResults">
            <SearchResult v-for="result of results" :text="result.text"
                @click="(text: string) => { $emit('searchResultClick', text) }">
                <template #icon>
                    <img v-if="result.image" class="inline w-6 h-6" :src="result.image" :alt="result.text" />
                </template>
            </SearchResult>
        </ul>
    </div>
</template>