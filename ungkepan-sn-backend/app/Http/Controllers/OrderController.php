<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Support\MidtransService;
use App\Support\Sanitize;
use App\Support\StockNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $phone = $request->input('phone');
        $user = $request->user();

        $query = Order::with('items')
            ->where('status', '!=', 'pending_payment')
            ->orderByDesc('created_at');

        if ($user) {
            $query->where('user_id', $user->id);
        } elseif ($phone) {
            $query->where('phone', $phone);
        }

        $orders = $query->get();

        return response()->json($orders);
    }

    public function confirmReceived(Request $request)
    {
        $user = $request->user();
        $code = Sanitize::text($request->input('order_code', ''), 50);

        if ($code === '') {
            return response()->json(['error' => 'Kode pesanan wajib diisi'], 422);
        }

        $order = Order::where('order_code', $code)->first();

        if (! $order) {
            return response()->json(['error' => 'Pesanan tidak ditemukan'], 404);
        }

        if ($user->phone && $order->phone !== $user->phone) {
            return response()->json(['error' => 'Pesanan ini bukan milik kamu'], 403);
        }

        $isPickup = $order->shipping_method === 'ambil';
        $canConfirm = $order->status === 'processed';

        if (! $canConfirm) {
            return response()->json(['error' => 'Pesanan belum bisa dikonfirmasi diterima'], 422);
        }

        $order->update(['status' => 'completed']);

        return response()->json(['success' => true]);
    }

    public function store(Request $request)
    {
        $input = $request->json()->all();

        if (empty($input['items']) || ! is_array($input['items'])) {
            return response()->json(['error' => 'Data pesanan tidak lengkap'], 400);
        }

        $shippingMethods = ['ambil', 'lokal', 'jne', 'jnt', 'gosend'];
        $shippingMethod = Sanitize::text($input['shipping_method'] ?? 'ambil', 50);
        if (! in_array($shippingMethod, $shippingMethods, true)) {
            return response()->json(['error' => 'Metode pengiriman tidak valid'], 422);
        }

        $paymentMethod = Sanitize::text($input['payment_method'] ?? '', 50);
        if ($paymentMethod === '') {
            return response()->json(['error' => 'Metode pembayaran tidak valid'], 422);
        }

        $orderCode = 'WM-' . strtoupper(substr(base_convert((string) time(), 10, 36), -6));
        $paymentMethodLower = strtolower($paymentMethod);
        $isMidtrans = str_contains($paymentMethodLower, 'midtrans')
            || str_contains($paymentMethodLower, 'snap')
            || str_contains($paymentMethodLower, 'online');

        $user = $request->user();

        try {
            DB::beginTransaction();

            // Hitung ulang semua harga dari database — jangan percaya harga/quantity dari client.
            $items = [];
            $serverTotal = 0;
            $promoCode = Sanitize::text($input['promo_code'] ?? '', 50) ?: null;

            foreach ($input['items'] as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 0);

                if (! $productId || $quantity < 1) {
                    throw new \Exception('Item pesanan tidak valid');
                }

                $product = DB::table('products')->where('id', $productId)->lockForUpdate()->first();

                if (! $product) {
                    throw new \Exception('Produk tidak ditemukan');
                }

                if ($product->stock < $quantity) {
                    throw new \Exception(
                        "Stok '{$product->name}' tidak mencukupi. Sisa: " . $product->stock
                    );
                }

                DB::table('products')->where('id', $productId)->decrement('stock', $quantity);

                $subtotal = (int) $product->price * $quantity;
                $serverTotal += $subtotal;

                $items[] = [
                    'product_id' => $productId,
                    'product_name' => Sanitize::text($product->name, 200),
                    'product_price' => (int) $product->price,
                    'quantity' => $quantity,
                ];
            }

            // Discount hanya boleh berasal dari promo yang sudah tervalidasi.
            $discount = 0;
            if ($promoCode) {
                $promo = DB::table('promos')
                    ->where('is_active', 1)
                    ->whereRaw('UPPER(code) = ?', [strtoupper($promoCode)])
                    ->first();

                if ($promo && $serverTotal >= (int) $promo->min_order) {
                    $raw = $promo->type === 'percent'
                        ? $serverTotal * ((int) $promo->value / 100)
                        : (int) $promo->value;
                    $discount = (int) min($raw, (int) $promo->max_discount ?: PHP_INT_MAX, $serverTotal);
                } else {
                    $promoCode = null;
                }
            }

            $order = Order::create([
                'user_id' => $user ? $user->id : null,
                'order_code' => $orderCode,
                'customer_name' => Sanitize::text($input['customer_name'] ?? '', 200),
                'phone' => Sanitize::text($input['phone'] ?? '', 20),
                'address' => Sanitize::html($input['address'] ?? '', 1000),
                'city' => Sanitize::text($input['city'] ?? '', 100),
                'notes' => Sanitize::html($input['notes'] ?? '', 1000),
                'shipping_method' => $shippingMethod,
                'payment_method' => $paymentMethod,
                'total' => max(0, $serverTotal - $discount),
                'discount' => $discount,
                'promo_code' => $promoCode,
                'status' => $isMidtrans ? 'pending_payment' : 'pending',
            ]);

            foreach ($items as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'product_name' => $itemData['product_name'],
                    'product_price' => $itemData['product_price'],
                    'quantity' => $itemData['quantity'],
                ]);
            }

            DB::commit();

            // Stok sudah berkurang — beri tahu browser yang subscribe SSE
            StockNotifier::bump();

            // Generate Snap token jika payment method adalah Midtrans
            $snapToken = null;

            if ($isMidtrans) {
                try {
                    $order->load('items');
                    $snapToken = MidtransService::createSnapToken($order);
                } catch (\Exception $e) {
                    // Snap token gagal, tetap lanjut (order sudah tersimpan)
                }
            }

            return response()->json([
                'success' => true,
                'order_code' => $orderCode,
                'id' => $order->id,
                'snap_token' => $snapToken,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Gagal menyimpan pesanan: ' . $e->getMessage()], 400);
        }
    }

    public function getSnapToken(Request $request)
    {
        $orderCode = Sanitize::text($request->input('order_code'), 50);

        if (! $orderCode) {
            return response()->json(['error' => 'order_code wajib diisi'], 422);
        }

        $order = Order::where('order_code', $orderCode)->with('items')->first();

        if (! $order) {
            return response()->json(['error' => 'Pesanan tidak ditemukan'], 404);
        }

        if ($order->status !== 'pending_payment') {
            return response()->json(['error' => 'Pesanan sudah diproses atau dibatalkan'], 422);
        }

        try {
            $snapToken = MidtransService::createSnapToken($order);

            return response()->json(['snap_token' => $snapToken]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membuat token pembayaran: ' . $e->getMessage()], 500);
        }
    }

    public function destroyPendingOrder(Request $request)
    {
        $orderCode = Sanitize::text($request->input('order_code'), 50);

        if (! $orderCode) {
            return response()->json(['error' => 'order_code wajib diisi'], 422);
        }

        $order = Order::where('order_code', $orderCode)->first();

        if (! $order || $order->status !== 'pending_payment') {
            return response()->json(['error' => 'Pesanan tidak ditemukan atau sudah diproses'], 404);
        }

        // Kembalikan stok
        foreach ($order->items as $item) {
            DB::table('products')->where('id', $item->product_id)->increment('stock', $item->quantity);
        }

        // Hapus order
        $order->delete();

        // Notifikasi stok
        \App\Support\StockNotifier::bump();

        return response()->json(['success' => true]);
    }

    public function handleCallback(Request $request)
    {
        try {
            $data = MidtransService::handleNotification();

            $order = Order::where('order_code', $data['order_id'])->first();

            if (! $order) {
                return response()->json(['status' => 'order_not_found']);
            }

            $newStatus = MidtransService::mapStatus(
                $data['transaction_status'],
                $data['fraud_status']
            );

            if ($newStatus === 'cancelled' && in_array($order->status, ['processed', 'completed'])) {
                return response()->json(['status' => 'ignored']);
            }

            $order->update(['status' => $newStatus]);

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}