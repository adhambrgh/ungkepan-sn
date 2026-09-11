<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewAdminController extends Controller
{
    public function handle(Request $request)
    {
        return match ($request->method()) {
            'GET' => $this->index($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->destroy($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function index(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(1, (int) $request->input('per_page', 50)));

        $query = DB::table('reviews as r')
            ->select('r.*', 'p.name as product_name', 'p.category_id', 'c.name as category_name')
            ->leftJoin('products as p', 'r.product_id', '=', 'p.id')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->orderByDesc('r.created_at');

        $total = (clone $query)->count('r.id');
        $reviews = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'data' => $reviews,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int) ceil($total / $perPage),
        ]);
    }

    private function update(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID review required'], 400);
        }

        if (array_key_exists('is_approved', $request->all())) {
            DB::table('reviews')->where('id', $id)
                ->update(['is_approved' => $request->input('is_approved') ? 1 : 0]);

            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Field tidak dikenal'], 400);
    }

    private function destroy(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'Review ID required'], 400);
        }

        DB::table('reviews')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }
}