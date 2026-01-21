<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ComputedRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
            'quantity_per_second' => ['required', 'numeric'],
            'requirements' => ['array'],
            'requirements.*' => ['numeric'],
            'smelterLevel' => ['required', 'integer'],
            'assemblerLevel' => ['required', 'integer'],
            'chemicalPlantLevel' => ['required', 'integer'],
            'group' => ['boolean'],
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'smelterLevel' => $this->smelterLevel ?? 2,
            'assemblerLevel' => $this->assemblerLevel ?? 1,
            'chemicalPlantLevel' => $this->chemicalPlantLevel ?? 1,
            'group' => filter_var($this->group, FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
