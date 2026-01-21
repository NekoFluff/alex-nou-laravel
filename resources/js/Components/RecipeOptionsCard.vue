<script setup lang="ts">
import RecipeOptions from './RecipeOptions.vue';
import Card from './Card.vue';
import { useRecipesStore } from '@/stores/recipes';
import ScrollLink from './ScrollLink.vue';
import { Recipe, RecipeRequest } from '@/types/recipe';

const recipesStore = useRecipesStore();

const props = defineProps<{
    recipeRequest: RecipeRequest;
    options: Recipe[];
}>();
</script>

<template>
    <Card>
        <template #header>
            <ScrollLink
                :targetId="options[0].name"
                :callback="
                    () => {
                        recipesStore.setSelectedRecipe(options[0].name);
                    }
                "
                class="flex items-center gap-2"
            >
                <img
                    v-if="
                        recipesStore.recipeMap[options[0].name] &&
                        recipesStore.recipeMap[options[0].name][0]
                    "
                    class="inline w-6 h-6"
                    :src="recipesStore.recipeMap[options[0].name][0].image"
                    :alt="options[0].name"
                />
                <span>{{ options[0].name }}</span>
            </ScrollLink>
        </template>

        <RecipeOptions :recipeRequest="props.recipeRequest" :options="options" />
    </Card>
</template>
