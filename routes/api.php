<?php

use App\Http\Controllers\ComputedRecipeController;
use App\Http\Controllers\PageViewController;

Route::prefix('api/dsp')->group(function () {
    Route::get('/recipes', [ComputedRecipeController::class, 'index'])->name('recipes.index');
    Route::post('/recipes/compute', [ComputedRecipeController::class, 'computed'])->name('recipes.computed');
    Route::post('/page-views', [PageViewController::class, 'store'])->name('page-views.store');
});
