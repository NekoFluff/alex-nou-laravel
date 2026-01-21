<?php

namespace App\Services;

class SeoService
{
    private array $defaultSeo = [
        'title' => 'Alex Nou - Software Engineer & Developer',
        'description' => 'Alex Nou is a Software Engineer at BackgroundChecks.com specializing in Go, PHP, and TypeScript. ASU graduate with expertise in Kubernetes, distributed systems, and clean architecture.',
        'keywords' => 'Alex Nou, software engineer, developer, portfolio, Go developer, PHP developer, TypeScript, Kubernetes, web development, BackgroundChecks.com, Arizona State University, ASU',
        'author' => 'Alex Nou',
        'robots' => 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
        'og_type' => 'website',
        'twitter_card' => 'summary_large_image',
        'og_locale' => 'en_US',
    ];

    public function getSeoData(string $page, array $customData = []): array
    {
        $pageSeo = match($page) {
            'welcome' => [
                'title' => 'Alex Nou - Software Engineer | Go, PHP, TypeScript Developer',
                'description' => 'Alex Nou is a Software Engineer at BackgroundChecks.com with expertise in Go, PHP, TypeScript, Kubernetes, and distributed systems. ASU graduate (4.0 GPA) passionate about clean architecture and scalable solutions.',
                'keywords' => 'Alex Nou, software engineer, Go developer, PHP developer, TypeScript developer, Kubernetes engineer, BackgroundChecks.com, Arizona State University, web development, distributed systems, clean architecture, domain-driven design',
                'og_title' => 'Alex Nou - Software Engineer & Developer',
                'og_description' => 'Software Engineer at BackgroundChecks.com specializing in Go, PHP, TypeScript, and Kubernetes. Building scalable and maintainable systems.',
                'twitter_title' => 'Alex Nou - Software Engineer',
                'twitter_description' => 'Software Engineer specializing in Go, PHP, TypeScript & Kubernetes',
            ],
            'projects' => [
                'title' => 'Projects - Alex Nou | Web Apps, Tools & Calculators',
                'description' => 'Explore Alex Nou\'s software development projects including DSP Calculator for Dyson Sphere Program, FFXIV crafting tools, and Japanese image translator. Full-stack web applications built with modern technologies.',
                'keywords' => 'software projects, web applications, DSP calculator, Dyson Sphere Program, FFXIV tools, Japanese translator, game tools, development portfolio, full-stack projects',
                'og_title' => 'Alex Nou - Software Projects & Portfolio',
                'og_description' => 'Web applications and tools: DSP Calculator, FFXIV crafting optimizer, Japanese image translator, and more',
                'twitter_title' => 'Alex Nou - Software Projects',
                'twitter_description' => 'Web apps & tools: DSP Calculator, FFXIV optimizer, JP translator',
            ],
            'dsp' => [
                'title' => 'DSP Calculator - Dyson Sphere Program Production Chain Tool',
                'description' => 'Free interactive Dyson Sphere Program calculator for optimizing production chains, resource management, and factory planning. Calculate building requirements and resource ratios for efficient production.',
                'keywords' => 'DSP calculator, Dyson Sphere Program calculator, DSP production calculator, DSP tool, game calculator, resource optimization, production chain, factory planner, building calculator',
                'og_title' => 'DSP Calculator - Dyson Sphere Program Production Optimizer',
                'og_description' => 'Free DSP production chain calculator. Optimize buildings, resources, and production ratios for Dyson Sphere Program.',
                'twitter_title' => 'DSP Calculator - Production Chain Tool',
                'twitter_description' => 'Free Dyson Sphere Program production calculator & optimizer',
            ],
            'wanikani' => [
                'title' => 'WaniKani Dashboard - Japanese Kanji Learning Progress Tracker',
                'description' => 'Track your WaniKani progress with this comprehensive dashboard. Monitor kanji, vocabulary, and radicals learning. Visualize your Japanese language learning journey with detailed statistics and insights.',
                'keywords' => 'WaniKani dashboard, Japanese learning, kanji learning, Japanese language, WaniKani tracker, vocabulary learning, radicals, Japanese study tool, language learning dashboard',
                'og_title' => 'WaniKani Dashboard - Japanese Learning Progress Tracker',
                'og_description' => 'Track WaniKani progress: kanji, vocabulary, radicals. Visualize your Japanese learning journey.',
                'twitter_title' => 'WaniKani Dashboard - Learning Tracker',
                'twitter_description' => 'Track your WaniKani kanji & vocabulary progress',
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
                'givenName' => 'Alex',
                'familyName' => 'Nou',
                'jobTitle' => 'Software Engineer',
                'worksFor' => [
                    '@type' => 'Organization',
                    'name' => 'BackgroundChecks.com',
                ],
                'alumniOf' => [
                    '@type' => 'EducationalOrganization',
                    'name' => 'Arizona State University',
                ],
                'url' => url('/'),
                'sameAs' => [
                    'https://www.linkedin.com/in/alex-nou-271323138/',
                    'https://github.com/NekoFluff',
                ],
                'knowsAbout' => [
                    'Software Engineering',
                    'Go Programming',
                    'PHP Development',
                    'TypeScript',
                    'Kubernetes',
                    'Web Development',
                    'Distributed Systems',
                    'Clean Architecture',
                ],
            ],
            'WebSite' => [
                '@context' => 'https://schema.org',
                '@type' => 'WebSite',
                'name' => 'Alex Nou - Software Engineer',
                'url' => url('/'),
                'description' => 'Software engineer portfolio showcasing projects, skills, and expertise in Go, PHP, TypeScript, and Kubernetes.',
                'author' => [
                    '@type' => 'Person',
                    'name' => 'Alex Nou',
                ],
                'inLanguage' => 'en-US',
            ],
            'ProfilePage' => [
                '@context' => 'https://schema.org',
                '@type' => 'ProfilePage',
                'mainEntity' => [
                    '@type' => 'Person',
                    'name' => 'Alex Nou',
                    'jobTitle' => 'Software Engineer',
                    'description' => 'Software Engineer at BackgroundChecks.com specializing in Go, PHP, TypeScript, and Kubernetes.',
                ],
            ],
            'ItemList' => [
                '@context' => 'https://schema.org',
                '@type' => 'ItemList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'DSP Calculator',
                        'description' => 'Dyson Sphere Program production calculator',
                        'url' => url('/projects/dsp'),
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => 'WAH Tako',
                        'description' => 'FFXIV crafting profitability calculator',
                        'url' => 'https://www.wahtako.com',
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 3,
                        'name' => 'JP Image Translator',
                        'description' => 'AI-powered Japanese image translation tool',
                        'url' => 'https://jpimagetranslator.com',
                    ],
                ],
            ],
            'BreadcrumbList' => [
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Home',
                        'item' => url('/'),
                    ],
                ],
            ],
            default => [],
        };
    }

    public function getBreadcrumbs(array $items): array
    {
        $breadcrumbs = [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => [],
        ];

        foreach ($items as $index => $item) {
            $breadcrumbs['itemListElement'][] = [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $item['name'],
                'item' => $item['url'],
            ];
        }

        return $breadcrumbs;
    }
}
