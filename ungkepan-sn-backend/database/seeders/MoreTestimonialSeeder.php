<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Review;

class MoreTestimonialSeeder extends Seeder
{
    public function run(): void
    {
        Review::insert([
            ['product_id' => null, 'name' => 'Lisa Putri', 'rating' => 5, 'review' => 'Coba pesen ikan bakar, beneran legit bumbunya meresap. Nasi panas 2 porsi ludes sendiri!', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Raka Mahendra', 'rating' => 4, 'review' => 'Delivery ke Depok cuma 45 menit. Masih hangat, packing nggak bocor. Ajarin tips pesen jam sibuk dong.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Dewi Lestari', 'rating' => 5, 'review' => 'Ungkep ayamnya juara, daging empuk sampe ke tulang. Bumbu meresap banget, nggak cuma di kulit doang.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Tommy Gunawan', 'rating' => 5, 'review' => 'Pertama kali beli frozen food online, ternyata fresh banget. Ikan bakarnya wangi asap, enak banget.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Nina Permata', 'rating' => 4, 'review' => 'Sudah 6 bulan langganan, konsisten kualitasnya. Kadang ada promo gratis ongkir, hemat banget.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Hendra Kusuma', 'rating' => 5, 'review' => 'Pesen buat arisan kantor, temen-temen pada suka. Request sambel terasi ekstra diikutin. Mantap!', 'is_approved' => 1],
        ]);
    }
}