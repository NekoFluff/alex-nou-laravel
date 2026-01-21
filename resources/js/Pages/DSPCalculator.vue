<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import GenericLayout from '@/Layouts/GenericLayout.vue';

// import TheWelcome from "../components/TheWelcome.vue";
import ComputedRecipeRequestList from '@/Components/ComputedRecipeRequestItemList.vue';
import SearchBar from '@/Components/SearchBar.vue';

import { useRecipesStore } from '@/stores/recipes';
import ComputedRecipeOutput from '@/Components/ComputedRecipeOutput.vue';
import { ref } from 'vue';
import AlternateRecipesDrawer from '@/Components/AlternateRecipesDrawer.vue';
import Section from '@/Components/Section.vue';
import { includes } from 'lodash';
import { ComputedRecipe, Recipe, RecipeRequest } from '@/types/recipe';
import axios from 'axios';

const recipesStore = useRecipesStore();

const depthModeEnabled = ref<boolean>(true);
const selectedRecipeRequest = ref<RecipeRequest>();
const computedRecipes = ref<ComputedRecipe[]>([]);
const recipeOptionsList = ref<Recipe[][]>([]);
const isDrawerOpen = ref<boolean>(false);

const handleRecipeRequestClicked = (recipeRequest: RecipeRequest) => {
    selectedRecipeRequest.value = recipeRequest;
    fetchData();
};

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
        <div class="py-8">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="mb-6 text-center">
                    <h1 class="text-3xl font-semibold text-slate-900">
                        DSP Production Calculator
                    </h1>
                </div>

                <div class="flex flex-col mx-6 space-y-6">
                    <div>
                        <SearchBar :options="recipesStore.recipes
                                .map((recipeList) => {
                                    return {
                                        text: recipeList[0].name,
                                        image: recipeList[0].image,
                                    };
                                })
                                .sort()
                            " @searchResultClick="handleSearchResultClicked" />
                    </div>

                    <Section header="Configuration" v-if="Object.keys(recipesStore.recipeRequests).length > 0">
                        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div class="space-y-3">
                                <h3 class="text-sm font-medium text-slate-700">Display Options</h3>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" v-model="recipesStore.groupRecipes"
                                        class="w-4 h-4 rounded" />
                                    <span class="text-sm text-slate-700">Group Recipes</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" v-model="depthModeEnabled" class="w-4 h-4 rounded" />
                                    <span class="text-sm text-slate-700">Sort by Depth</span>
                                </label>
                            </div>

                            <div class="space-y-3">
                                <h3 class="text-sm font-medium text-slate-700">Assembling Machine</h3>
                                <div class="flex gap-2">
                                    <button @click="setAssemblerLevel(1)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.assemblerLevel === 1,
                                        'bg-white border-slate-300':
                                            recipesStore.assemblerLevel !== 1,
                                    }" title="Assembling Machine Mk.I">
                                        <img class="w-8 h-8"
                                            :src="recipesStore.recipeMap['Assembling Machine Mk.I'][0].image"
                                            :alt="recipesStore.recipeMap['Assembling Machine Mk.I'][0].name" />
                                    </button>
                                    <button @click="setAssemblerLevel(2)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.assemblerLevel === 2,
                                        'bg-white border-slate-300':
                                            recipesStore.assemblerLevel !== 2,
                                    }" title="Assembling Machine Mk.II">
                                        <img class="w-8 h-8"
                                            :src="recipesStore.recipeMap['Assembling Machine Mk.II'][0].image"
                                            :alt="recipesStore.recipeMap['Assembling Machine Mk.II'][0].name" />
                                    </button>
                                    <button @click="setAssemblerLevel(3)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.assemblerLevel === 3,
                                        'bg-white border-slate-300':
                                            recipesStore.assemblerLevel !== 3,
                                    }" title="Assembling Machine Mk.III">
                                        <img class="w-8 h-8"
                                            :src="recipesStore.recipeMap['Assembling Machine Mk.III'][0].image"
                                            :alt="recipesStore.recipeMap['Assembling Machine Mk.III'][0].name" />
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-3">
                                <h3 class="text-sm font-medium text-slate-700">Smelter</h3>
                                <div class="flex gap-2">
                                    <button @click="setSmelterLevel(1)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.smelterLevel === 1,
                                        'bg-white border-slate-300':
                                            recipesStore.smelterLevel !== 1,
                                    }" title="Arc Smelter">
                                        <img class="w-8 h-8" :src="recipesStore.recipeMap['Arc Smelter'][0].image"
                                            :alt="recipesStore.recipeMap['Arc Smelter'][0].name" />
                                    </button>
                                    <button @click="setSmelterLevel(2)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.smelterLevel === 2,
                                        'bg-white border-slate-300':
                                            recipesStore.smelterLevel !== 2,
                                    }" title="Plane Smelter">
                                        <img class="w-8 h-8" :src="recipesStore.recipeMap['Plane Smelter'][0].image"
                                            :alt="recipesStore.recipeMap['Plane Smelter'][0].name" />
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-3">
                                <h3 class="text-sm font-medium text-slate-700">Chemical Plant</h3>
                                <div class="flex gap-2">
                                    <button @click="setChemicalPlantLevel(1)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.chemicalPlantLevel === 1,
                                        'bg-white border-slate-300':
                                            recipesStore.chemicalPlantLevel !== 1,
                                    }" title="Chemical Plant">
                                        <img class="w-8 h-8" :src="recipesStore.recipeMap['Chemical Plant'][0].image"
                                            :alt="recipesStore.recipeMap['Chemical Plant'][0].name" />
                                    </button>
                                    <button @click="setChemicalPlantLevel(2)" class="p-2 border rounded" :class="{
                                        'bg-blue-500 border-blue-500':
                                            recipesStore.chemicalPlantLevel === 2,
                                        'bg-white border-slate-300':
                                            recipesStore.chemicalPlantLevel !== 2,
                                    }" title="Quantum Chemical Plant">
                                        <img class="w-8 h-8"
                                            :src="recipesStore.recipeMap['Quantum Chemical Plant'][0].image"
                                            :alt="recipesStore.recipeMap['Quantum Chemical Plant'][0].name" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section v-if="selectedRecipeRequest != undefined" header="Production Target" class="flex-initial">
                        <ComputedRecipeRequestList :selectedRecipeRequest="selectedRecipeRequest"
                            @recipeRequestClick="handleRecipeRequestClicked" />
                    </Section>

                    <div v-if="selectedRecipeRequest != undefined">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-slate-900">Required Resources</h2>
                            <button v-if="recipeOptionsList && recipeOptionsList.length > 0"
                                @click="isDrawerOpen = !isDrawerOpen"
                                class="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-slate-700 hover:bg-slate-800">
                                {{ isDrawerOpen ? 'Hide' : 'Show' }} Alternate Recipes ({{ recipeOptionsList.length }})
                            </button>
                        </div>
                        <ComputedRecipeOutput :depthMode="depthModeEnabled" :computedRecipes="computedRecipes" />
                    </div>
                </div>
            </div>
        </div>
        <AlternateRecipesDrawer :isOpen="isDrawerOpen" :recipeOptionsList="recipeOptionsList"
            :selectedRecipeRequest="selectedRecipeRequest" @close="isDrawerOpen = false" />
    </GenericLayout>
</template>
