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

    /**
     * Fetches the number of subjects (radicals, kanji, and vocabulary) per level.
     *
     * @return array<int, int> Map of level => item count.
     */
    public function getItemCountsByLevel(): array;
}
