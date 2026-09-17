<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StockStreamController;
use App\Http\Controllers\SiteContentController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\FavoritesController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductAdminController;
use App\Http\Controllers\Admin\CategoryAdminController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\PaymentAdminController;
use App\Http\Controllers\Admin\ReviewAdminController;
use App\Http\Controllers\Admin\SiteContentAdminController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\Admin\PromoAdminController;

/*
|--------------------------------------------------------------------------
| PUBLIC API — kontrak rute & JSON yang sama dengan sistem lama
|--------------------------------------------------------------------------
*/

Route::middleware('throttle:api')->group(function () {
    Route::get('/categories.php', [CategoryController::class, 'index']);
    Route::match(['get', 'post'], '/products.php', [ProductController::class, 'index']);
    Route::get('/orders.php', [OrderController::class, 'index']);
    Route::post('/orders.php', [OrderController::class, 'store']);
    Route::post('/orders-snap-token.php', [OrderController::class, 'getSnapToken']);
    Route::delete('/orders-snap-token.php', [OrderController::class, 'destroyPendingOrder']);
    Route::post('/orders-callback.php', [OrderController::class, 'handleCallback']);
    Route::get('/payments.php', [PaymentController::class, 'index']);
    Route::get('/reviews.php', [ReviewController::class, 'index']);
    Route::post('/reviews.php', [ReviewController::class, 'store']);
    Route::get('/stock-snapshot.php', [StockStreamController::class, 'snapshot']);
    Route::any('/stock-stream.php', [StockStreamController::class, 'snapshot']);
    Route::get('/site_content.php', [SiteContentController::class, 'show']);
    Route::get('/promos.php', [PromoController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| CUSTOMER AUTH — login, daftar, dan Google Sign-In
|--------------------------------------------------------------------------
*/

Route::middleware('throttle:login')->group(function () {
    Route::post('/login.php', [CustomerAuthController::class, 'login']);
    Route::post('/google.php', [CustomerAuthController::class, 'google']);
});

Route::middleware('throttle:register')->group(function () {
    Route::post('/register.php', [CustomerAuthController::class, 'register']);
});

Route::middleware('throttle:login')->group(function () {
    Route::post('/forgot-password.php', [PasswordResetController::class, 'forgot']);
});

Route::middleware('throttle:api')->group(function () {
    Route::post('/reset-password.php', [PasswordResetController::class, 'reset']);
});

Route::middleware(['customer.auth', 'throttle:api'])->group(function () {
    Route::get('/me.php', [CustomerAuthController::class, 'me']);

    Route::put('/profile.php', [ProfileController::class, 'update']);
    Route::post('/profile-avatar.php', [ProfileController::class, 'uploadAvatar']);
    Route::post('/change-password.php', [ProfileController::class, 'changePassword']);
    Route::post('/orders-confirm.php', [OrderController::class, 'confirmReceived']);

    Route::get('/addresses.php', [AddressController::class, 'index']);
    Route::post('/addresses.php', [AddressController::class, 'store']);
    Route::put('/addresses.php', [AddressController::class, 'update']);
    Route::delete('/addresses.php', [AddressController::class, 'destroy']);

    Route::get('/cart.php', [CartController::class, 'index']);
    Route::post('/cart.php', [CartController::class, 'add']);
    Route::put('/cart.php', [CartController::class, 'update']);
    Route::delete('/cart.php', [CartController::class, 'remove']);
    Route::delete('/cart-clear.php', [CartController::class, 'clear']);

    Route::get('/favorites.php', [FavoritesController::class, 'index']);
    Route::post('/favorites.php', [FavoritesController::class, 'toggle']);

    Route::post('/promos/apply.php', [PromoController::class, 'apply']);
    Route::post('/promos/use.php', [PromoController::class, 'use']);
});

/*
|--------------------------------------------------------------------------
| ADMIN API — wajib header Authorization: Bearer <token>
|--------------------------------------------------------------------------
*/

Route::post('/admin/login.php', [AuthController::class, 'login']);

Route::middleware(['admin.auth', 'throttle:api'])->group(function () {
    Route::get('/admin/dashboard.php', [DashboardController::class, 'index']);
    Route::get('/admin/dashboard-detail.php', [DashboardController::class, 'detail']);

    Route::match(['get', 'post', 'put', 'delete'], '/admin/products.php', [ProductAdminController::class, 'handle']);
    Route::match(['get', 'post', 'put', 'delete'], '/admin/categories.php', [CategoryAdminController::class, 'handle']);
    Route::match(['get', 'put', 'delete'], '/admin/orders.php', [OrderAdminController::class, 'handle']);
    Route::match(['get', 'post', 'put', 'delete'], '/admin/payments.php', [PaymentAdminController::class, 'handle']);
    Route::post('/admin/payments-upload.php', [PaymentAdminController::class, 'uploadQris']);
    Route::match(['get', 'put', 'delete'], '/admin/reviews.php', [ReviewAdminController::class, 'handle']);
    Route::match(['get', 'put'], '/admin/site_content.php', [SiteContentAdminController::class, 'handle']);
    Route::match(['get', 'post', 'put', 'delete'], '/admin/promos.php', [PromoAdminController::class, 'handle']);
    Route::post('/admin/upload.php', [UploadController::class, 'store']);
});
