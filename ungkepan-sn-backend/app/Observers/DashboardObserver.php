<?php

namespace App\Observers;

use App\Events\DashboardNeedsRefresh;

class DashboardObserver
{
    public function created($model): void
    {
        event(new DashboardNeedsRefresh());
    }

    public function updated($model): void
    {
        event(new DashboardNeedsRefresh());
    }

    public function deleted($model): void
    {
        event(new DashboardNeedsRefresh());
    }
}