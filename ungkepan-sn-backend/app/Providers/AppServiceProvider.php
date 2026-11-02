<?php

namespace App\Providers;

use App\Events\DashboardNeedsRefresh;
use App\Listeners\RefreshDashboardCache;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Observers\DashboardObserver;
use App\Support\MidtransService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        MidtransService::configure();

        $this->configureRateLimiting();

        // Register event listeners
        Event::listen(DashboardNeedsRefresh::class, RefreshDashboardCache::class);

        // Register observers
        Order::observe(DashboardObserver::class);
        Product::observe(DashboardObserver::class);
        Category::observe(DashboardObserver::class);
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinutes(5, 3)->by($request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            // Rate limit API sengaja di-nonaktifkan untuk pengembangan lokal.
            // Untuk produksi, batasi kembali: Limit::perMinute(300)->by($request->ip()).
            return Limit::none();
        });
    }
}
