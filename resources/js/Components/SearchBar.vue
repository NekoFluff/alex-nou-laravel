<script setup lang="ts">
import { debounce } from "lodash";
import { computed, ref } from "vue"
import SearchResultList from "./SearchResultList.vue";


export type Option = {
    text: string;
    image: string | undefined;
};

const props = defineProps<{
    options: Option[]
}>();
const emit = defineEmits(["searchResultClick"])

let text = ref<string>("")

const handleUpdate = debounce((updatedText: string) => {
    text.value = updatedText
}, 500)

const filteredOptions = computed(() => {
    if (text.value === "") { return [] }

    return props.options.filter((option) => { return option.text.toLowerCase().includes(text.value.toLocaleLowerCase()) })
})

const handleSearchResultClicked = (result: string) => {
    text.value = ""
    emit('searchResultClick', result)
}

</script>

<template>
    <div data-cy="searchBar" class="mb-3">

        <input :value="text"
            class="w-full p-2 text-black bg-white rounded-md shadow-lg outline-none placeholder-slate-700 shadow-gray-900"
            type="text" placeholder="Search..." @input="handleUpdate(($event.target as HTMLInputElement).value)" />
        <SearchResultList class="w-full mt-0" :results="filteredOptions" @searchResultClick="handleSearchResultClicked" />
    </div>
</template>
