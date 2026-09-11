<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Sanitize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CustomerAuthController extends Controller
{
    private function issueToken(User $user): string
    {
        $token = Str::random(64);

        $user->forceFill(['api_token' => hash('sha256', $token)])->save();

        return $token;
    }

    public function register(Request $request)
    {
        $name = Sanitize::text($request->input('name', ''), 200);
        $email = strtolower(Sanitize::text($request->input('email', ''), 191));
        $phone = Sanitize::text($request->input('phone', ''), 20);
        $password = (string) $request->input('password', '');

        if ($name === '') {
            return response()->json(['error' => 'Nama wajib diisi'], 422);
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Format email tidak valid'], 422);
        }

        if (strlen($password) < 6) {
            return response()->json(['error' => 'Password minimal 6 karakter'], 422);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email sudah terdaftar. Coba masuk, ya.'], 409);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password' => bcrypt($password),
        ]);

        return response()->json([
            'success' => true,
            'token' => $this->issueToken($user),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    public function login(Request $request)
    {
        $email = strtolower(Sanitize::text($request->input('email', ''), 191));
        $password = (string) $request->input('password', '');

        if ($email === '' || $password === '') {
            return response()->json(['error' => 'Email dan password wajib diisi'], 400);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json(['error' => 'Email belum terdaftar. Silakan daftar dulu.'], 404);
        }

        if (! $user->password || ! password_verify($password, $user->password)) {
            return response()->json(['error' => 'Email atau password salah'], 401);
        }

        return response()->json([
            'success' => true,
            'token' => $this->issueToken($user),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    public function google(Request $request)
    {
        $credential = trim($request->input('credential', ''));
        $clientId = config('services.google.client_id');

        if ($credential === '') {
            return response()->json(['error' => 'Token Google kosong'], 400);
        }

        if (! $clientId) {
            return response()->json(['error' => 'Google login belum dikonfigurasi'], 503);
        }

        try {
            $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $credential,
            ]);

            if (! $response->ok()) {
                $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                    'access_token' => $credential,
                ]);
            }
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Gagal memverifikasi Google'], 502);
        }

        if (! $response->ok()) {
            return response()->json(['error' => 'Token Google tidak valid'], 401);
        }

        $payload = $response->json();

        if (($payload['aud'] ?? '') !== $clientId) {
            return response()->json(['error' => 'Token Google bukan untuk aplikasi ini'], 401);
        }

        if (empty($payload['email_verified']) || empty($payload['email'])) {
            return response()->json(['error' => 'Email Google belum diverifikasi'], 401);
        }

        $email = strtolower($payload['email']);

        $user = User::where('google_id', $payload['sub'])->orWhere('email', $email)->first();

        if ($user) {
            $user->update([
                'google_id' => $user->google_id ?? $payload['sub'],
                'name' => $user->name ?: Sanitize::text($payload['name'] ?? $user->name, 200),
                'avatar' => $user->avatar ?: ($payload['picture'] ?? null),
            ]);
        } else {
            $user = User::create([
                'name' => Sanitize::text($payload['name'] ?? 'Pelanggan Baru', 200),
                'email' => $email,
                'google_id' => $payload['sub'],
                'avatar' => $payload['picture'] ?? null,
                'password' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'token' => $this->issueToken($user),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
            ],
        ]);
    }
}