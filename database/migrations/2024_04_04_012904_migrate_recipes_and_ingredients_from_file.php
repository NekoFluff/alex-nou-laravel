<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        $recipes = json_decode(file_get_contents('database/dsp.recipes.json'), true);

        if (empty($recipes)) {
            throw new \Exception('No recipes found in JSON file');
        }


        for ($i = 0; $i < count($recipes); $i++) {
            $newRecipe = $recipes[$i];
            $newRecipe['quantity_produced'] = $newRecipe['quantityProduced'] ?? 0;
            unset($newRecipe['quantityProduced']);
            $newRecipe['time_to_produce'] = $newRecipe['timeToProduce'] ?? 0;
            unset($newRecipe['timeToProduce']);
            unset($newRecipe['_id']);
            $newIngredients = $newRecipe['ingredients'] ?? [];
            unset($newRecipe['ingredients']);
            $newRecipe['created_at'] = now();
            $newRecipe['updated_at'] = now();
            DB::table('recipes')->insert($newRecipe);

            $lastRecipeId = DB::table('recipes')->orderBy('id', 'desc')->value('id');

            foreach ($newIngredients as $ingredientName => $quantity) {
                $newIngredient = [
                    'recipe_id' => $lastRecipeId,
                    'name' => $ingredientName,
                    'quantity' => $quantity,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                DB::table('ingredients')->insert($newIngredient);
            }
        }
    }
};
