<script setup lang="ts">
import { computed } from 'vue';
import ComputedRecipeGrid from './ComputedRecipeGrid.vue';
import Divider from './Divider.vue';
import { useRecipesStore } from '@/stores/recipes';
import { ComputedRecipe } from '@/types/recipe';
const recipesStore = useRecipesStore();

const props = defineProps<{
    computedRecipes: ComputedRecipe[];
    depthMode: boolean;
}>();

const depthSeparatedRecipes = computed(() => {
    const result: ComputedRecipe[][] = [];

    if (props.depthMode) {
        for (const recipe of props.computedRecipes) {
            const depth = recipe.depth || 0;
            if (result[depth] == undefined) {
                result[depth] = [];
            }
            result[depth].push(recipe);
        }
    }

    return result;
});

const facilityCounts = computed(() => {
    const result: { [key: string]: number } = {};

    for (const recipe of props.computedRecipes) {
        if (recipe.facility == undefined) {
            continue;
        }

        if (result[recipe.facility] == undefined) {
            result[recipe.facility] = 0;
        }
        result[recipe.facility] += recipe.num_facilities_needed || 0;
    }

    return result;
});
</script>

<template>
    <div v-if="computedRecipes.length > 0">
        <ComputedRecipeGrid
            v-if="!depthMode"
            :computedRecipes="computedRecipes"
        ></ComputedRecipeGrid>
        <div v-if="depthMode" class="mb-5">
            <div v-for="(recipes, index) in depthSeparatedRecipes">
                <ComputedRecipeGrid :computedRecipes="recipes"></ComputedRecipeGrid>
                <div v-if="index < depthSeparatedRecipes.length - 1">
                    <Divider class="my-6" />
                    <div class="absolute px-4 -translate-x-1/2 -translate-y-9 left-1/2">
                        <font-awesome-icon icon="fa-solid fa-arrow-up fa-3x" transform="grow-15" />
                    </div>
                </div>
            </div>
        </div>
        <div>
            <div class="text-lg font-bold">Total Facility Count</div>
            <ul>
                <li v-for="(count, facility) in facilityCounts">
                    <img
                        v-if="
                            recipesStore.recipeMap[facility] && recipesStore.recipeMap[facility][0]
                        "
                        class="inline w-5 h-5"
                        :src="recipesStore.recipeMap[facility][0].image"
                        :alt="facility.toString()"
                    />
                    {{ count }} {{ facility }}
                </li>
            </ul>
        </div>
        <div class="m-3">
            <div class="text-lg font-bold">JSON</div>
            <textarea class="w-full text-black h-96" readonly>{{
                JSON.stringify(computedRecipes, null, 4)
            }}</textarea>
        </div>
    </div>
</template>
