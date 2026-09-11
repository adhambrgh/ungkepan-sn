<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Sanitize;
use App\Support\StockNotifier;
use App\Support\Upload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductAdminController extends Controller
{
    public function handle(Request $request)
    {
        $method = $request->method();

        // _method override untuk multipart (perilaku sistem lama)
        if ($method === 'POST' && $request->filled('_method')) {
            $method = strtoupper($request->input('_method'));
        }

        return match ($method) {
            'GET' => $this->index($request),
            'POST' => $this->store($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->destroy($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function index(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(1, (int) $request->input('per_page', 50)));

        $query = DB::table('products as p')
            ->select('p.*', 'c.name as category_name')
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->orderByDesc('p.created_at');

        $total = (clone $query)->count('p.id');
        $products = $query->skip(($page - 1) * $perPage)->take($perPage)->get()
            ->each(fn ($p) => $p->serving_steps = $p->serving_steps ? json_decode($p->serving_steps, true) : null);

        return response()->json([
            'data' => $products,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int) ceil($total / $perPage),
        ]);
    }

    private function store(Request $request)
    {
        $input = $request->all();

        $name = Sanitize::text($input['name'] ?? '', 200);
        if ($name === '') {
            return response()->json(['error' => 'Nama produk wajib diisi'], 422);
        }

        $price = (int) ($input['price'] ?? 0);
        $stock = (int) ($input['stock'] ?? 0);
        if ($price < 0 || $stock < 0) {
            return response()->json(['error' => 'Harga dan stok tidak boleh negatif'], 422);
        }

        $categoryId = (int) ($input['category_id'] ?? 0);
        if ($categoryId && ! DB::table('categories')->where('id', $categoryId)->exists()) {
            return response()->json(['error' => 'Kategori tidak ditemukan'], 422);
        }

        $image = Sanitize::html(! empty($input['image']) ? $input['image'] : (Upload::handle($request, 'imageFile', 'product') ?? ''), 500);

        $servingSteps = null;
        if (! empty($input['serving_steps'])) {
            $decoded = is_string($input['serving_steps']) ? json_decode($input['serving_steps'], true) : $input['serving_steps'];
            if (is_array($decoded)) {
                $servingSteps = array_values(array_filter(array_map(function ($s) {
                    $title = trim($s['title'] ?? '');
                    if ($title === '') return null;
                    return [
                        'title' => mb_substr($title, 0, 150),
                        'description' => mb_substr(trim($s['description'] ?? ''), 0, 500),
                    ];
                }, $decoded)));
            }
        }

        $id = DB::table('products')->insertGetId([
            'category_id' => $categoryId,
            'name' => $name,
            'price' => $price,
            'image' => $image,
            'description' => Sanitize::html($input['description'] ?? '', 5000),
            'weight' => Sanitize::text($input['weight'] ?? '', 50),
            'stock' => $stock,
            'is_featured' => 0,
            'serving_steps' => $servingSteps ? json_encode($servingSteps) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        StockNotifier::bump();

        return response()->json(['success' => true, 'id' => $id, 'image' => $image]);
    }

    private function update(Request $request)
    {
        $input = $request->all();

        $id = (int) ($input['id'] ?? 0);
        if (! $id) {
            return response()->json(['error' => 'ID produk required'], 400);
        }

        // Toggle featured (partial update)
        if (array_key_exists('is_featured', $input)) {
            DB::table('products')->where('id', $id)
                ->update(['is_featured' => $input['is_featured'] ? 1 : 0]);

            return response()->json(['success' => true]);
        }

        $name = Sanitize::text($input['name'] ?? '', 200);
        if ($name === '') {
            return response()->json(['error' => 'Nama produk wajib diisi'], 422);
        }

        $price = (int) ($input['price'] ?? 0);
        $stock = (int) ($input['stock'] ?? 0);
        if ($price < 0 || $stock < 0) {
            return response()->json(['error' => 'Harga dan stok tidak boleh negatif'], 422);
        }

        $categoryId = (int) ($input['category_id'] ?? 0);
        if ($categoryId && ! DB::table('categories')->where('id', $categoryId)->exists()) {
            return response()->json(['error' => 'Kategori tidak ditemukan'], 422);
        }

        // Full update
        $newImage = ! empty($input['image']) ? $input['image'] : Upload::handle($request, 'imageFile', 'product');
        if (empty($newImage)) {
            $newImage = DB::table('products')->where('id', $id)->value('image') ?? '';
        }

        $servingSteps = null;
        if (array_key_exists('serving_steps', $input)) {
            $decoded = is_string($input['serving_steps']) ? json_decode($input['serving_steps'], true) : $input['serving_steps'];
            if (is_array($decoded)) {
                $servingSteps = array_values(array_filter(array_map(function ($s) {
                    $title = trim($s['title'] ?? '');
                    if ($title === '') return null;
                    return [
                        'title' => mb_substr($title, 0, 150),
                        'description' => mb_substr(trim($s['description'] ?? ''), 0, 500),
                    ];
                }, $decoded)));
            }
            $servingSteps = json_encode($servingSteps ?: null);
        }

        $updateData = [
            'category_id' => $categoryId,
            'name' => $name,
            'price' => $price,
            'image' => Sanitize::html($newImage, 500),
            'description' => Sanitize::html($input['description'] ?? '', 5000),
            'weight' => Sanitize::text($input['weight'] ?? '', 50),
            'stock' => $stock,
            'updated_at' => now(),
        ];

        if ($servingSteps !== null) {
            $updateData['serving_steps'] = $servingSteps;
        }

        DB::table('products')->where('id', $id)->update($updateData);

        StockNotifier::bump();

        return response()->json(['success' => true]);
    }

    private function destroy(Request $request)
    {
        $id = (int) $request->input('id');

        if (! $id) {
            return response()->json(['error' => 'ID produk required'], 400);
        }

        DB::table('products')->where('id', $id)->delete();

        StockNotifier::bump();

        return response()->json(['success' => true]);
    }
}