<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $urls = [
            [
                'loc' => url('/'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '1.0',
            ],
            [
                'loc' => url('/projects'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.9',
            ],
            [
                'loc' => url('/projects/dsp'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'monthly',
                'priority' => '0.8',
            ],
            [
                'loc' => url('/wanikani'),
                'lastmod' => now()->toAtomString(),
                'changefreq' => 'monthly',
                'priority' => '0.7',
            ],
        ];

        $sitemap = view('sitemap', compact('urls'))->render();

        return response($sitemap, 200)
            ->header('Content-Type', 'text/xml; charset=utf-8')
            ->header('X-Robots-Tag', 'noindex');
    }
}
