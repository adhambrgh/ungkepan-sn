<?php

namespace App\Support;

use App\Models\Order;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class MidtransService
{
    public static function configure(): void
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$clientKey = config('midtrans.client_key');
        Config::$isProduction = config('midtrans.is_production', false);
        Config::$isSanitized = config('midtrans.is_sanitized', true);
        Config::$is3ds = config('midtrans.is_3ds', true);
    }

    public static function createSnapToken(Order $order): string
    {
        self::configure();

        $params = [
            'transaction_details' => [
                'order_id' => $order->order_code,
                'gross_amount' => (int) $order->total,
            ],
            'customer_details' => [
                'first_name' => $order->customer_name,
                'phone' => $order->phone,
            ],
            'item_details' => $order->items->map(function ($item) {
                return [
                    'id' => (string) $item->product_id,
                    'price' => (int) $item->product_price,
                    'quantity' => (int) $item->quantity,
                    'name' => $item->product_name,
                ];
            })->toArray(),
        ];

        $snap = new Snap;
        $transaction = $snap->createTransaction($params);

        return $transaction->token;
    }

    public static function handleNotification(): array
    {
        self::configure();

        $notification = new Notification;

        return [
            'order_id' => $notification->order_id,
            'status_code' => $notification->status_code,
            'transaction_status' => $notification->transaction_status,
            'fraud_status' => $notification->fraud_status ?? '',
            'payment_type' => $notification->payment_type ?? '',
            'gross_amount' => $notification->gross_amount ?? '',
        ];
    }

    public static function mapStatus(string $transactionStatus, string $fraudStatus = ''): string
    {
        if ($fraudStatus === 'challenge') {
            return 'pending';
        }

        return match ($transactionStatus) {
            'capture' => 'processed',
            'settlement' => 'processed',
            'pending' => 'pending',
            'deny' => 'cancelled',
            'expire' => 'cancelled',
            'cancel' => 'cancelled',
            'refund' => 'cancelled',
            default => 'pending',
        };
    }
}
