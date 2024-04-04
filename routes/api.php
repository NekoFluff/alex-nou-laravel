<?php

use App\Http\Controllers\ComputedRecipeController;

Route::prefix('api/dsp')->group(function () {
    Route::get('/recipes', [ComputedRecipeController::class, 'index'])->name('recipes.index');
    Route::post('/recipes/compute', [ComputedRecipeController::class, 'computed'])->name('recipes.computed');
});
