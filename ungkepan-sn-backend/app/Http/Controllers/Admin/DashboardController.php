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
        $totalOrders = DB::table('orders')->count();
        $totalRevenue = DB::table('orders')
            ->where('status', '!=', 'pending')
            ->sum('total');

        $pendingOrders = DB::table('orders')->where('status', 'pending')->count();
        $processedOrders = DB::table('orders')->where('status', 'processed')->count();
        $shippedOrders = DB::table('orders')->where('status', 'shipped')->count();
        $completedOrders = DB::table('orders')->where('status', 'completed')->count();

        $recentOrders = DB::table('orders')
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
            ->where('status', '!=', 'pending')
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
}