<?php

namespace App\Console\Commands;

use App\Models\Recipe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeDspRecipes extends Command
{
    protected $signature = 'scrape:dsp-recipes {--fresh : Delete existing recipes before scraping}';

    protected $description = 'Scrape DSP recipes from dsp-wiki.com and store in database';

    public function handle(): int
    {
        $this->info('Starting DSP recipe scraping...');

        if ($this->option('fresh')) {
            $this->info('Deleting existing recipes...');
            Recipe::query()->delete();
        }

        $urls = $this->getURLs();
        $this->info('Found ' . count($urls) . ' items to scrape');

        $bar = $this->output->createProgressBar(count($urls));
        $bar->start();

        $recipesCount = 0;
        foreach ($urls as $itemName => $url) {
            $recipes = $this->scrapeURL($itemName, $url);
            $recipesCount += count($recipes);
            $bar->advance();
        }

        // Add Critical Photon (special case)
        Recipe::create([
            'name' => 'Critical Photon',
            'quantity_produced' => 0,
            'facility' => 'Ray Receiver',
            'time_to_produce' => 0,
            'image' => 'https://dsp-wiki.com/images/9/92/Icon_Critical_Photon.png',
        ]);
        $recipesCount++;

        $bar->finish();
        $this->newLine(2);
        $this->info("Successfully scraped {$recipesCount} recipes!");

        return self::SUCCESS;
    }

    protected function getURLs(): array
    {
        $url = 'https://dsp-wiki.com/Items';
        $urls = [];

        $this->info("Fetching item list from {$url}...");

        try {
            $response = Http::timeout(30)->get($url);

            if (!$response->successful()) {
                $this->error('Failed to fetch items page');
                return [];
            }

            $crawler = new Crawler($response->body());

            $crawler->filter('div.item_icon_container a[href]')->each(function (Crawler $node) use (&$urls) {
                $title = $node->attr('title');
                $href = $node->attr('href');

                if ($title && $href) {
                    // Convert relative URL to absolute
                    if (str_starts_with($href, '/')) {
                        $href = 'https://dsp-wiki.com' . $href;
                    }
                    $urls[$title] = $href;
                }
            });

            return $urls;
        } catch (\Exception $e) {
            $this->error('Error fetching URLs: ' . $e->getMessage());
            return [];
        }
    }

    protected function scrapeURL(string $itemName, string $url): array
    {
        try {
            $response = Http::timeout(30)->get($url);

            if (!$response->successful()) {
                $this->warn("Failed to fetch {$itemName}");
                return [];
            }

            $crawler = new Crawler($response->body());
            $recipes = [];

            // Find the first production table
            $crawler->filter('table.pc_table')->first()->filter('tr')->each(function (Crawler $row, $index) use ($itemName, &$recipes) {
                // Skip header row if any
                if ($index === 0 && $row->filter('th')->count() > 0) {
                    return;
                }

                $recipe = [
                    'name' => '',
                    'ingredients' => [],
                    'time_to_produce' => 0,
                    'quantity_produced' => 0,
                    'facility' => '',
                    'image' => '',
                ];

                // Extract ingredients
                $row->filter('div.tt_recipe_item')->each(function (Crawler $node) use (&$recipe) {
                    $name = $node->filter('a')->attr('title');
                    $count = (float) trim($node->filter('div')->text());
                    if ($name) {
                        $recipe['ingredients'][$name] = $count;
                    }
                });

                // Extract time to produce
                $timeText = $row->filter('div.tt_rec_arrow')->text();
                if (preg_match('/(\d+\.?\d*)/', $timeText, $matches)) {
                    $recipe['time_to_produce'] = (float) $matches[1];
                }

                // Extract output items
                $row->filter('div.tt_output_item')->each(function (Crawler $node) use ($itemName, &$recipe) {
                    $outputItemName = $node->filter('a')->attr('title');

                    if ($outputItemName === $itemName) {
                        $recipe['name'] = $outputItemName;
                        $quantityText = $node->filter('div')->text();
                        $recipe['quantity_produced'] = (float) trim($quantityText);

                        $imgSrc = $node->filter('img')->attr('src');
                        if ($imgSrc && str_starts_with($imgSrc, '/')) {
                            $recipe['image'] = 'https://dsp-wiki.com' . $imgSrc;
                        } elseif ($imgSrc) {
                            $recipe['image'] = $imgSrc;
                        }
                    }
                });

                // Extract facility
                $facilityNode = $row->filter('td')->eq(1)->filter('a')->first();
                if ($facilityNode->count() > 0) {
                    $recipe['facility'] = $facilityNode->attr('title');
                }

                // Only save if we have a valid recipe for this item
                if (!empty($recipe['name'])) {
                    $recipes[] = $recipe;
                }
            });

            // Save recipes to database
            foreach ($recipes as $recipeData) {
                $ingredients = $recipeData['ingredients'];
                unset($recipeData['ingredients']);

                $recipe = Recipe::create($recipeData);

                // Create ingredients
                foreach ($ingredients as $name => $quantity) {
                    $recipe->ingredients()->create([
                        'name' => $name,
                        'quantity' => $quantity,
                    ]);
                }
            }

            return $recipes;
        } catch (\Exception $e) {
            $this->warn("Error scraping {$itemName}: " . $e->getMessage());
            return [];
        }
    }
}
