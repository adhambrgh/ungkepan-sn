<?php

namespace App\Http\Controllers;

use App\Support\Sanitize;
use App\Support\Upload;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $name = Sanitize::text($request->input('name', ''), 200);
        if ($name === '') {
            return response()->json(['error' => 'Nama wajib diisi'], 422);
        }

        $phone = Sanitize::text($request->input('phone', ''), 20);
        $birthdate = $request->input('birthdate') ?: null;
        $gender = $request->input('gender') ?: null;

        if ($birthdate !== null && ! strtotime($birthdate)) {
            return response()->json(['error' => 'Format tanggal lahir tidak valid'], 422);
        }

        if ($gender !== null && ! in_array($gender, ['male', 'female'], true)) {
            return response()->json(['error' => 'Gender tidak valid'], 422);
        }

        $user->update([
            'name' => $name,
            'phone' => $phone,
            'birthdate' => $birthdate ? date('Y-m-d', strtotime($birthdate)) : null,
            'gender' => $gender,
        ]);

        return response()->json([
            'success' => true,
            'user' => $this->userPayload($user),
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $path = Upload::handle($request, 'avatar', 'avatar', ['jpg', 'jpeg', 'png', 'webp']);

        if (! $path) {
            return response()->json(['error' => 'Format tidak didukung. Gunakan: jpg, jpeg, png, webp'], 400);
        }

        $user->update(['avatar' => $path]);

        return response()->json([
            'success' => true,
            'user' => $this->userPayload($user),
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        $current = (string) $request->input('current_password', '');
        $new = (string) $request->input('new_password', '');

        if (strlen($new) < 6) {
            return response()->json(['error' => 'Password baru minimal 6 karakter'], 422);
        }

        if ($user->password && ! password_verify($current, $user->password)) {
            return response()->json(['error' => 'Password saat ini salah'], 401);
        }

        if (! $user->password) {
            return response()->json(['error' => 'Akun Google tidak pakai password'], 422);
        }

        $user->update(['password' => bcrypt($new)]);

        return response()->json(['success' => true]);
    }

    private function userPayload($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'birthdate' => $user->birthdate,
            'gender' => $user->gender,
            'avatar' => $user->avatar,
        ];
    }
}