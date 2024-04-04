<script setup lang="ts">
import { useRecipesStore } from "@/stores/recipes.js"
import { ref } from "vue"
import { debounce } from "lodash";
import { RecipeRequest } from "@/types/recipe";

const recipesStore = useRecipesStore()
const props = defineProps<{
    recipeRequest: RecipeRequest;
}>();

defineEmits(["click"])

const rate = ref(props.recipeRequest.quantity_per_second);

const handleDelete = () => {
    recipesStore.removeRequest(props.recipeRequest)
}

const handleInput = debounce((value: string) => {
    rate.value = Number(value)
    props.recipeRequest.quantity_per_second = Number(value)
    recipesStore.addRequest(props.recipeRequest)
}, 500)

</script>

<template>
    <li class="flex flex-row p-3 mb-2  bg-black rounded-md hover:bg-zinc-800">
        <button class="flex flex-row items-center w-full" @click="$emit('click', recipeRequest)">

            <img v-if="recipesStore.recipeMap[props.recipeRequest.name][0].image" class="inline w-6 h-6"
                :src="recipesStore.recipeMap[props.recipeRequest.name][0].image" :alt="props.recipeRequest.name" />
            <div class="flex-1 ml-2 mr-2 text-sm text-left ">
                {{ recipeRequest.name }}
            </div>

            <input class="text-black flex-initial w-6 rounded-md text-right px-0.5 outline-none" type="number" step="1"
                placeholder="1.0" :value="rate" @input="handleInput(($event.target as HTMLInputElement).value)" /> <span
                class="ml-0.5">/s</span>
            <button class="flex-initial ml-2 text-center rounded-md" @click="handleDelete">
                <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
        </button>
    </li>
</template>
