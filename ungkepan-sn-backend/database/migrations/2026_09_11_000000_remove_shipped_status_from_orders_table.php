<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Status 'shipped' (Dikirim) tidak dipakai lagi.
        // Alur baru: pending → processed → completed.
        DB::table('orders')->where('status', 'shipped')->update(['status' => 'processed']);
    }

    public function down(): void
    {
        // Tidak dibalik — data sudah diganti!
    }
};