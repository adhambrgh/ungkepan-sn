<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StockStreamController extends Controller
{
    public function snapshot(Request $request)
    {
        $version = (int) Cache::get('product_stock_version', 0);

        $products = Cache::remember('stock_snapshot', 5, function () {
            return DB::table('products')
                ->select('id', 'stock')
                ->orderBy('id')
                ->get()
                ->map(fn ($p) => ['id' => (int) $p->id, 'stock' => (int) $p->stock])
                ->values();
        });

        return response()->json([
            'type' => 'stock',
            'version' => $version,
            'products' => $products,
        ]);
    }

    public function stream(Request $request)
    {
        set_time_limit(0);
        ini_set('output_buffering', 'off');

        $versionKey = 'product_stock_version';
        $sentVersion = null;
        $lastPing = 0;

        return response()->eventStream(function () use ($versionKey, &$sentVersion, &$lastPing) {
            while (true) {
                if (connection_aborted()) {
                    break;
                }

                $now = time();
                $version = (int) Cache::get($versionKey, 0);

                if ($sentVersion === null || $version !== $sentVersion) {
                    $sentVersion = $version;

                    $products = Cache::remember('stock_snapshot', 5, function () {
                        return DB::table('products')
                            ->select('id', 'stock')
                            ->orderBy('id')
                            ->get()
                            ->map(fn ($p) => ['id' => (int) $p->id, 'stock' => (int) $p->stock])
                            ->values();
                    });

                    yield json_encode([
                        'type' => 'stock',
                        'version' => $version,
                        'products' => $products,
                    ], JSON_UNESCAPED_UNICODE);

                    $lastPing = $now;
                    continue;
                }

                // Keep-alive (SSE connection idle lama bisa diputus proxy)
                if ($now - $lastPing >= 15) {
                    $lastPing = $now;
                    yield json_encode(['type' => 'ping']);
                }

                sleep(1);
            }
        });
    }
}