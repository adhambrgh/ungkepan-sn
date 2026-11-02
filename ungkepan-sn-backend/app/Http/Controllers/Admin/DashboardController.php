<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $cache = DB::table('dashboard_cache')->first();

        if (!$cache) {
            \Illuminate\Support\Facades\Artisan::call('dashboard:refresh');
            $cache = DB::table('dashboard_cache')->first();
        }

        return response()->json([
            'total_products' => (int) $cache->total_products,
            'total_orders' => (int) $cache->total_orders,
            'total_revenue' => (int) $cache->total_revenue,
            'pending_orders' => (int) $cache->pending_orders,
            'processed_orders' => (int) $cache->processed_orders,
            'shipped_orders' => (int) $cache->shipped_orders,
            'completed_orders' => (int) $cache->completed_orders,
            'recent_orders' => json_decode($cache->recent_orders, true),
            'low_stock' => json_decode($cache->low_stock, true),
            'chart_categories' => json_decode($cache->chart_categories, true),
            'monthly_sales' => json_decode($cache->monthly_sales, true),
        ]);
    }

    public function refresh(Request $request)
    {
        \Illuminate\Support\Facades\Artisan::call('dashboard:refresh');
        return response()->json(['success' => true, 'message' => 'Dashboard refreshed']);
    }

    public function detail(Request $request)
    {
        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $startDate = now()->subMonths(11)->startOfMonth();

        // Ambil semua order_items + info pesanan (12 bulan terakhir, status bukan pending)
        $items = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->selectRaw('YEAR(o.created_at) as yr, MONTH(o.created_at) as mn, oi.product_name, oi.product_price, oi.quantity')
            ->where('o.status', '!=', 'pending')
            ->where('o.created_at', '>=', $startDate)
            ->orderByRaw('o.created_at DESC, oi.product_name')
            ->get();

        // Bangun monthly_detail: array 12 bulan, masing-masing punya products[]
        $monthly = [];
        $monthIndex = [];
        for ($i = 11; $i >= 0; $i--) {
            $d = now()->subMonths($i);
            $key = $d->year . '-' . $d->month;
            $monthIndex[$key] = $i;
            $monthly[] = [
                'month' => $monthLabels[$d->month - 1],
                'year' => $d->year,
                'orders_count' => 0,
                'qty' => 0,
                'revenue' => 0,
                'products' => [],
            ];
        }

        // Hitung jumlah order per bulan (dari tabel orders langsung)
        $ordersPerMonth = DB::table('orders')
            ->selectRaw('YEAR(created_at) as yr, MONTH(created_at) as mn, COUNT(*) as cnt')
            ->whereNotIn('status', ['pending', 'pending_payment'])
            ->where('created_at', '>=', $startDate)
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->get();

        foreach ($ordersPerMonth as $row) {
            $key = $row->yr . '-' . $row->mn;
            if (isset($monthIndex[$key])) {
                $monthly[$monthIndex[$key]]['orders_count'] = (int) $row->cnt;
            }
        }

        // Isi products per bulan
        foreach ($items as $item) {
            $key = $item->yr . '-' . $item->mn;
            if (!isset($monthIndex[$key])) continue;
            $idx = $monthIndex[$key];
            $lineTotal = (int) $item->product_price * (int) $item->quantity;

            $monthly[$idx]['qty'] += (int) $item->quantity;
            $monthly[$idx]['revenue'] += $lineTotal;

            // Cari produk yang sudah ada di bulan ini
            $found = false;
            foreach ($monthly[$idx]['products'] as &$p) {
                if ($p['product_name'] === $item->product_name) {
                    $p['qty'] += (int) $item->quantity;
                    $p['revenue'] += $lineTotal;
                    $found = true;
                    break;
                }
            }
            unset($p);
            if (!$found) {
                $monthly[$idx]['products'][] = [
                    'product_name' => $item->product_name,
                    'qty' => (int) $item->quantity,
                    'price' => (int) $item->product_price,
                    'revenue' => $lineTotal,
                ];
            }
        }

        // Riwayat keluar: semua order_items (simplified) — tanpa filter bulan
        $outgoing = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->selectRaw('DATE(o.created_at) as date, o.order_code, oi.product_name, oi.product_price as price, oi.quantity, (oi.product_price * oi.quantity) as total')
            ->where('o.status', '!=', 'pending')
            ->orderByRaw('o.created_at DESC')
            ->get();

        return response()->json([
            'monthly_detail' => $monthly,
            'outgoing_history' => $outgoing,
        ]);
    }
}