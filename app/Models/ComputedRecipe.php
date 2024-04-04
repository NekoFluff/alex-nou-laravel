<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 *
 * @property string $name
 * @property string $facility
 * @property int $num_facilities_needed
 * @property array $items_consumed_per_sec
 * @property int $seconds_spent_per_craft
 * @property int $num_crafted_per_sec
 * @property string $used_for
 * @property int $depth
 * @property string $image
 * @method static \Illuminate\Database\Eloquent\Builder|ComputedRecipe newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ComputedRecipe newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ComputedRecipe query()
 * @mixin \Eloquent
 */
class ComputedRecipe extends Model
{
    protected $table = null;

    public $timestamps = false;

    protected $fillable = ['name', 'facility', 'num_facilities_needed', 'items_consumed_per_sec', 'seconds_spent_per_craft', 'num_crafted_per_sec', 'used_for', 'depth', 'image'];

    protected $casts = [
        'num_facilities_needed' => 'integer',
        'items_consumed_per_sec' => 'array',
        'seconds_spent_per_craft' => 'integer',
        'num_crafted_per_sec' => 'integer',
        'depth' => 'integer',
    ];
}
