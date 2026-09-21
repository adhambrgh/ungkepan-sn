<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderAdminController extends Controller
{
    public function handle(Request $request)
    {
        return match ($request->method()) {
            'GET' => $this->index($request),
            'PUT' => $this->update($request),
            'DELETE' => $this->destroy($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function index(Request $request)
    {
        $status = (string) $request->input('status', '');
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(1, (int) $request->input('per_page', 50)));

        $query = Order::with('items')
            ->where('status', '!=', 'pending_payment')
            ->orderByDesc('created_at');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $total = $query->count();
        $orders = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'data' => $orders,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int) ceil($total / $perPage),
        ]);
    }

    private function update(Request $request)
    {
        $id = $request->input('id');
        $status = $request->input('status');

        if (empty($id) || empty($status)) {
            return response()->json(['error' => 'ID dan status required'], 400);
        }

        if (! in_array($status, ['pending', 'pending_payment', 'processed', 'shipped', 'completed'])) {
            return response()->json(['error' => 'Status tidak valid'], 400);
        }

        DB::table('orders')->where('id', $id)->update(['status' => $status]);

        return response()->json(['success' => true]);
    }

    private function destroy(Request $request)
    {
        $id = $request->input('id');
        if (! $id) {
            return response()->json(['error' => 'ID pesanan required'], 400);
        }

        DB::table('orders')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }
}