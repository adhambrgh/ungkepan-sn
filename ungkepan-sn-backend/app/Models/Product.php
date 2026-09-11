<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'price', 'image', 'description',
        'weight', 'stock', 'is_featured', 'serving_steps',
    ];

    protected $casts = [
        'is_featured' => 'integer',
        'stock' => 'integer',
        'price' => 'integer',
        'serving_steps' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'product_id');
    }
}