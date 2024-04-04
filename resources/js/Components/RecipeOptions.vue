<script setup lang="ts">
import { Recipe, RecipeRequest } from "@/types/recipe";
import RecipeOption from "./RecipeOption.vue";

import { useRecipesStore } from "@/stores/recipes";

const recipesStore = useRecipesStore();

defineProps<{
    recipeRequest: RecipeRequest
    options: Recipe[]
}>();

</script>

<template>
    <RecipeOption v-for="(recipe, index) in options" :recipeRequest="recipeRequest" :recipeOption="recipe" :index="index">
        <template #icons>
            <div class="flex">
                <div class="ml-2 mr-2" v-for="(amount, material) in recipe.ingredients">
                    <div
                        v-if="recipesStore.recipeMap[material] && recipesStore.recipeMap[material][0] && recipesStore.recipeMap[material][0].image">
                        <img class="inline w-8 h-8" :src="recipesStore.recipeMap[material][0].image"
                            :alt="options[0].name" />
                        <p class="absolute bottom-0 font-extrabold left-8">{{ amount }}</p>
                    </div>
                    <p v-else>{{ material }} x{{ amount }} |</p>
                </div>
            </div>
        </template>
    </RecipeOption>
</template>
