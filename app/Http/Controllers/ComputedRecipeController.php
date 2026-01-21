<?php

namespace App\Http\Controllers;

use App\Http\Requests\ComputedRecipeRequest;
use App\Models\ComputedRecipe;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\ComputedRecipeService;

class ComputedRecipeController extends Controller
{
    public function __construct(private ComputedRecipeService $computedRecipeService)
    {
        $this->computedRecipeService = $computedRecipeService;
    }

    public function index(): JsonResponse
    {
        $resp = [];
        $recipeMap = $this->computedRecipeService->getRecipeMap();

        foreach ($recipeMap as $_recipeName => $recipes) {
            $resp[] = $recipes;
        }

        return response()->json($resp);
    }

    public function computed(ComputedRecipeRequest $request): JsonResponse
    {
        $computedRecipes = $this->computedRecipeService->getComputedRecipes(
            $request->input('name'),
            $request->input('quantity_per_second'),
            '',
            [],
            0,
            $request->input('requirements'),
            $request->input('assemblerLevel'),
            $request->input('smelterLevel'),
            $request->input('chemicalPlantLevel'),
        );

        if ($request->input('group')) {
            $computedRecipes = $this->sortComputedRecipes($computedRecipes);
            $computedRecipes = $this->groupRecipes($computedRecipes);
        }

        $computedRecipes = $this->sortComputedRecipes($computedRecipes);

        return response()->json($computedRecipes);
    }

    /**
     * @var array<ComputedRecipe> $computedRecipes
     * @return array<ComputedRecipe>
     */
    private function sortComputedRecipes(array $computedRecipes): array
    {
        usort($computedRecipes, function ($a, $b) {
            if ($a->depth !== $b->depth) {
                return $a->depth - $b->depth;
            }
            if ($a->name !== $b->name) {
                return $a->name <=> $b->name;
            }
            if ($a->usedFor !== $b->usedFor) {
                return $a->usedFor <=> $b->usedFor;
            }
            return $a->num_crafted_per_sec <=> $b->num_crafted_per_sec;
        });

        return $computedRecipes;
    }

    /**
     * @var array<ComputedRecipe> $computedRecipes
     * @return array<ComputedRecipe>
     */
    private function groupRecipes(array $computedRecipes): array
    {
        /** @var array<string, ComputedRecipe> $uniqueRecipe */
        $uniqueRecipes = [];

        foreach ($computedRecipes as $recipe) {
            if (isset($uniqueRecipes[$recipe->name])) {
                /** @var ComputedRecipe $uRecipe */
                $uRecipe = $uniqueRecipes[$recipe->name];

                $oldNum = $uRecipe->num_facilities_needed;
                $newNum = $recipe->num_facilities_needed;
                $totalNum = $oldNum + $newNum > 0 ? $oldNum + $newNum : 1;
                $tmp = $uRecipe->items_consumed_per_sec;
                foreach ($tmp as $materialName => $perSecConsumption) {
                    $tmp[$materialName] = $perSecConsumption + $recipe->items_consumed_per_sec[$materialName];
                }
                $uRecipe->items_consumed_per_sec = $tmp;

                $uRecipe->seconds_spent_per_craft = ($uRecipe->seconds_spent_per_craft * $oldNum + $recipe->seconds_spent_per_craft * $newNum) / $totalNum;
                $uRecipe->num_crafted_per_sec = $uRecipe->num_crafted_per_sec + $recipe->num_crafted_per_sec;
                $uRecipe->used_for = sprintf('%s | %s (Uses %0.2f/s)', $uRecipe->used_for, $recipe->used_for, $recipe->num_crafted_per_sec);
                $uRecipe->num_facilities_needed += $recipe->num_facilities_needed;
                $uRecipe->depth = max($uRecipe->depth, $recipe->depth);
                $uniqueRecipes[$recipe->name] = $uRecipe;
            } else {
                if ($recipe->used_for !== '') {
                    $recipe->used_for = sprintf('%s (Uses %0.2f/s)', $recipe->used_for, $recipe->num_crafted_per_sec);
                }
                $uniqueRecipes[$recipe->name] = $recipe;
            }
        }

        return array_values($uniqueRecipes);
    }
}
