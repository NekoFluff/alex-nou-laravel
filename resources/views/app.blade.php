<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- SEO Meta Tags -->
    <meta name="description"
        content="{{ $page['props']['seo']['description'] ?? 'Alex Nou - Software Engineer & Developer Portfolio' }}">
    <meta name="keywords"
        content="{{ $page['props']['seo']['keywords'] ?? 'software engineer, developer, portfolio, projects, web development' }}">
    <meta name="author" content="{{ $page['props']['seo']['author'] ?? 'Alex Nou' }}">
    <meta name="robots" content="{{ $page['props']['seo']['robots'] ?? 'index, follow' }}">
    <link rel="canonical" href="{{ $page['props']['seo']['canonical'] ?? url()->current() }}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="{{ $page['props']['seo']['og_type'] ?? 'website' }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $page['props']['seo']['og_title'] ?? config('app.name', 'Laravel') }}">
    <meta property="og:description"
        content="{{ $page['props']['seo']['og_description'] ?? 'Alex Nou - Software Engineer & Developer Portfolio' }}">
    <meta property="og:image" content="{{ $page['props']['seo']['og_image'] ?? asset('images/og-image.jpg') }}">
    <meta property="og:site_name" content="{{ config('app.name', 'Laravel') }}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{{ url()->current() }}">
    <meta name="twitter:title" content="{{ $page['props']['seo']['twitter_title'] ?? config('app.name', 'Laravel') }}">
    <meta name="twitter:description"
        content="{{ $page['props']['seo']['twitter_description'] ?? 'Alex Nou - Software Engineer & Developer Portfolio' }}">
    <meta name="twitter:image" content="{{ $page['props']['seo']['twitter_image'] ?? asset('images/og-image.jpg') }}">

    <!-- Additional SEO -->
    <meta name="theme-color" content="#ffffff">
    <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="{{ url('/feed') }}">

    <!-- Structured Data (JSON-LD) -->
    @if (isset($page['props']['structuredData']))
        <script type="application/ld+json">
                {!! json_encode($page['props']['structuredData']) !!}
            </script>
    @endif

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @vite(['resources/js/app.ts', "resources/js/Pages/{$page['component']}.vue"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
