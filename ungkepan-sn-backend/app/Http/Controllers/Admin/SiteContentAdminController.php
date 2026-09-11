<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use App\Support\Sanitize;
use Illuminate\Http\Request;

class SiteContentAdminController extends Controller
{
    public function handle(Request $request)
    {
        return match ($request->method()) {
            'GET' => $this->show($request),
            'PUT' => $this->update($request),
            default => response()->json(['error' => 'Method not allowed'], 405),
        };
    }

    private function show(Request $request)
    {
        $page = Sanitize::text($request->input('page', 'about'), 30);

        $row = SiteContent::where('page', $page)->first();

        if ($row) {
            return response()->json([
                'page' => $row->page,
                'content' => $row->content,
                'updated_at' => $row->updated_at,
            ]);
        }

        return response()->json(['error' => 'Konten tidak ditemukan'], 404);
    }

    private function update(Request $request)
    {
        $page = Sanitize::text($request->input('page', ''), 30);
        $rawContent = $request->input('content', null);

        if (empty($page) || $rawContent === null) {
            return response()->json(['error' => 'Page dan content wajib diisi'], 400);
        }

        $content = $this->sanitizeContent($rawContent);

        SiteContent::updateOrCreate(['page' => $page], ['content' => $content]);

        return response()->json(['success' => true]);
    }

    private function sanitizeContent(mixed $value, int $depth = 0): mixed
    {
        if ($depth > 10) {
            return is_string($value) ? Sanitize::text($value, 50000) : $value;
        }

        if (is_array($value)) {
            $out = [];
            foreach ($value as $key => $item) {
                $out[$key] = $this->sanitizeContent($item, $depth + 1);
            }
            return $out;
        }

        if (is_scalar($value) || $value === null) {
            return Sanitize::html($value, 50000);
        }

        return Sanitize::text($value, 50000);
    }
}