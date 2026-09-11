<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Support\Sanitize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const LOCK_MINUTES = 10;

    public function login(Request $request)
    {
        $username = Sanitize::text($request->input('username', ''), 100);
        $password = (string) $request->input('password', '');

        if ($username === '' || $password === '') {
            return response()->json(['error' => 'Username dan password wajib diisi'], 400);
        }

        $throttleKey = 'admin-login:' . strtolower($username) . ':' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = max((int) ceil($seconds / 60), 1);

            return response()->json([
                'error' => "Terlalu banyak percobaan login yang gagal. Coba lagi dalam {$minutes} menit.",
                'retry_after' => $seconds,
            ], 429);
        }

        $admin = Admin::where('username', $username)->first();

        if (! $admin || ! password_verify($password, $admin->password)) {
            RateLimiter::hit($throttleKey, self::LOCK_MINUTES * 60);
            $remaining = max(self::MAX_ATTEMPTS - RateLimiter::attempts($throttleKey), 0);

            $message = $remaining <= 0
                ? 'Username atau password salah. Terlalu banyak percobaan, coba lagi dalam ' . self::LOCK_MINUTES . ' menit.'
                : "Username atau password salah. Sisa {$remaining}x percobaan sebelum terkunci " . self::LOCK_MINUTES . ' menit.';

            return response()->json([
                'error' => $message,
                'remaining_attempts' => $remaining,
            ], 401);
        }

        RateLimiter::clear($throttleKey);

        $token = Str::random(64);

        $admin->forceFill(['api_token' => hash('sha256', $token)])->save();

        return response()->json([
            'success' => true,
            'token' => $token,
            'username' => $admin->username,
        ]);
    }
}