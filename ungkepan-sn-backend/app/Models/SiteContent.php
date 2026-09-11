<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    public $timestamps = false;

    protected $table = 'site_content';

    protected $fillable = ['page', 'content'];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'updated_at' => 'datetime',
        ];
    }
}