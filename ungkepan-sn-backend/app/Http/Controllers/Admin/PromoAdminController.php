<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use App\Support\Sanitize;
use Illuminate\Http\Request;

class PromoAdminController extends Controller
{
    public function handle(Request $request)
    {
        return match ($request->method()) {
            'GET' => $this->index(),
            'POST' => $this->store($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->destroy($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function index()
    {
        $promos = Promo::orderBy('id', 'desc')->get();

        return response()->json($promos);
    }

    private function store(Request $request)
    {
        $code = strtoupper(Sanitize::text($request->input('code', ''), 50));

        if ($code === '') {
            return response()->json(['error' => 'Kode promo wajib diisi'], 400);
        }

        if (Promo::where('code', $code)->exists()) {
            return response()->json(['error' => 'Kode promo sudah ada'], 400);
        }

        $type = in_array(Sanitize::text($request->input('type'), 20), ['fixed', 'percent'], true) ? Sanitize::text($request->input('type'), 20) : 'fixed';
        $value = max(0, (int) $request->input('value', 0));

        if ($value <= 0) {
            return response()->json(['error' => 'Nilai diskon harus lebih dari 0'], 400);
        }

        $promo = Promo::create([
            'code' => $code,
            'type' => $type,
            'value' => $value,
            'min_order' => max(0, (int) $request->input('min_order', 0)),
            'max_discount' => max(0, (int) $request->input('max_discount', 0)),
            'is_active' => $request->input('is_active', 1) ? 1 : 0,
        ]);

        return response()->json(['success' => true, 'id' => $promo->id]);
    }

    private function update(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID required'], 400);
        }

        $promo = Promo::find($id);
        if (! $promo) {
            return response()->json(['error' => 'Promo tidak ditemukan'], 404);
        }

        $code = strtoupper(Sanitize::text($request->input('code', ($promo->code ?? '')), 50));
        if ($code === '') {
            return response()->json(['error' => 'Kode promo wajib diisi'], 400);
        }

        $duplicate = Promo::where('code', $code)->where('id', '!=', $id)->exists();
        if ($duplicate) {
            return response()->json(['error' => 'Kode promo sudah ada'], 400);
        }

        $type = in_array(Sanitize::text($request->input('type', ($promo->type ?? 'fixed')), 20), ['fixed', 'percent'], true)
            ? Sanitize::text($request->input('type'), 20)
            : ($promo->type ?? 'fixed');
        $value = max(0, (int) $request->input('value', $promo->value));

        if ($value <= 0) {
            return response()->json(['error' => 'Nilai diskon harus lebih dari 0'], 400);
        }

        $promo->update([
            'code' => $code,
            'type' => $type,
            'value' => $value,
            'min_order' => max(0, (int) $request->input('min_order', $promo->min_order)),
            'max_discount' => max(0, (int) $request->input('max_discount', $promo->max_discount)),
            'is_active' => ($request->input('is_active', $promo->is_active) ? 1 : 0),
        ]);

        return response()->json(['success' => true]);
    }

    private function destroy(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID required'], 400);
        }

        Promo::where('id', $id)->delete();

        return response()->json(['success' => true]);
    }
}
