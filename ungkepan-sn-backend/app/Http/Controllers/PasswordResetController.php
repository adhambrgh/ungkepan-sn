<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Sanitize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    private const EXPIRY_MINUTES = 60;

    private function resetUrl(string $token, string $email): string
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return $base . '/reset-password?token=' . $token . '&email=' . urlencode($email);
    }

    public function forgot(Request $request)
    {
        $email = strtolower(Sanitize::text($request->input('email', ''), 191));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'Format email tidak valid'], 422);
        }

        $user = User::where('email', $email)->first();

        // Selalu jawab sukses (anti-enumeration): jangan bocorkan apakah email terdaftar.
        if (! $user || ! $user->password) {
            return response()->json(['success' => true]);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $link = $this->resetUrl($token, $email);
        $devLink = null;

        try {
            if (config('mail.default') === 'log') {
                throw new \RuntimeException('Mailer masih log — belum ada SMTP');
            }

            Mail::raw(
                "Hai {$user->name},\n\n" .
                "Kamu (atau orang lain) minta reset password akun Ungkepan SN.\n" .
                "Buka link ini dalam " . self::EXPIRY_MINUTES . " menit untuk ganti password:\n\n" .
                "{$link}\n\n" .
                "Kalau bukan kamu yang minta, abaikan email ini.\n\n" .
                "— Ungkepan SN",
                function ($message) use ($email) {
                    $message->to($email)->subject('Reset Password Akun Ungkepan SN');
                }
            );
        } catch (\Throwable $e) {
            logger('MAIL ERROR: ' . $e->getMessage());
            // SMTP belum diset / gagal kirim → permudah tes: beri link langsung di response.
            // Hanya untuk mode lokal, supaya tidak bocor ke produksi.
            if (config('app.env') === 'local') {
                $devLink = $link;
            }
        }

        return response()->json([
            'success' => true,
            'dev_reset_url' => $devLink,
        ]);
    }

    public function reset(Request $request)
    {
        $email = strtolower(Sanitize::text($request->input('email', ''), 191));
        $token = (string) $request->input('token', '');
        $password = (string) $request->input('password', '');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || $token === '') {
            return response()->json(['error' => 'Link reset tidak valid atau sudah kedaluwarsa'], 422);
        }

        if (strlen($password) < 6) {
            return response()->json(['error' => 'Password minimal 6 karakter'], 422);
        }

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record || ! Hash::check($token, $record->token)) {
            return response()->json(['error' => 'Link reset tidak valid atau sudah kedaluwarsa'], 422);
        }

        $created = $record->created_at ? \Carbon\Carbon::parse($record->created_at) : now();
        if ($created->diffInMinutes(now()) > self::EXPIRY_MINUTES) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            return response()->json(['error' => 'Link reset sudah kedaluwarsa. Minta ulang lagi.'], 422);
        }

        $user = User::where('email', $email)->first();

        if (! $user || ! $user->password) {
            return response()->json(['error' => 'Akun tidak ditemukan'], 404);
        }

        $user->forceFill(['password' => bcrypt($password)])->save();

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        if (config('app.env') === 'local') {
            logger('Password user ' . $email . ' direset.');
        }

        return response()->json(['success' => true]);
    }
}