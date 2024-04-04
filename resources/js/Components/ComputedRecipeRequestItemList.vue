<script setup lang="ts">

import { useRecipesStore } from "@/stores/recipes.js"
import ComputedRecipeRequestItem from "./ComputedRecipeRequestItem.vue";
import { RecipeRequest } from "@/types/recipe";

const { recipeRequests } = useRecipesStore();

defineEmits(["recipeRequestClick"])

const props = defineProps<{
    selectedRecipeRequest: RecipeRequest
}>()

const isSelected = (recipeRequest: RecipeRequest) => {
    return recipeRequest === props.selectedRecipeRequest
}

</script>


<template>
    <ul v-show="Object.keys(recipeRequests).length > 0">
        <ComputedRecipeRequestItem :class="{ 'bg-gray-200': isSelected(recipeRequest) }"
            v-for="recipeRequest of recipeRequests" :recipeRequest="recipeRequest"
            @click="(recipeRequest: RecipeRequest) => $emit('recipeRequestClick', recipeRequest)" />
    </ul>
</template>