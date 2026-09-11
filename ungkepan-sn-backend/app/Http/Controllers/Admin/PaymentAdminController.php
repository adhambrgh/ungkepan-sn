<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentConfig;
use App\Support\Sanitize;
use App\Support\Upload;
use Illuminate\Http\Request;

class PaymentAdminController extends Controller
{
    public function handle(Request $request)
    {
        return match ($request->method()) {
            'GET' => $this->index(),
            'POST' => $this->store($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->destroy($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function index()
    {
        $methods = PaymentConfig::orderBy('sort_order')->get();

        return response()->json($methods);
    }

    private function store(Request $request)
    {
        $method = PaymentConfig::create([
            'method' => Sanitize::text($request->input('method', 'transfer'), 50),
            'label' => Sanitize::text($request->input('label', ''), 200),
            'account_name' => Sanitize::text($request->input('account_name', ''), 200),
            'account_number' => Sanitize::text($request->input('account_number', ''), 100),
            'bank_name' => Sanitize::text($request->input('bank_name', ''), 100),
            'qris_image' => Sanitize::html($request->input('qris_image', ''), 500),
            'logo' => Sanitize::html($request->input('logo', ''), 2000),
            'is_active' => $request->input('is_active') ? 1 : 0,
            'sort_order' => max(0, (int) $request->input('sort_order', 0)),
        ]);

        return response()->json(['success' => true, 'id' => $method->id]);
    }

    private function update(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID required'], 400);
        }

        $fields = [];
        if ($request->has('method')) $fields['method'] = Sanitize::text($request->input('method'), 50);
        if ($request->has('label')) $fields['label'] = Sanitize::text($request->input('label'), 200);
        if ($request->has('account_name')) $fields['account_name'] = Sanitize::text($request->input('account_name'), 200);
        if ($request->has('account_number')) $fields['account_number'] = Sanitize::text($request->input('account_number'), 100);
        if ($request->has('bank_name')) $fields['bank_name'] = Sanitize::text($request->input('bank_name'), 100);
        if ($request->has('qris_image')) $fields['qris_image'] = Sanitize::html($request->input('qris_image'), 500);
        if ($request->has('logo')) $fields['logo'] = Sanitize::html($request->input('logo'), 2000);
        if ($request->has('is_active')) $fields['is_active'] = $request->input('is_active') ? 1 : 0;
        if ($request->has('sort_order')) $fields['sort_order'] = max(0, (int) $request->input('sort_order'));

        PaymentConfig::where('id', $id)->update($fields);

        return response()->json(['success' => true]);
    }

    private function destroy(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID required'], 400);
        }

        PaymentConfig::where('id', $id)->delete();

        return response()->json(['success' => true]);
    }

    public function uploadQris(Request $request)
    {
        $id = (int) $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID required'], 400);
        }

        $path = Upload::handle($request, 'qrisFile', 'qris', ['jpg', 'jpeg', 'png', 'webp']);

        if (! $path) {
            return response()->json(['error' => 'Format tidak didukung. Gunakan: jpg, jpeg, png, webp'], 400);
        }

        PaymentConfig::where('id', $id)->update(['qris_image' => $path]);

        return response()->json(['success' => true, 'qris_image' => $path]);
    }
}