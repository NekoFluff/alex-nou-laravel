<?php

namespace App\Http\Clients\Wanikani;

use App\Http\Clients\Wanikani\Models\LevelProgression;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WanikaniClient implements WanikaniClientInterface
{
    private $client;

    public function __construct()
    {
        $stack = HandlerStack::create();

        $this->client = new Client([
            'base_uri' => 'https://api.wanikani.com/v2/',
            'timeout' => 10.0,
            'handler' => $stack,
            'headers' => [
                'Authorization' => 'Bearer ' . config('services.wanikani.api_token'),
            ],
        ]);
    }

    public function getLevelProgression(): array
    {
        Log::debug("Retrieving level progression data");
        try {
            $response = $this->client->get("level_progressions");
            Log::debug("Retrieved level progression data {$response->getBody()}");

            /** @var array $responseData */
            $responseData = json_decode($response->getBody(), true);

            $levelProgressions = [];
            foreach ($responseData['data'] as $levelProgressionObject) {
                $levelProgressions[] = LevelProgression::hydrate($levelProgressionObject['data']);
            }

            return $levelProgressions;
        } catch (Exception $e) {
            Log::error("Failed to retrieve level progression data", ['exception' => $e]);
        }

        return [];
    }

    public function getItemCountsByLevel(): array
    {
        return Cache::remember('wanikani.item_counts_by_level', now()->addDay(), function () {
            Log::debug("Retrieving subject counts by level");
            $countsByLevel = [];

            try {
                $url = 'subjects?types=radical,kanji,vocabulary';

                while ($url !== null) {
                    $response = $this->client->get($url);
                    /** @var array $responseData */
                    $responseData = json_decode($response->getBody(), true);

                    foreach ($responseData['data'] as $subject) {
                        $level = $subject['data']['level'];
                        $countsByLevel[$level] = ($countsByLevel[$level] ?? 0) + 1;
                    }

                    $url = $responseData['pages']['next_url'] ?? null;
                }
            } catch (Exception $e) {
                Log::error("Failed to retrieve subject data", ['exception' => $e]);
                return [];
            }

            return $countsByLevel;
        });
    }
}
