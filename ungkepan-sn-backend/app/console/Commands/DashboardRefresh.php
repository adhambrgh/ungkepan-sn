<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DashboardRefresh extends Command
{
    protected $signature = 'dashboard:refresh';
    protected $description = 'Refresh dashboard cache data';

    public function handle(): int
    {
        $this->info('Refreshing dashboard cache...');

        $data = [
            'total_products' => DB::table('products')->count(),
            'total_orders' => DB::table('orders')->where('status', '!=', 'pending_payment')->count(),
            'total_revenue' => DB::table('orders')
                ->whereNotIn('status', ['pending', 'pending_payment'])
                ->sum('total'),
            'pending_orders' => DB::table('orders')->where('status', 'pending')->count(),
            'processed_orders' => DB::table('orders')->where('status', 'processed')->count(),
            'shipped_orders' => DB::table('orders')->where('status', 'shipped')->count(),
            'completed_orders' => DB::table('orders')->where('status', 'completed')->count(),
            'low_stock' => json_encode(
                DB::table('products')
                    ->select('name', 'stock')
                    ->where('stock', '<', 10)
                    ->orderBy('stock')
                    ->limit(5)
                    ->get()
                    ->map(fn($r) => ['name' => $r->name, 'stock' => (int) $r->stock])
                    ->values()
            ),
            'chart_categories' => json_encode(
                DB::table('categories as c')
                    ->leftJoin('products as p', 'p.category_id', '=', 'c.id')
                    ->select('c.name', DB::raw('COUNT(p.id) as value'))
                    ->groupBy('c.id', 'c.name')
                    ->orderByDesc('value')
                    ->get()
                    ->map(fn($r) => ['name' => $r->name, 'value' => (int) $r->value])
                    ->values()
            ),
            'monthly_sales' => json_encode($this->getMonthlySales()),
            'recent_orders' => json_encode(
                DB::table('orders')
                    ->where('status', '!=', 'pending_payment')
                    ->select('order_code', 'customer_name', 'total', 'status', 'created_at')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
                    ->map(fn($r) => [
                        'order_code' => $r->order_code,
                        'customer_name' => $r->customer_name,
                        'total' => (int) $r->total,
                        'status' => $r->status,
                        'created_at' => $r->created_at,
                    ])
                    ->values()
            ),
        ];

        DB::table('dashboard_cache')->truncate();
        $data['updated_at'] = now();
        DB::table('dashboard_cache')->insert($data);

        $this->info('Dashboard cache updated successfully!');
        return 0;
    }

    private function getMonthlySales(): array
    {
        $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $startDate = now()->subMonths(11)->startOfMonth();

        $rows = DB::table('orders')
            ->selectRaw('YEAR(created_at) as yr, MONTH(created_at) as mn, COALESCE(SUM(total),0) as value, COUNT(*) as orders')
            ->whereNotIn('status', ['pending', 'pending_payment'])
            ->where('created_at', '>=', $startDate)
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()
            ->keyBy(fn($r) => $r->yr . '-' . $r->mn);

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
        return $monthlySales;
    }
}