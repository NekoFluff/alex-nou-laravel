<?php

namespace App\Services;

use App\Models\ComputedRecipe;
use App\Models\Recipe;

class ComputedRecipeService
{
    /** @var array<string, Recipe> */
    protected array $recipeMap = [];

    public function __construct()
    {
        $recipes = Recipe::with('ingredients')->get();
        foreach ($recipes as $recipe) {
            $this->recipeMap[$recipe->name][] = $recipe;
        }
    }

    public function getRecipe(string $itemName, int $recipeIdx): ?Recipe
    {
        return $this->recipeMap[$itemName][$recipeIdx] ?? null;
    }

    public function getRecipeMap(): array
    {
        return $this->recipeMap;
    }

    /**
     * @return array<ComputedRecipe>
     */
    public function getComputedRecipes(string $itemName, float $craftingSpeed, string $parentItemName, array $seenRecipes, int $depth, array $recipeRequirements, int $assemblerLevel, int $smelterLevel, int $chemicalPlantLevel): array
    {
        $computedRecipes = [];

        if (isset($seenRecipes[$itemName])) {
            return $computedRecipes;
        }
        $seenRecipes[$itemName] = true;

        $rRequirement = $recipeRequirements[$itemName] ?? null;
        $recipeIdx = 0;
        if ($rRequirement) {
            $recipeIdx = $rRequirement;
        }

        $recipe = $this->getRecipe($itemName, $recipeIdx);
        if (!$recipe) {
            return $computedRecipes;
        }

        $recipe->load('ingredients');
        $consumedMats = [];
        $speedModifier = 1.0;
        if (($recipe->facility != "") && (strpos(strtolower($recipe->facility), "assembling machine") !== false)) {
            switch ($assemblerLevel) {
                case 1:
                    $speedModifier = 0.75;
                    $recipe->facility = "Assembling Machine Mk.I";
                    break;
                case 2:
                    $speedModifier = 1.0;
                    $recipe->facility = "Assembling Machine Mk.II";
                    break;
                case 3:
                    $speedModifier = 1.5;
                    $recipe->facility = "Assembling Machine Mk.III";
                    break;
                default:
                    $speedModifier = 1.0;
                    $recipe->facility = "Assembling Machine Mk.II";
                    break;
            }
        } elseif (($recipe->facility != "") && (strpos(strtolower($recipe->facility), "smelter") !== false)) {
            switch ($smelterLevel) {
                case 1:
                    $speedModifier = 1.0;
                    $recipe->facility = "Arc Smelter";
                    break;
                case 2:
                    $speedModifier = 2.0;
                    $recipe->facility = "Plane Smelter";
                    break;
                default:
                    $speedModifier = 1.0;
                    $recipe->facility = "Arc Smelter";
                    break;
            }
        } elseif (($recipe->facility != "") && (strpos(strtolower($recipe->facility), "chemical plant") !== false)) {
            switch ($chemicalPlantLevel) {
                case 1:
                    $speedModifier = 1.0;
                    $recipe->facility = "Chemical Plant";
                    break;
                case 2:
                    $speedModifier = 2.0;
                    $recipe->facility = "Quantum Chemical Plant";
                    break;
                default:
                    $speedModifier = 1.0;
                    $recipe->facility = "Chemical Plant";
                    break;
            }
        }

        $numberOfFacilitiesNeeded = $recipe->time_to_produce * $craftingSpeed / $recipe->quantity_produced;

        foreach ($recipe->ingredients as $ingredient) {
            $consumedMats[$ingredient->name] = $ingredient->quantity * $numberOfFacilitiesNeeded / $recipe->time_to_produce;
        }

        $computedRecipe = new ComputedRecipe([
            'name' => $recipe->name,
            'facility' => $recipe->facility,
            'num_facilities_needed' => $numberOfFacilitiesNeeded / $speedModifier,
            'items_consumed_per_sec' => $consumedMats,
            'seconds_spent_per_craft' => $recipe->time_to_produce,
            'crafting_per_sec' => $craftingSpeed,
            'used_for' => $parentItemName,
            'depth' => $depth,
            'image' => $recipe->image,
        ]);

        $computedRecipes[] = $computedRecipe;

        foreach ($computedRecipe->items_consumed_per_sec as $materialName => $materialCountPerSec) {
            $targetCraftingSpeed = $materialCountPerSec;
            $seenRecipesCopy = $seenRecipes;
            $crs = $this->getComputedRecipes($materialName, $targetCraftingSpeed, $recipe->name, $seenRecipesCopy, $depth + 1, $recipeRequirements, $assemblerLevel, $smelterLevel, $chemicalPlantLevel);
            $computedRecipes = array_merge($computedRecipes, $crs);
        }

        return $computedRecipes;
    }
}
