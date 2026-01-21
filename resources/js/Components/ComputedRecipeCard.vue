<script setup lang="ts">
import { useRecipesStore } from '@/stores/recipes';
import { computed, ref, onBeforeUpdate } from 'vue';
import Card from './Card.vue';
import Divider from './Divider.vue';
import ScrollLink from './ScrollLink.vue';
import { ComputedRecipe } from '@/types/recipe';

const recipesStore = useRecipesStore();

const props = defineProps<{
    computedRecipe: ComputedRecipe;
}>();

const usedFor = computed(() => {
    const result: { [key: string]: string } = {};

    if (props.computedRecipe.used_for?.includes('Uses')) {
        const parentRecipes = props.computedRecipe.used_for
            .split('|')
            .map((parentRecipe) => parentRecipe.trim());

        const re = /(.*)\s+(\(Uses.*\))/;
        for (const parentRecipe of parentRecipes) {
            const match = re.exec(parentRecipe);
            if (match != null && match?.length > 2) {
                result[match[1]] = match[2];
            }
        }
        return result;
    } else {
        result[props.computedRecipe.used_for ?? ''] = '';
    }

    return result;
});

const highlighted = ref<boolean>(false);

onBeforeUpdate(() => {
    highlighted.value = recipesStore.selectedRecipe == props.computedRecipe.name;
});
</script>

<template>
    <Card
        class="text-sm"
        :class="{ 'border-yellow-500': highlighted }"
        :id="computedRecipe.name"
    >
        <template #header>
            <div class="flex items-center gap-2 text-sm">
                <img
                    v-if="computedRecipe.image"
                    class="inline w-6 h-6"
                    :src="computedRecipe.image"
                    :alt="computedRecipe.name"
                />
                <span>{{ computedRecipe.name }} {{ computedRecipe.num_crafted_per_sec }}/s</span>
            </div>
        </template>
        <div v-if="computedRecipe.facility" class="flex items-center gap-2 text-xs text-slate-600">
            <span class="font-medium text-slate-700">{{ computedRecipe.num_facilities_needed == 1 ? 'Facility' : 'Facilities' }}:</span>
            <img
                v-if="
                    recipesStore.recipeMap[computedRecipe.facility] &&
                    recipesStore.recipeMap[computedRecipe.facility][0]
                "
                class="inline w-5 h-5"
                :src="recipesStore.recipeMap[computedRecipe.facility][0].image"
                :alt="computedRecipe.name"
            />
        </div>
        <div>{{ computedRecipe.num_facilities_needed }} {{ computedRecipe.facility }}{{ computedRecipe.num_facilities_needed == 1 ? '' : 's' }}</div>
        <div class="mt-3 space-y-3">
            <div v-if="Object.keys(computedRecipe.items_consumed_per_sec || {}).length > 0">
                <div class="mb-2 text-xs font-medium text-slate-700">Consumes:</div>
                <div class="flex flex-wrap gap-2">
                    <ScrollLink
                        v-for="(val, key) in computedRecipe.items_consumed_per_sec"
                        :targetId="`${key}`"
                        :callback="
                            () => {
                                recipesStore.setSelectedRecipe(`${key}`);
                            }
                        "
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded bg-slate-50 border-slate-300 hover:border-slate-400 hover:bg-slate-100"
                    >
                        <img
                            v-if="recipesStore.recipeMap[key] && recipesStore.recipeMap[key][0]"
                            class="inline w-4 h-4"
                            :src="recipesStore.recipeMap[key][0].image"
                            :alt="computedRecipe.name"
                        />
                        <span>{{ key }}: {{ val }}/s</span>
                    </ScrollLink>
                </div>
            </div>
            <div v-if="computedRecipe.used_for !== ''">
                <div class="mb-2 text-xs font-medium text-slate-700">For:</div>
                <div class="flex flex-wrap gap-2">
                    <ScrollLink
                        v-for="(usesStr, parentRecipeName) in usedFor"
                        :targetId="(parentRecipeName as string)"
                        :callback="() => { recipesStore.setSelectedRecipe(parentRecipeName as string); }"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded bg-slate-50 border-slate-300 hover:border-slate-400 hover:bg-slate-100"
                    >
                        <img
                            v-if="
                                recipesStore.recipeMap[parentRecipeName] &&
                                recipesStore.recipeMap[parentRecipeName][0]
                            "
                            class="inline w-4 h-4"
                            :src="recipesStore.recipeMap[parentRecipeName][0].image"
                            :alt="computedRecipe.name"
                        />
                        <span>{{ parentRecipeName }} {{ usesStr }}</span>
                    </ScrollLink>
                </div>
            </div>
        </div>
    </Card>
</template>
