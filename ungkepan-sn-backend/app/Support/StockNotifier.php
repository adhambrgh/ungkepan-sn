<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class StockNotifier
{
    private const VERSION_KEY = 'product_stock_version';

    /**
     * Naikkan versi stok. Endpoint SSE membaca versi ini dan mengirim
     * snapshot stok ke semua browser yang terhubung saat versinya berubah.
     */
    public static function bump(): void
    {
        if (Cache::has(self::VERSION_KEY)) {
            Cache::increment(self::VERSION_KEY);
        } else {
            Cache::forever(self::VERSION_KEY, 1);
        }
        Cache::forget('stock_snapshot');
    }
}