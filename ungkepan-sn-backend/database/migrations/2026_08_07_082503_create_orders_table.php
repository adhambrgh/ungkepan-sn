<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 20)->unique();
            $table->string('customer_name', 200);
            $table->string('phone', 20);
            $table->text('address');
            $table->string('city', 100);
            $table->text('notes')->nullable();
            $table->string('shipping_method', 50);
            $table->string('payment_method', 50);
            $table->integer('total');
            $table->enum('status', ['pending', 'processed', 'shipped', 'completed'])->default('pending');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
