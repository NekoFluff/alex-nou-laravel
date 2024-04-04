<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * 
 *
 * @property int $id
 * @property string $name
 * @property string $facility
 * @property string $image
 * @property int $quantity_produced
 * @property int $time_to_produce
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Ingredient> $ingredients
 * @property-read int|null $ingredients_count
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe query()
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereFacility($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereImage($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereQuantityProduced($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereTimeToProduce($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Recipe whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Recipe extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'facility', 'image', 'quantity_produced', 'time_to_produce'];

    protected $casts = [
        'time_to_produce' => 'integer',
        'quantity_produced' => 'integer',
    ];

    public function ingredients()
    {
        return $this->hasMany(Ingredient::class);
    }
}
