<?php

namespace App\Http\Controllers;

use App\Models\Promo;
use App\Support\Sanitize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromoController extends Controller
{
    public function index(Request $request)
    {
        $query = Promo::where('is_active', 1);

        if ($request->has('code')) {
            $code = strtoupper(trim($request->input('code')));
            $query->whereRaw('UPPER(code) = ?', [$code]);
        }

        return response()->json($query->get());
    }

    /**
     * Cari promo berdasarkan code (case-insensitive, index-friendly).
     * Gunakan kolom generated jika ada, atau fallback ke whereRaw.
     */
    private function findByCode(string $code)
    {
        return Promo::whereRaw('UPPER(code) = ?', [$code])->first();
    }

    public function apply(Request $request)
    {
        $user = $request->user();
        $code = strtoupper(Sanitize::text($request->input('code', ''), 50));

        if ($code === '') {
            return response()->json(['error' => 'Masukkan kode promo'], 422);
        }

        $promo = $this->findByCode($code);

        if (! $promo) {
            return response()->json(['error' => 'Kode promo tidak valid'], 404);
        }

        $alreadyUsed = DB::table('promo_usages')
            ->where('user_id', $user->id)
            ->where('promo_id', $promo->id)
            ->exists();

        if ($alreadyUsed) {
            return response()->json(['error' => 'Kode promo sudah pernah kamu pakai'], 422);
        }

        $subtotal = max(0, (int) $request->input('subtotal', 0));

        if ($subtotal < (int) $promo->min_order) {
            return response()->json([
                'error' => 'Min. belanja Rp ' . number_format((int) $promo->min_order, 0, ',', '.') . ' untuk kode ini',
            ], 422);
        }

        $amount = $promo->type === 'percent'
            ? (int) round($subtotal * ((int) $promo->value / 100))
            : (int) $promo->value;

        if ($promo->type === 'percent' && (int) $promo->max_discount > 0) {
            $amount = min($amount, (int) $promo->max_discount);
        }

        $amount = min($amount, $subtotal);

        return response()->json([
            'success' => true,
            'amount' => $amount,
            'code' => $promo->code,
            'type' => $promo->type,
            'value' => (int) $promo->value,
            'min_order' => (int) $promo->min_order,
            'max_discount' => (int) $promo->max_discount,
        ]);
    }

    public function use(Request $request)
    {
        $user = $request->user();
        $code = strtoupper(Sanitize::text($request->input('code', ''), 50));
        $orderCode = Sanitize::text($request->input('order_code', ''), 50);

        if ($code === '' || $orderCode === '') {
            return response()->json(['error' => 'Kode promo dan kode pesanan wajib diisi'], 422);
        }

        $promo = $this->findByCode($code);

        if (! $promo) {
            return response()->json(['error' => 'Kode promo tidak valid'], 404);
        }

        $exists = DB::table('promo_usages')
            ->where('user_id', $user->id)
            ->where('promo_id', $promo->id)
            ->exists();

        if (! $exists) {
            DB::table('promo_usages')->insert([
                'user_id' => $user->id,
                'promo_id' => $promo->id,
                'order_code' => $orderCode ?: null,
                'used_at' => now(),
            ]);
        }

        return response()->json(['success' => true]);
    }
}
