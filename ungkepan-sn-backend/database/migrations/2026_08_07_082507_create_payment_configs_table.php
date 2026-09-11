<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_config', function (Blueprint $table) {
            $table->id();
            $table->string('method', 50);
            $table->string('label', 200);
            $table->string('account_name', 200)->default('');
            $table->string('account_number', 100)->default('');
            $table->string('bank_name', 100)->default('');
            $table->string('qris_image', 500)->default('');
            $table->text('logo')->nullable();
            $table->tinyInteger('is_active')->default(1);
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_config');
    }
};
