<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentConfig extends Model
{
    public $timestamps = false;

    protected $table = 'payment_config';

    protected $fillable = [
        'method', 'label', 'account_name', 'account_number', 'bank_name',
        'qris_image', 'logo', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_active' => 'integer',
        'sort_order' => 'integer',
    ];
}