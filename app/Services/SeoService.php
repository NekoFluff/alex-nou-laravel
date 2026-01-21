<?php

namespace App\Services;

class SeoService
{
    private array $defaultSeo = [
        'title' => 'Alex Nou - Software Engineer & Developer',
        'description' => 'Alex Nou - Software Engineer & Developer Portfolio showcasing projects, skills, and experience in web development',
        'keywords' => 'software engineer, developer, portfolio, projects, web development, Laravel, Vue.js, TypeScript',
        'author' => 'Alex Nou',
        'robots' => 'index, follow',
        'og_type' => 'website',
        'twitter_card' => 'summary_large_image',
    ];

    public function getSeoData(string $page, array $customData = []): array
    {
        $pageSeo = match($page) {
            'welcome' => [
                'title' => 'Alex Nou - Software Engineer & Developer Portfolio',
                'description' => 'Welcome to Alex Nou\'s portfolio. Explore my projects, skills, and experience in software engineering and web development.',
                'keywords' => 'Alex Nou, software engineer, developer, portfolio, web development',
                'og_title' => 'Alex Nou - Software Engineer Portfolio',
                'og_description' => 'Welcome to my portfolio showcasing software engineering projects and skills',
            ],
            'projects' => [
                'title' => 'Projects - Alex Nou',
                'description' => 'Explore Alex Nou\'s software development projects including web applications, tools, and innovative solutions.',
                'keywords' => 'projects, software projects, web applications, development portfolio',
                'og_title' => 'Alex Nou - Projects & Portfolio',
                'og_description' => 'Explore my software development projects and innovations',
            ],
            'dsp' => [
                'title' => 'DSP Calculator - Dyson Sphere Program Tool',
                'description' => 'Interactive Dyson Sphere Program calculator for optimizing production chains and resource management.',
                'keywords' => 'DSP calculator, Dyson Sphere Program, production calculator, game tool, resource optimization',
                'og_title' => 'DSP Calculator - Production Optimizer',
                'og_description' => 'Optimize your Dyson Sphere Program production chains with this interactive calculator',
            ],
            'wanikani' => [
                'title' => 'WaniKani Dashboard - Japanese Learning Tool',
                'description' => 'Track your WaniKani progress and manage Japanese language learning with this dashboard.',
                'keywords' => 'WaniKani, Japanese learning, kanji, language learning, study tool',
                'og_title' => 'WaniKani Learning Dashboard',
                'og_description' => 'Track and optimize your Japanese learning progress',
            ],
            default => $this->defaultSeo,
        };

        return array_merge($this->defaultSeo, $pageSeo, $customData);
    }

    public function getStructuredData(string $type = 'Person'): array
    {
        return match($type) {
            'Person' => [
                '@context' => 'https://schema.org',
                '@type' => 'Person',
                'name' => 'Alex Nou',
                'jobTitle' => 'Software Engineer',
                'url' => url('/'),
                'sameAs' => [
                    'https://www.linkedin.com/in/alex-nou-271323138/',
                    'https://github.com/NekoFluff',
                ],
            ],
            'WebSite' => [
                '@context' => 'https://schema.org',
                '@type' => 'WebSite',
                'name' => config('app.name'),
                'url' => url('/'),
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => url('/search?q={search_term_string}'),
                    'query-input' => 'required name=search_term_string',
                ],
            ],
            default => [],
        };
    }
}
