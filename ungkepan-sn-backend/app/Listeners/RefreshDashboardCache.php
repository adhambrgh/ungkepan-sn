<?php

namespace App\Listeners;

use App\Events\DashboardNeedsRefresh;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RefreshDashboardCache implements ShouldQueue
{
    public function handle(DashboardNeedsRefresh $event): void
    {
        \Illuminate\Support\Facades\Artisan::call('dashboard:refresh');
    }
}