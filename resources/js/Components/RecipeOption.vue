<script setup lang="ts">
import { useRecipesStore } from '@/stores/recipes';
import { Recipe, RecipeRequest } from '@/types/recipe';
import { ref, watch } from 'vue';

const recipesStore = useRecipesStore();
const props = defineProps<{
    recipeRequest: RecipeRequest;
    recipeOption: Recipe;
    index: number;
}>();

const handleAddRequirement = (index: number) => {
    recipesStore.addRequestRequirement(props.recipeRequest, props.recipeOption.name, index);
};

const calculateIsSelected = () => {
    const requirements = props.recipeRequest.requirements;
    if (requirements) {
        const selectedIdx = requirements[props.recipeOption.name];
        return selectedIdx === props.index || (selectedIdx === undefined && props.index == 0);
    }
    return false;
};

let isSelected = ref<boolean>(calculateIsSelected());

watch(
    () => {
        if (props.recipeRequest.requirements) {
            return props.recipeRequest.requirements[props.recipeOption.name];
        } else {
            return false;
        }
    },
    () => {
        isSelected.value = calculateIsSelected();
    }
);
</script>

<template>
    <button
        class="w-full p-2 mt-2 mb-2 text-sm rounded-md hover:bg-gray-200"
        :class="{ 'bg-gray-200': isSelected }"
        @click="
            () => {
                handleAddRequirement(index);
            }
        "
    >
        <slot name="icons">
            <i class="text-xs" v-for="(amount, materialName) in recipeOption.ingredients">
                {{ materialName }} x{{ amount }} |
            </i>
        </slot>
        at {{ recipeOption.facility }}
    </button>
</template>
