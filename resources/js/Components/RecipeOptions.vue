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
                <div class="ml-2 mr-2" v-for="ingredient in recipe.ingredients">
                    <div
                        v-if="recipesStore.recipeMap[ingredient.name] && recipesStore.recipeMap[ingredient.name][0] && recipesStore.recipeMap[ingredient.name][0].image">
                        <img class="inline w-8 h-8" :src="recipesStore.recipeMap[ingredient.name][0].image"
                            :alt="options[0].name" />
                        <p class="relative bottom-0 font-extrabold">{{ ingredient.quantity }}</p>
                    </div>
                    <p v-else>{{ ingredient.name }} x{{ ingredient.quantity }} |</p>
                </div>
            </div>
        </template>
    </RecipeOption>
</template>
