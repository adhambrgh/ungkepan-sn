<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Upload;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $path = Upload::handle($request, 'file', 'hero');

        if (! $path) {
            return response()->json(['error' => 'Format tidak didukung. Gunakan: jpg, jpeg, png, webp, gif'], 400);
        }

        return response()->json(['success' => true, 'url' => $path]);
    }
}