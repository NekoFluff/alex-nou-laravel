import { Ingredient } from "./ingredient";

export type Recipe = {
    name: string;
    facility: string;
    image: string;
    ingredients: Ingredient[];
    quantity_produced: number;
    time_to_produce: number;
};

export type RecipeRequest = {
    name: string,
    quantity_per_second: number,
    requirements?: RecipeRequirements
}

export type RecipeRequirements = {
    [key: string]: number
}

export type ComputedRecipe = {
    name: string,
    facility: string,
    num_facilities_needed: number,
    items_consumed_per_sec: { [key: string]: number },
    seconds_spent_per_craft: number,
    num_crafted_per_sec: number,
    used_for: string,
    depth?: number,
    image?: string
}
