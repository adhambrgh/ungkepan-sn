<?php

namespace App\Http\Controllers;

use App\Models\PaymentConfig;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $methods = PaymentConfig::where('is_active', 1)
            ->orderBy('sort_order')
            ->get();

        return response()->json($methods);
    }
}