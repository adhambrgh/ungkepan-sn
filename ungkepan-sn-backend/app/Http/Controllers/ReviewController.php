<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\User;
use App\Support\Sanitize;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        if ($request->input('testimonials') === '1') {
            $reviews = Review::whereNull('reviews.product_id')
                ->where('reviews.is_approved', 1)
                ->leftJoin('users', 'reviews.user_id', '=', 'users.id')
                ->orderByDesc('reviews.created_at')
                ->get(['reviews.id', 'reviews.name', 'reviews.rating', 'reviews.review', 'reviews.created_at', 'users.avatar']);

            return response()->json($reviews);
        }

        $productId = $request->input('product_id');
        if ($productId) {
            $reviews = Review::where('reviews.product_id', $productId)
                ->where('reviews.is_approved', 1)
                ->leftJoin('users', 'reviews.user_id', '=', 'users.id')
                ->orderByDesc('reviews.created_at')
                ->get(['reviews.id', 'reviews.name', 'reviews.rating', 'reviews.review', 'reviews.created_at', 'users.avatar']);

            return response()->json($reviews);
        }

        return response()->json(['error' => 'Parameter tidak lengkap'], 400);
    }

    private function authenticatedUser(Request $request)
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        return User::where('api_token', hash('sha256', $token))->first();
    }

    public function store(Request $request)
    {
        $input = $request->all();

        $name = Sanitize::text($input['name'] ?? '', 200);
        $rating = (int) ($input['rating'] ?? 0);
        $review = Sanitize::html($input['review'] ?? '', 1000);
        $productId = $input['product_id'] ?? null;
        $user = $this->authenticatedUser($request);

        if (! $name || ! $rating || ! $review) {
            return response()->json(['error' => 'Nama, rating, dan review wajib diisi'], 400);
        }
        if ($rating < 1 || $rating > 5) {
            return response()->json(['error' => 'Rating harus 1-5'], 400);
        }
        if ($productId !== null && ! is_numeric($productId)) {
            return response()->json(['error' => 'Produk tidak valid'], 400);
        }

        // Perilaku lama: semua review langsung disetujui
        Review::create([
            'product_id' => $productId !== null && $productId !== '' ? (int) $productId : null,
            'user_id' => $user?->id,
            'name' => $name,
            'rating' => $rating,
            'review' => $review,
            'is_approved' => 1,
        ]);

        return response()->json(['success' => true, 'message' => 'Review terkirim!']);
    }
}