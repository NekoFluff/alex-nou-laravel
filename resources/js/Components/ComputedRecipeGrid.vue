<script setup lang="ts">
import { ComputedRecipe } from "@/types/recipe";
import ComputedRecipeCard from "./ComputedRecipeCard.vue";

defineProps<{
    computedRecipes: ComputedRecipe[];
}>();

</script>

<template>
    <div class="grid md:grid-cols-1 lg:grid-cols-3">
        <ComputedRecipeCard v-for="computedRecipe in computedRecipes" :computedRecipe="computedRecipe" />
    </div>
</template>
