<?php

namespace App\Http\Middleware;

use App\Services\SeoService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $seoService = new SeoService();

        // Determine current page from route name
        $routeName = $request->route()?->getName() ?? 'welcome';

        // Get page-specific structured data
        $additionalStructuredData = [];

        switch ($routeName) {
            case 'welcome':
                $additionalStructuredData = [
                    $seoService->getStructuredData('WebSite'),
                    $seoService->getStructuredData('ProfilePage'),
                ];
                break;
            case 'projects':
                $additionalStructuredData = [
                    $seoService->getStructuredData('ItemList'),
                    $seoService->getBreadcrumbs([
                        ['name' => 'Home', 'url' => url('/')],
                        ['name' => 'Projects', 'url' => url('/projects')],
                    ]),
                ];
                break;
            case 'dsp':
                $additionalStructuredData = [
                    $seoService->getBreadcrumbs([
                        ['name' => 'Home', 'url' => url('/')],
                        ['name' => 'Projects', 'url' => url('/projects')],
                        ['name' => 'DSP Calculator', 'url' => url('/projects/dsp')],
                    ]),
                ];
                break;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'seo' => $seoService->getSeoData($routeName),
            'structuredData' => $seoService->getStructuredData('Person'),
            'additionalStructuredData' => $additionalStructuredData,
        ];
    }
}
