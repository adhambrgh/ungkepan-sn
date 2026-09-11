<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $rows = DB::table('cart_items as c')
            ->join('products as p', 'p.id', '=', 'c.product_id')
            ->where('c.user_id', $user->id)
            ->select('c.quantity', 'c.selected',
                'p.id as product_id', 'p.name', 'p.price', 'p.image', 'p.description',
                'p.weight', 'p.stock', 'p.is_featured', 'p.category_id')
            ->orderBy('c.updated_at', 'desc')
            ->get();

        $items = $rows->map(function ($row) {
            return [
                'product' => [
                    'id' => $row->product_id,
                    'name' => $row->name,
                    'price' => (int) $row->price,
                    'image' => $row->image,
                    'description' => $row->description,
                    'weight' => $row->weight,
                    'stock' => (int) $row->stock,
                    'is_featured' => (int) $row->is_featured,
                    'category_id' => $row->category_id,
                ],
                'quantity' => (int) $row->quantity,
                'selected' => (bool) $row->selected,
            ];
        });

        return response()->json(['items' => $items]);
    }

    public function add(Request $request)
    {
        $user = $request->user();
        $productId = (int) $request->input('product_id');
        $quantity = max(1, (int) $request->input('quantity', 1));
        $selected = $request->boolean('selected', true);

        $exists = DB::table('products')->where('id', $productId)->exists();
        if (! $exists) {
            return response()->json(['error' => 'Produk tidak ditemukan'], 404);
        }

        DB::table('cart_items')->updateOrInsert(
            ['user_id' => $user->id, 'product_id' => $productId],
            ['quantity' => $quantity, 'selected' => $selected ? 1 : 0, 'updated_at' => now()]
        );

        return $this->index($request);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $productId = (int) $request->input('product_id');

        $entry = DB::table('cart_items')->where('user_id', $user->id)->where('product_id', $productId)->first();
        if (! $entry) {
            return response()->json(['error' => 'Item tidak ada di keranjang'], 404);
        }

        $data = [];
        if ($request->has('quantity')) {
            $qty = (int) $request->input('quantity');
            if ($qty < 1) {
                DB::table('cart_items')->where('user_id', $user->id)->where('product_id', $productId)->delete();
                return $this->index($request);
            }
            $data['quantity'] = $qty;
        }
        if ($request->has('selected')) {
            $data['selected'] = $request->boolean('selected') ? 1 : 0;
        }
        $data['updated_at'] = now();

        DB::table('cart_items')->where('user_id', $user->id)->where('product_id', $productId)->update($data);

        return $this->index($request);
    }

    public function remove(Request $request)
    {
        $user = $request->user();
        $productId = (int) $request->input('product_id');
        DB::table('cart_items')->where('user_id', $user->id)->where('product_id', $productId)->delete();
        return $this->index($request);
    }

    public function clear(Request $request)
    {
        DB::table('cart_items')->where('user_id', $request->user()->id)->delete();
        return response()->json(['items' => []]);
    }
}
