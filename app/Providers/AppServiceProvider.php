<?php

namespace App\Providers;

use App\Http\Clients\Wanikani\WanikaniClient;
use App\Http\Clients\Wanikani\WanikaniClientInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(WanikaniClientInterface::class, WanikaniClient::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
