<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    public $timestamps = false;

    protected $table = 'promos';

    protected $fillable = [
        'code', 'type', 'value', 'min_order', 'max_discount', 'is_active',
    ];

    protected $casts = [
        'value' => 'integer',
        'min_order' => 'integer',
        'max_discount' => 'integer',
        'is_active' => 'integer',
    ];
}
