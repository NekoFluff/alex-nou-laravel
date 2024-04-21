<?php

namespace App\Http\Clients\Wanikani;

interface WanikaniClientInterface
{
    /**
     * Fetches the current level progression
     *
     * @return array<Models\LevelProgression> The fetched item.
     */
    public function getLevelProgression(): array;
}
