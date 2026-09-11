<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'order_code', 'customer_name', 'phone', 'address', 'city', 'notes',
        'shipping_method', 'payment_method', 'total', 'discount', 'promo_code', 'status',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }
}