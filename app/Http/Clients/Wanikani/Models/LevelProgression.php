<?php

namespace App\Http\Clients\Wanikani\Models;

use Illuminate\Support\Carbon as Date;

class LevelProgression
{
    public Date $created_at;

    public int $level;

    public Date $unlocked_at;

    public ?Date $started_at;

    public ?Date $passed_at;

    public ?Date $completed_at; // unused

    public ?Date $abandoned_at; // unused


    public static function hydrate(array $data): self
    {
        $levelProgression = new self();

        $levelProgression->created_at = Date::parse($data['created_at']);
        $levelProgression->level = $data['level'];
        $levelProgression->unlocked_at = Date::parse($data['unlocked_at']);
        $levelProgression->started_at = $data['started_at'] ? Date::parse($data['started_at']) : null;
        $levelProgression->passed_at = $data['passed_at'] ? Date::parse($data['passed_at']) : null;
        $levelProgression->completed_at = $data['completed_at'] ? Date::parse($data['completed_at']) : null;
        $levelProgression->abandoned_at = $data['abandoned_at'] ? Date::parse($data['abandoned_at']) : null;

        return $levelProgression;
    }
}
