<script setup lang="ts">
import { useRecipesStore } from "@/stores/recipes";
import { computed, ref, onBeforeUpdate } from "vue";
import Card from "./Card.vue";
import Divider from "./Divider.vue";
import ScrollLink from "./ScrollLink.vue";
import { ComputedRecipe } from "@/types/recipe";

const recipesStore = useRecipesStore();

const props = defineProps<{
    computedRecipe: ComputedRecipe;
}>();

const usedFor = computed(() => {
    const result: { [key: string]: string } = {}

    if (props.computedRecipe.used_for?.includes('Uses')) {
        const parentRecipes = props.computedRecipe.used_for.split('|').map((parentRecipe) => parentRecipe.trim())

        const re = /(.*)\s+(\(Uses.*\))/;
        for (const parentRecipe of parentRecipes) {
            const match = re.exec(parentRecipe)
            if (match != null && match?.length > 2) {
                result[match[1]] = match[2]
            }
        }
        return result
    } else {
        result[props.computedRecipe.used_for ?? ""] = ""
    }

    return result
})

const highlighted = ref<boolean>(false);

onBeforeUpdate(() => {
    highlighted.value = (recipesStore.selectedRecipe == props.computedRecipe.name)
})

</script>

<template>
    <Card class="p-2 text-xs" :class="{ 'border-yellow-500': highlighted }" :id="computedRecipe.name">
        <template #header>
            <div>
                <img v-if="computedRecipe.image" class="inline w-5 h-5" :src="computedRecipe.image"
                    :alt="computedRecipe.name" /> {{ computedRecipe.num_crafted_per_sec }} {{ computedRecipe.name
                    }} per sec
            </div>
        </template>
        <Divider class="my-2" />
        <div v-if="computedRecipe.facility" class="mb-2">
            <span class="font-bold">{{ computedRecipe.num_facilities_needed ==
                1 ?
                "Facility" : "Facilities" }}:
            </span>
            <img v-if="recipesStore.recipeMap[computedRecipe.facility] && recipesStore.recipeMap[computedRecipe.facility][0]"
                class="inline w-5 h-5" :src="recipesStore.recipeMap[computedRecipe.facility][0].image"
                :alt="computedRecipe.name" />
            {{ computedRecipe.num_facilities_needed }} {{ computedRecipe.facility }}{{ computedRecipe.num_facilities_needed
                == 1
                ? "" : "s" }}
        </div>
        <div class="font-bold">
            Consumes:
        </div>
        <ul class="mb-2">
            <li v-for="(val, key) in computedRecipe.items_consumed_per_sec">
                <ScrollLink :targetId="`${key}`" :callback="() => { recipesStore.setSelectedRecipe(`${key}`); }">
                    <img v-if="recipesStore.recipeMap[key] && recipesStore.recipeMap[key][0]" class="inline w-5 h-5"
                        :src="recipesStore.recipeMap[key][0].image" :alt="computedRecipe.name" />
                    {{ key }}: {{ val }}/s
                </ScrollLink>
            </li>
        </ul>
        <div class="font-bold" v-if="computedRecipe.used_for !== ''">
            For:
        </div>
        <ul class="mb-2">
            <li v-for="(usesStr, parentRecipeName) in usedFor">
                <ScrollLink :targetId="(parentRecipeName as string)"
                    :callback="() => { recipesStore.setSelectedRecipe(parentRecipeName as string); }">
                    <img v-if="recipesStore.recipeMap[parentRecipeName] && recipesStore.recipeMap[parentRecipeName][0]"
                        class="inline w-5 h-5" :src="recipesStore.recipeMap[parentRecipeName][0].image"
                        :alt="computedRecipe.name" />
                    {{ parentRecipeName }} {{ usesStr }}
                </ScrollLink>
            </li>
        </ul>
    </Card>
</template>
