<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Review;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        Review::insert([
            ['product_id' => null, 'name' => 'Siti Rofiah', 'rating' => 5, 'review' => 'Adminnya satset, pesanan cepat sampai dan rasanya mantap banget!', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Bayu Setiawan', 'rating' => 5, 'review' => 'Produknya freshhh, baru mateng kayaknya pas dikirim. Bakal langganan terus.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Rina Marlina', 'rating' => 5, 'review' => 'Pesan malam hari, pagi udah di antar. Packing rapi, es batu masih beku. Recommended!', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Doni Pratama', 'rating' => 4, 'review' => 'Rasa autentik beneran, ga pake MSG berlebihan. Harga juga bersahabat buat kualitas segini.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Maya Sari', 'rating' => 5, 'review' => 'Udah 3x belanja disini, konsisten enaknya. Favorit ayam ungkep sama ikan bakarnya.', 'is_approved' => 1],
            ['product_id' => null, 'name' => 'Agus Wijaya', 'rating' => 5, 'review' => 'Pelayanan ramah, responsif di WA. Minta custom packing buat hadiah juga di accommodate. Top!', 'is_approved' => 1],
        ]);
    }
}