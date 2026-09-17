<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $totalProducts = DB::table('products')->count();
        $totalOrders = DB::table('orders')->where('status', '!=', 'pending_payment')->count();
        $totalRevenue = DB::table('orders')
            ->whereNotIn('status', ['pending', 'pending_payment'])
            ->sum('total');

        $pendingOrders = DB::table('orders')->where('status', 'pending')->count();
        $processedOrders = DB::table('orders')->where('status', 'processed')->count();
        $shippedOrders = DB::table('orders')->where('status', 'shipped')->count();
        $completedOrders = DB::table('orders')->where('status', 'completed')->count();

        $recentOrders = DB::table('orders')
            ->where('status', '!=', 'pending_payment')
            ->select('order_code', 'customer_name', 'total', 'status', 'created_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $lowStock = DB::table('products')
            ->select('name', 'stock')
            ->where('stock', '<', 10)
            ->orderBy('stock')
            ->limit(5)
            ->get();

        // Distribusi produk per kategori (untuk donut chart)
        $chartCategories = DB::table('categories as c')
            ->leftJoin('products as p', 'p.category_id', '=', 'c.id')
            ->select('c.name', DB::raw('COUNT(p.id) as value'))
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('value')
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'value' => (int) $r->value])
            ->values();

        // Penjualan & jumlah pesanan 12 bulan terakhir — 1 query GROUP BY
        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $startDate = now()->subMonths(11)->startOfMonth();
        $rows = DB::table('orders')
            ->selectRaw('YEAR(created_at) as yr, MONTH(created_at) as mn, COALESCE(SUM(total),0) as value, COUNT(*) as orders')
            ->whereNotIn('status', ['pending', 'pending_payment'])
            ->where('created_at', '>=', $startDate)
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()
            ->keyBy(fn ($r) => $r->yr . '-' . $r->mn);

        $monthlySales = [];
        for ($i = 11; $i >= 0; $i--) {
            $d = now()->subMonths($i);
            $key = $d->year . '-' . $d->month;
            $row = $rows->get($key);
            $monthlySales[] = [
                'month' => $monthLabels[$d->month - 1],
                'value' => $row ? (int) $row->value : 0,
                'orders' => $row ? (int) $row->orders : 0,
            ];
        }

        return response()->json([
            'total_products' => (int) $totalProducts,
            'total_orders' => (int) $totalOrders,
            'total_revenue' => (int) $totalRevenue,
            'pending_orders' => (int) $pendingOrders,
            'processed_orders' => (int) $processedOrders,
            'shipped_orders' => (int) $shippedOrders,
            'completed_orders' => (int) $completedOrders,
            'recent_orders' => $recentOrders,
            'low_stock' => $lowStock,
            'chart_categories' => $chartCategories,
            'monthly_sales' => $monthlySales,
        ]);
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