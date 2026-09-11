<?php

namespace App\Http\Controllers;

use App\Models\UserAddress;
use App\Support\Sanitize;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->orderBy('id')->get();

        return response()->json(['addresses' => $addresses]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $this->validated($request);
        if ($data instanceof \Illuminate\Http\JsonResponse) {
            return $data;
        }

        $makeDefault = ! $user->addresses()->exists() || ($request->boolean('is_default') && $user->addresses()->where('is_default', true)->exists());

        $address = $user->addresses()->create($data + ['is_default' => $makeDefault]);

        if ($makeDefault && $data['is_default']) {
            $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        return response()->json(['success' => true, 'address' => $address], 201);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $address = $user->addresses()->find($request->input('id'));

        if (! $address) {
            return response()->json(['error' => 'Alamat tidak ditemukan'], 404);
        }

        $data = $this->validated($request);
        if ($data instanceof \Illuminate\Http\JsonResponse) {
            return $data;
        }

        $address->update($data);

        if ($data['is_default']) {
            $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        return response()->json(['success' => true, 'address' => $address->fresh()]);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();
        $address = $user->addresses()->find($request->input('id'));

        if (! $address) {
            return response()->json(['error' => 'Alamat tidak ditemukan'], 404);
        }

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = $user->addresses()->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        return response()->json(['success' => true]);
    }

    private function validated(Request $request)
    {
        $address = Sanitize::html($request->input('address', ''), 1000);

        if ($address === '') {
            return response()->json(['error' => 'Alamat wajib diisi'], 422);
        }

        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');

        return [
            'label' => Sanitize::text($request->input('label', 'Rumah') ?: 'Rumah', 50),
            'name' => Sanitize::text($request->input('name') ?: null, 200),
            'phone' => Sanitize::text($request->input('phone') ?: null, 20),
            'city' => Sanitize::text($request->input('city') ?: null, 100),
            'province' => Sanitize::text($request->input('province') ?: null, 100),
            'district' => Sanitize::text($request->input('district') ?: null, 100),
            'address' => $address,
            'rt_rw' => Sanitize::text($request->input('rt_rw') ?: null, 20),
            'patokan' => Sanitize::html($request->input('patokan') ?: null, 200),
            'postal_code' => Sanitize::text($request->input('postal_code') ?: null, 10),
            'maps_url' => Sanitize::html($request->input('maps_url') ?: null, 500),
            'latitude' => $latitude !== '' && $latitude !== null ? (float) $latitude : null,
            'longitude' => $longitude !== '' && $longitude !== null ? (float) $longitude : null,
            'is_default' => $request->boolean('is_default'),
        ];
    }
}