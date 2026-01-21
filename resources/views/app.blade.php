<!DOCTYPE html>
<html lang="en-US" prefix="og: https://ogp.me/ns#">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- DNS Prefetch for Performance -->
    <link rel="dns-prefetch" href="//fonts.bunny.net">
    <link rel="dns-prefetch" href="//www.google-analytics.com">

    <!-- Preconnect for Performance -->
    <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>

    <!-- SEO Meta Tags -->
    <meta name="description"
        content="{{ $page['props']['seo']['description'] ?? 'Alex Nou - Software Engineer at BackgroundChecks.com specializing in Go, PHP, TypeScript, and Docker.' }}">
    <meta name="keywords"
        content="{{ $page['props']['seo']['keywords'] ?? 'Alex Nou, software engineer, Go developer, PHP developer, TypeScript, Docker, web development' }}">
    <meta name="author" content="{{ $page['props']['seo']['author'] ?? 'Alex Nou' }}">
    <meta name="robots" content="{{ $page['props']['seo']['robots'] ?? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' }}">
    <link rel="canonical" href="{{ $page['props']['seo']['canonical'] ?? url()->current() }}">

    <!-- Geographic and Language Tags -->
    <meta name="geo.region" content="US">
    <meta name="language" content="English">
    <meta name="revisit-after" content="7 days">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="{{ $page['props']['seo']['og_type'] ?? 'website' }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $page['props']['seo']['og_title'] ?? $page['props']['seo']['title'] ?? config('app.name', 'Laravel') }}">
    <meta property="og:description"
        content="{{ $page['props']['seo']['og_description'] ?? $page['props']['seo']['description'] ?? 'Alex Nou - Software Engineer & Developer' }}">
    <meta property="og:image" content="{{ $page['props']['seo']['og_image'] ?? asset('images/og-image.jpg') }}">
    <meta property="og:site_name" content="Alex Nou - Software Engineer">
    <meta property="og:locale" content="{{ $page['props']['seo']['og_locale'] ?? 'en_US' }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Alex Nou - Software Engineer Portfolio">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{{ url()->current() }}">
    <meta name="twitter:title" content="{{ $page['props']['seo']['twitter_title'] ?? $page['props']['seo']['title'] ?? config('app.name', 'Laravel') }}">
    <meta name="twitter:description"
        content="{{ $page['props']['seo']['twitter_description'] ?? $page['props']['seo']['description'] ?? 'Alex Nou - Software Engineer & Developer' }}">
    <meta name="twitter:image" content="{{ $page['props']['seo']['twitter_image'] ?? asset('images/og-image.jpg') }}">
    <meta name="twitter:image:alt" content="Alex Nou - Software Engineer Portfolio">
    <meta name="twitter:creator" content="@alexnou">
    <meta name="twitter:site" content="@alexnou">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('favicon.png') }}">
    <link rel="icon" type="image/png" sizes="512x512" href="{{ asset('favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('favicon.png') }}">
    <link rel="manifest" href="{{ asset('site.webmanifest') }}">

    <!-- Additional SEO -->
    <meta name="theme-color" content="#ffffff">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="format-detection" content="telephone=no">

    <!-- Structured Data (JSON-LD) -->
    @if (isset($page['props']['structuredData']))
        <script type="application/ld+json">
            {!! json_encode($page['props']['structuredData'], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
        </script>
    @endif

    @if (isset($page['props']['additionalStructuredData']))
        @foreach($page['props']['additionalStructuredData'] as $structuredData)
            <script type="application/ld+json">
                {!! json_encode($structuredData, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
            </script>
        @endforeach
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
