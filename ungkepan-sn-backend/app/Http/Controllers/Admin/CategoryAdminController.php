<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Sanitize;
use App\Support\Upload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryAdminController extends Controller
{
    private function makeSlug(string $name): string
    {
        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower(trim($name)));
        $slug = trim($slug, '-');

        return $slug ?: 'untitled';
    }

    public function handle(Request $request)
    {
        $method = $request->method();

        if ($method === 'POST' && $request->filled('_method')) {
            $method = strtoupper($request->input('_method'));
        }

        return match ($method) {
            'GET' => $this->index(),
            'POST' => $this->store($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->destroy($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function index()
    {
        $rows = DB::table('categories')
            ->select('id', 'name', 'icon', 'image', 'created_at')
            ->orderBy('id')
            ->get()
            ->map(function ($row) {
                $row->slug = $this->makeSlug($row->name);

                return $row;
            });

        return response()->json($rows);
    }

    private function store(Request $request)
    {
        $name = Sanitize::text($request->input('name', ''), 100);
        if ($name === '') {
            return response()->json(['error' => 'Nama kategori wajib diisi'], 400);
        }

        $icon = Sanitize::text($request->input('icon', 'Cookie'), 50);
        $image = Sanitize::html($request->input('image', ''), 500) ?: (Upload::handle($request, 'imageFile', 'category') ?? '');

        $id = DB::table('categories')->insertGetId([
            'name' => $name,
            'slug' => '',
            'icon' => $icon,
            'image' => $image,
            'created_at' => now(),
        ]);

        return response()->json([
            'id' => $id,
            'name' => $name,
            'slug' => $this->makeSlug($name),
            'icon' => $icon,
            'image' => $image,
        ]);
    }

    private function update(Request $request)
    {
        $id = (int) $request->input('id', 0);
        $name = Sanitize::text($request->input('name', ''), 100);

        if (! $id || $name === '') {
            return response()->json(['error' => 'ID dan nama kategori wajib diisi'], 400);
        }

        $icon = $request->has('icon') ? Sanitize::text($request->input('icon'), 50) : null;
        $newImage = Sanitize::html($request->input('image', ''), 500) ?: (Upload::handle($request, 'imageFile', 'category'));

        $fields = ['name' => $name];
        if ($icon !== null) {
            $fields['icon'] = $icon;
        }
        if ($newImage) {
            $fields['image'] = $newImage;
        }

        DB::table('categories')->where('id', $id)->update($fields);

        return response()->json([
            'id' => $id,
            'name' => $name,
            'slug' => $this->makeSlug($name),
        ]);
    }

    private function destroy(Request $request)
    {
        $id = (int) $request->input('id', 0);

        if (! $id) {
            return response()->json(['error' => 'ID kategori wajib diisi'], 400);
        }

        $count = DB::table('products')->where('category_id', $id)->count();
        if ($count > 0) {
            return response()->json(['error' => 'Kategori masih memiliki produk, tidak bisa dihapus'], 400);
        }

        DB::table('categories')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }
}