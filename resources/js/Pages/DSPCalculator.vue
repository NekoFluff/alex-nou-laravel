<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import GenericLayout from '@/Layouts/GenericLayout.vue';

// import TheWelcome from "../components/TheWelcome.vue";
import ComputedRecipeRequestList from '@/Components/ComputedRecipeRequestItemList.vue';
import SearchBar from '@/Components/SearchBar.vue';

import { useRecipesStore } from '@/stores/recipes';
import ComputedRecipeOutput from '@/Components/ComputedRecipeOutput.vue';
import { ref } from 'vue';
import RecipeOptionsCard from '@/Components/RecipeOptionsCard.vue';
import Section from '@/Components/Section.vue';
import { includes } from 'lodash';
import { ComputedRecipe, Recipe, RecipeRequest } from '@/types/recipe';
import axios from 'axios';

const recipesStore = useRecipesStore();

const depthModeEnabled = ref<boolean>(true);
const selectedRecipeRequest = ref<RecipeRequest>();
const computedRecipes = ref<ComputedRecipe[]>([]);
const recipeOptionsList = ref<Recipe[][]>([]);

const handleRecipeRequestClicked = (recipeRequest: RecipeRequest) => {
    selectedRecipeRequest.value = recipeRequest;
    fetchData();
};

// const api = new DysonSphereProgramApi()
// api.getDSPRecipes()
//     .then((resp) => {
//         recipesStore.setRecipes(resp.data)
//     })
//     .catch((ex) => {
//         console.log('An error occurred', ex)
//     })

axios
    .get('/api/dsp/recipes')
    .then((resp) => {
        recipesStore.setRecipes(resp.data);
    })
    .catch((ex) => {
        console.log('An error occurred', ex);
    });

const handleSearchResultClicked = (recipeName: string) => {
    recipesStore.addRequest({
        name: recipeName,
        quantity_per_second: 1,
        requirements: {},
    });
};

const setAssemblerLevel = (level: 1 | 2 | 3) => {
    recipesStore.assemblerLevel = level;
};

const setChemicalPlantLevel = (level: 1 | 2) => {
    recipesStore.chemicalPlantLevel = level;
};

const setSmelterLevel = (level: 1 | 2) => {
    recipesStore.smelterLevel = level;
};

const fetchData = async () => {
    if (selectedRecipeRequest.value == undefined) return;
    if (selectedRecipeRequest.value.quantity_per_second <= 0) return;

    const resp = await axios.post('/api/dsp/recipes/compute', selectedRecipeRequest.value, {
        params: {
            assemblerLevel: recipesStore.assemblerLevel,
            chemicalPlantLevel: recipesStore.chemicalPlantLevel,
            smelterLevel: recipesStore.smelterLevel,
            group: recipesStore.groupRecipes,
        },
    });

    computedRecipes.value = resp.data;
    recipeOptionsList.value = recipesStore.getRecipesWithOptions(resp.data);
};

recipesStore.$subscribe(async () => {
    const recipeRequests = Object.keys(recipesStore.recipeRequests);
    if (!includes(recipeRequests, selectedRecipeRequest.value?.name)) {
        if (recipeRequests.length > 0) {
            const recipeRequest = recipesStore.recipeRequests[recipeRequests[0]];
            selectedRecipeRequest.value = recipeRequest;
        } else {
            selectedRecipeRequest.value = undefined;
        }
    }

    await fetchData();
});
</script>

