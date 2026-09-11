<?php

namespace App\Http\Controllers;

use App\Models\SiteContent;
use Illuminate\Http\Request;

class SiteContentController extends Controller
{
    public function show(Request $request)
    {
        $page = $request->input('page', 'about');

        $row = SiteContent::where('page', $page)->first();

        if ($row) {
            return response()->json($row->content);
        }

        return response()->json(['error' => 'Konten tidak ditemukan'], 404);
    }
}