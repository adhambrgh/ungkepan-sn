<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavoritesController extends Controller
{
    public function index(Request $request)
    {
        $ids = DB::table('favorites')
            ->where('user_id', $request->user()->id)
            ->pluck('product_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return response()->json(['ids' => $ids]);
    }

    public function toggle(Request $request)
    {
        $user = $request->user();
        $productId = (int) $request->input('product_id');

        $exists = DB::table('products')->where('id', $productId)->exists();
        if (! $exists) {
            return response()->json(['error' => 'Produk tidak ditemukan'], 404);
        }

        $row = DB::table('favorites')->where('user_id', $user->id)->where('product_id', $productId)->first();

        if ($row) {
            DB::table('favorites')->where('id', $row->id)->delete();
        } else {
            DB::table('favorites')->insert(['user_id' => $user->id, 'product_id' => $productId, 'created_at' => now(), 'updated_at' => now()]);
        }

        return $this->index($request);
    }
}
