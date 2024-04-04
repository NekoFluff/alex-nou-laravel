<script setup lang="ts">
import RecipeOptions from "./RecipeOptions.vue";
import Card from "./Card.vue";
import { useRecipesStore } from "@/stores/recipes";
import ScrollLink from "./ScrollLink.vue";
import type { GetDSPComputedRecipeRequestInner, Recipe } from "alex-api-typescript-client/api";

const recipesStore = useRecipesStore();

const props = defineProps<{
    recipeRequest: GetDSPComputedRecipeRequestInner;
    options: Recipe[];
}>();
</script>

<template>
    <Card>
        <template #header>

            <div class="flex-1 font-bold">
                <ScrollLink :targetId="(options[0].name)"
                    :callback="() => { recipesStore.setSelectedRecipe(options[0].name); }">
                    <img v-if="recipesStore.recipeMap[options[0].name] && recipesStore.recipeMap[options[0].name][0]"
                        class="inline w-5 h-5" :src="recipesStore.recipeMap[options[0].name][0].image"
                        :alt="options[0].name" />
                    {{ options[0].name }}
                </ScrollLink>
            </div>
        </template>

        <RecipeOptions :recipeRequest="props.recipeRequest" :options="options" />
    </Card>
</template>
