<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class Upload
{
    private const MIME_EXT = [
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'webp' => ['image/webp'],
        'gif' => ['image/gif'],
    ];

    /** Ukuran maksimal upload dalam byte (default 5 MB). */
    private const MAX_BYTES = 5242880;

    public static function handle(
        Request $request,
        string $key,
        string $prefix,
        array $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    ): ?string {
        if (! $request->hasFile($key)) {
            return null;
        }

        $file = $request->file($key);

        if (! $file->isValid()) {
            return null;
        }

        if ($file->getSize() > self::MAX_BYTES) {
            return null;
        }

        $ext = strtolower($file->getClientOriginalExtension());

        if (! in_array($ext, $allowed, true)) {
            return null;
        }

        $mimeMap = self::MIME_EXT[$ext] ?? [];
        $actualMime = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $file->getPathname());

        if ($actualMime === false || ! in_array($actualMime, $mimeMap, true)) {
            return null;
        }

        $filename = $prefix . '_' . time() . '_' . Str::lower(Str::random(8)) . '.' . $ext;
        $file->move(public_path('uploads'), $filename);

        return 'uploads/' . $filename;
    }
}