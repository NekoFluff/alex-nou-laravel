<?php

namespace App\Http\Clients\Wanikani;

interface WanikaniClientInterface
{
    /**
     * Fetches the level progressions of the user's current run, ordered by level.
     *
     * @return array<Models\LevelProgression> The fetched items.
     */
    public function getLevelProgression(): array;

    /**
     * Fetches the number of subjects (radicals, kanji, and vocabulary) per level.
     *
     * @return array<int, int> Map of level => item count.
     */
    public function getItemCountsByLevel(): array;
}
