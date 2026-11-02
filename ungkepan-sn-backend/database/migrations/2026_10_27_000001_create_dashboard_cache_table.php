<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dashboard_cache', function (Blueprint $table) {
            $table->id();
            $table->integer('total_products')->default(0);
            $table->integer('total_orders')->default(0);
            $table->integer('total_revenue')->default(0);
            $table->integer('pending_orders')->default(0);
            $table->integer('processed_orders')->default(0);
            $table->integer('shipped_orders')->default(0);
            $table->integer('completed_orders')->default(0);
            $table->json('low_stock');
            $table->json('chart_categories');
            $table->json('monthly_sales');
            $table->json('recent_orders');
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_cache');
    }
};