<template>
    <Head title="DSP Calculator" />
    <GenericLayout>
        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="flex flex-col">
                    <SearchBar
                        :options="
                            recipesStore.recipes
                                .map((recipeList) => {
                                    return {
                                        text: recipeList[0].name,
                                        image: recipeList[0].image,
                                    };
                                })
                                .sort()
                        "
                        @searchResultClick="handleSearchResultClicked"
                    />
                    <Section
                        header="Options:"
                        v-if="Object.keys(recipesStore.recipeRequests).length > 0"
                    >
                        <div class="mb-3 ml-4 text-sm">
                            Group Recipes:
                            <input
                                class="ml-1"
                                type="checkbox"
                                v-model="recipesStore.groupRecipes"
                            />
                        </div>
                        <div class="mb-3 ml-4 text-sm">
                            Sort by Depth:
                            <input class="ml-1" type="checkbox" v-model="depthModeEnabled" />
                        </div>
                        <div class="mb-3 ml-4 text-sm">
                            Default Assembling Machine:
                            <button
                                @click="setAssemblerLevel(1)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.assemblerLevel === 1,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="
                                        recipesStore.recipeMap['Assembling Machine Mk.I'][0].image
                                    "
                                    :alt="recipesStore.recipeMap['Assembling Machine Mk.I'][0].name"
                                />
                            </button>
                            <button
                                @click="setAssemblerLevel(2)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.assemblerLevel === 2,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="
                                        recipesStore.recipeMap['Assembling Machine Mk.II'][0].image
                                    "
                                    :alt="
                                        recipesStore.recipeMap['Assembling Machine Mk.II'][0].name
                                    "
                                />
                            </button>
                            <button
                                @click="setAssemblerLevel(3)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.assemblerLevel === 3,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="
                                        recipesStore.recipeMap['Assembling Machine Mk.III'][0].image
                                    "
                                    :alt="
                                        recipesStore.recipeMap['Assembling Machine Mk.III'][0].name
                                    "
                                />
                            </button>
                        </div>
                        <div class="mb-3 ml-4 text-sm">
                            Default Smelter:
                            <button
                                @click="setSmelterLevel(1)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.smelterLevel === 1,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="recipesStore.recipeMap['Arc Smelter'][0].image"
                                    :alt="recipesStore.recipeMap['Arc Smelter'][0].name"
                                />
                            </button>
                            <button
                                @click="setSmelterLevel(2)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.smelterLevel === 2,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="recipesStore.recipeMap['Plane Smelter'][0].image"
                                    :alt="recipesStore.recipeMap['Plane Smelter'][0].name"
                                />
                            </button>
                        </div>
                        <div class="mb-3 ml-4 text-sm">
                            Default Chemical Plant:
                            <button
                                @click="setChemicalPlantLevel(1)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.chemicalPlantLevel === 1,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="recipesStore.recipeMap['Chemical Plant'][0].image"
                                    :alt="recipesStore.recipeMap['Chemical Plant'][0].name"
                                />
                            </button>
                            <button
                                @click="setChemicalPlantLevel(2)"
                                class="p-1"
                                :class="{
                                    'rounded-md bg-gray-200 border border-white':
                                        recipesStore.chemicalPlantLevel === 2,
                                }"
                            >
                                <img
                                    class="inline w-6 h-6"
                                    :src="recipesStore.recipeMap['Quantum Chemical Plant'][0].image"
                                    :alt="recipesStore.recipeMap['Quantum Chemical Plant'][0].name"
                                />
                            </button>
                        </div>
                    </Section>
                    <div v-if="selectedRecipeRequest != undefined" class="flex justify-between">
                        <Section header="Want" class="flex-initial w-5/12 max-w-xs">
                            <ComputedRecipeRequestList
                                :selectedRecipeRequest="selectedRecipeRequest"
                                @recipeRequestClick="handleRecipeRequestClicked"
                            />
                        </Section>
                        <Section header="Need" class="flex-initial w-full mx-3">
                            <ComputedRecipeOutput
                                :depthMode="depthModeEnabled"
                                :computedRecipes="computedRecipes"
                            />
                        </Section>
                        <Section
                            v-if="recipeOptionsList && recipeOptionsList.length > 0"
                            header="Alternate Recipes"
                            class="flex-initial w-5/12 max-w-xs"
                        >
                            <div v-for="recipeOptions of recipeOptionsList">
                                <RecipeOptionsCard
                                    :recipeRequest="selectedRecipeRequest"
                                    :options="recipeOptions"
                                />
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    </GenericLayout>
</template>
