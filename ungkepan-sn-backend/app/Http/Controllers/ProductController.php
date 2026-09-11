<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    private const ICON_MAP = [
        'Kue Kering' => 'Cookie',
        'Minuman' => 'Coffee',
        'Camilan' => 'BowlFood',
        'Kue Basah' => 'Cake',
    ];

    public function index(Request $request)
    {
        $id = $request->input('id');
        $featured = $request->input('featured');

        // Detail satu produk
        if ($id) {
            $product = DB::table('products as p')
                ->select('p.*', 'c.name as category_name',
                    DB::raw('COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating'),
                    DB::raw('COUNT(r.id) as review_count'))
                ->join('categories as c', 'c.id', '=', 'p.category_id')
                ->leftJoin('reviews as r', function ($join) {
                    $join->on('r.product_id', '=', 'p.id')->where('r.is_approved', '=', 1);
                })
                ->where('p.id', $id)
                ->groupBy('p.id')
                ->first();

            if ($product) {
                $product->serving_steps = $product->serving_steps ? json_decode($product->serving_steps, true) : null;
                return response()->json($product);
            }

            return response()->json(['error' => 'Produk tidak ditemukan'], 404);
        }

        // Produk unggulan
        if ($featured === '1') {
            $products = DB::table('products as p')
                ->select('p.*', 'c.name as category_name',
                    DB::raw('COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating'),
                    DB::raw('COUNT(r.id) as review_count'))
                ->join('categories as c', 'c.id', '=', 'p.category_id')
                ->leftJoin('reviews as r', function ($join) {
                    $join->on('r.product_id', '=', 'p.id')->where('r.is_approved', '=', 1);
                })
                ->where('p.is_featured', 1)
                ->groupBy('p.id')
                ->orderByDesc('p.created_at')
                ->get()
                ->each(fn ($p) => $p->serving_steps = $p->serving_steps ? json_decode($p->serving_steps, true) : null);

            return response()->json($products);
        }

        // Daftar semua produk (dengan pagination)
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(1, (int) $request->input('per_page', 20)));

        $query = DB::table('products as p')
            ->select('p.*', 'c.name as category_name',
                DB::raw('COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating'),
                DB::raw('COUNT(r.id) as review_count'))
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->leftJoin('reviews as r', function ($join) {
                $join->on('r.product_id', '=', 'p.id')->where('r.is_approved', '=', 1);
            })
            ->groupBy('p.id')
            ->orderByDesc('p.created_at');

        $total = (clone $query)->count('p.id');
        $products = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        $result = $products->map(function ($p) {
            $p->category_icon = self::ICON_MAP[$p->category_name] ?? 'Package';
            $p->serving_steps = $p->serving_steps ? json_decode($p->serving_steps, true) : null;
            return $p;
        });

        return response()->json([
            'data' => $result,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int) ceil($total / $perPage),
        ]);
    }
}