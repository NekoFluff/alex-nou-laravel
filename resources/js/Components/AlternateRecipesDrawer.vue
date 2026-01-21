<script setup lang="ts">
import RecipeOptionsCard from './RecipeOptionsCard.vue';
import { Recipe, RecipeRequest } from '@/types/recipe';

defineProps<{
    isOpen: boolean;
    recipeOptionsList: Recipe[][];
    selectedRecipeRequest?: RecipeRequest;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();
</script>

<template>
    <!-- Overlay -->
    <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        leave-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
        <div
            v-if="isOpen && recipeOptionsList && recipeOptionsList.length > 0"
            @click="emit('close')"
            class="fixed inset-0 z-40 bg-black bg-opacity-50"
        ></div>
    </Transition>

    <!-- Drawer -->
    <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
    >
        <div
            v-if="isOpen && recipeOptionsList && recipeOptionsList.length > 0"
            class="fixed top-0 right-0 z-50 h-full overflow-y-auto bg-white shadow-2xl w-96"
        >
            <div class="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900">Alternate Recipes</h2>
                <button
                    @click="emit('close')"
                    class="p-2 transition-colors rounded-lg hover:bg-slate-100"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="p-6 space-y-4">
                <div v-for="recipeOptions of recipeOptionsList" :key="recipeOptions[0].name">
                    <RecipeOptionsCard
                        :recipeRequest="selectedRecipeRequest"
                        :options="recipeOptions"
                    />
                </div>
            </div>
        </div>
    </Transition>
</template>
