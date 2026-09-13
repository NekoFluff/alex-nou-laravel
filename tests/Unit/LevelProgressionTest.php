<?php

use App\Http\Clients\Wanikani\Models\LevelProgression;
use Tests\TestCase;

uses(TestCase::class);

function progression(array $data): LevelProgression
{
    return LevelProgression::hydrate(array_merge([
        'created_at' => '2022-04-01T01:43:23.070890Z',
        'level' => 1,
        'unlocked_at' => '2022-04-01T01:43:23.070162Z',
        'started_at' => '2022-04-01T02:03:28.405157Z',
        'passed_at' => '2022-04-04T14:13:26.096505Z',
        'completed_at' => null,
        'abandoned_at' => null,
    ], $data));
}

test('keeps only the progressions unlocked after the most recent reset', function () {
    $progressions = [
        progression(['level' => 1, 'unlocked_at' => '2022-04-01T01:43:23Z']),
        progression(['level' => 2, 'unlocked_at' => '2022-04-04T14:13:26Z']),
        progression(['level' => 3, 'unlocked_at' => '2022-04-09T14:13:26Z']),
        // The user reset on 2023-12-15 while sitting on level 3.
        progression(['level' => 3, 'unlocked_at' => '2022-04-09T14:13:26Z', 'abandoned_at' => '2023-12-15T11:40:34Z']),
        progression(['level' => 1, 'unlocked_at' => '2023-12-15T11:40:35Z']),
        progression(['level' => 2, 'unlocked_at' => '2024-01-26T23:42:02Z']),
    ];

    $currentRun = LevelProgression::currentRun($progressions);

    expect(array_map(fn (LevelProgression $p) => $p->level, $currentRun))->toBe([1, 2]);
    expect($currentRun[0]->unlocked_at->toDateString())->toBe('2023-12-15');
});

test('uses the latest reset so earlier abandoned runs stay excluded', function () {
    $progressions = [
        progression(['level' => 12, 'unlocked_at' => '2021-03-29T00:59:19Z', 'abandoned_at' => '2023-04-04T07:52:12Z']),
        progression(['level' => 13, 'unlocked_at' => '2024-09-20T05:09:02Z', 'abandoned_at' => '2025-10-01T06:01:12Z']),
        progression(['level' => 12, 'unlocked_at' => '2025-10-01T06:01:13Z', 'abandoned_at' => '2025-10-01T08:36:37Z']),
        progression(['level' => 11, 'unlocked_at' => '2025-10-01T08:36:38Z']),
        progression(['level' => 12, 'unlocked_at' => '2026-07-28T17:26:36Z']),
    ];

    $currentRun = LevelProgression::currentRun($progressions);

    expect(array_map(fn (LevelProgression $p) => $p->level, $currentRun))->toBe([11, 12]);
});

test('reports the current level rather than the all-time high after a reset', function () {
    $progressions = [
        progression(['level' => 1, 'unlocked_at' => '2022-04-01T01:43:23Z']),
        progression(['level' => 30, 'unlocked_at' => '2023-01-01T00:00:00Z', 'abandoned_at' => '2023-06-01T00:00:00Z']),
        progression(['level' => 1, 'unlocked_at' => '2023-06-01T00:00:01Z']),
        progression(['level' => 2, 'unlocked_at' => '2023-06-10T00:00:00Z']),
    ];

    $currentRun = LevelProgression::currentRun($progressions);
    $currentLevel = end($currentRun)->level;

    expect($currentLevel)->toBe(2);
});

test('sorts the fetched order by unlock time before finding the current run', function () {
    $progressions = [
        progression(['level' => 2, 'unlocked_at' => '2024-01-26T23:42:02Z']),
        progression(['level' => 3, 'unlocked_at' => '2022-04-09T14:13:26Z', 'abandoned_at' => '2023-12-15T11:40:34Z']),
        progression(['level' => 1, 'unlocked_at' => '2023-12-15T11:40:35Z']),
    ];

    $currentRun = LevelProgression::currentRun($progressions);

    expect(array_map(fn (LevelProgression $p) => $p->level, $currentRun))->toBe([1, 2]);
});

test('keeps every progression when nothing was ever abandoned', function () {
    $progressions = [
        progression(['level' => 3, 'unlocked_at' => '2022-04-09T14:13:26Z']),
        progression(['level' => 1, 'unlocked_at' => '2022-04-01T01:43:23Z']),
        progression(['level' => 2, 'unlocked_at' => '2022-04-04T14:13:26Z']),
    ];

    $currentRun = LevelProgression::currentRun($progressions);

    expect(array_map(fn (LevelProgression $p) => $p->level, $currentRun))->toBe([1, 2, 3]);
});
