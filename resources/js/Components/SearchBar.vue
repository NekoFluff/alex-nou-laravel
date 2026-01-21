<script setup lang="ts">
import { debounce } from 'lodash';
import { computed, ref } from 'vue';
import SearchResultList from './SearchResultList.vue';

export type Option = {
    text: string;
    image: string | undefined;
};

const props = defineProps<{
    options: Option[];
}>();
const emit = defineEmits(['searchResultClick']);

let text = ref<string>('');

const handleUpdate = debounce((updatedText: string) => {
    text.value = updatedText;
}, 500);

const filteredOptions = computed(() => {
    if (text.value === '') {
        return [];
    }

    return props.options.filter((option) => {
        return option.text.toLowerCase().includes(text.value.toLocaleLowerCase());
    });
});

const handleSearchResultClicked = (result: string) => {
    text.value = '';
    emit('searchResultClick', result);
};
</script>

<template>
    <div class="relative mb-3">
        <input
            :value="text"
            class="w-full px-4 py-3 bg-white border border-slate-300 rounded outline-none text-slate-900 placeholder-slate-400 focus:border-slate-900"
            type="text"
            placeholder="Search for a recipe..."
            @input="handleUpdate(($event.target as HTMLInputElement).value)"
        />
        <SearchResultList
            class="absolute z-10 w-full mt-1 overflow-hidden rounded"
            :results="filteredOptions"
            @searchResultClick="handleSearchResultClicked"
        />
    </div>
</template>
