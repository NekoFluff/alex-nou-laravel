<script setup lang="ts">

import { useRecipesStore } from "@/stores/recipes.js"
import type { GetDSPComputedRecipeRequestInner } from "alex-api-typescript-client/api";
import ComputedRecipeRequestItem from "./ComputedRecipeRequestItem.vue";

const { recipeRequests } = useRecipesStore();

defineEmits(["recipeRequestClick"])

const props = defineProps<{
    selectedRecipeRequest: GetDSPComputedRecipeRequestInner
}>()

const isSelected = (recipeRequest: GetDSPComputedRecipeRequestInner) => {
    return recipeRequest === props.selectedRecipeRequest
}

</script>


<template>
    <ul v-show="Object.keys(recipeRequests).length > 0">
        <ComputedRecipeRequestItem :class="{ 'bg-zinc-800': isSelected(recipeRequest) }"
            v-for="recipeRequest of recipeRequests" :recipeRequest="recipeRequest"
            @click="(recipeRequest: GetDSPComputedRecipeRequestInner) => $emit('recipeRequestClick', recipeRequest)" />
    </ul>
</template>