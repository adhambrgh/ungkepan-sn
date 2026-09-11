<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('promo_id')->constrained('promos')->cascadeOnDelete();
            $table->string('order_code', 50)->nullable();
            $table->timestamp('used_at')->useCurrent();

            $table->unique(['user_id', 'promo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_usages');
    }
};
