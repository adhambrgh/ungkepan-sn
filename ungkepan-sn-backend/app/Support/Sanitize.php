<?php

namespace App\Support;

class Sanitize
{
    /** Tag HTML aman yang diizinkan untuk konten rich (admin-driven). */
    private const ALLOWED_TAGS = [
        'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'sub', 'sup', 'blockquote', 'hr',
    ];

    /** Field yang memang butuh HTML (diisi admin, bukan end-user publik). */
    private const RICH_FIELDS = [
        'description', 'content', 'notes', 'patokan', 'label', 'address',
    ];

    public static function text(mixed $value, int $max = 0): string
    {
        $value = is_scalar($value) || $value === null ? (string) $value : '';
        $value = trim($value);
        $value = strip_tags($value);
        $value = str_replace(["\r", "\x00"], '', $value);

        if ($max > 0 && mb_strlen($value) > $max) {
            $value = mb_substr($value, 0, $max);
        }

        return $value;
    }

    public static function string(mixed $value, int $max = 0): string
    {
        return self::text($value, $max);
    }

    /**
     * Sanitasi field bertipe rich-text. Memakai whitelist tag, buang
     * event handler (on*), dan atribut berbahaya (javascript:, style dilarang).
     */
    public static function html(mixed $value, int $max = 0): string
    {
        $value = self::text($value, $max > 0 ? $max : 10000);
        $value = strip_tags($value, '<'.implode('><', self::ALLOWED_TAGS).'>');

        $value = preg_replace('/\son\w+\s*=\s*(["\']).*?\1/i', '', $value) ?? $value;
        $value = preg_replace('/\sstyle\s*=\s*(["\']).*?\1/i', '', $value) ?? $value;
        $value = preg_replace('/javascript\s*:/i', '', $value) ?? $value;
        $value = preg_replace('#(onerror|onload|onfocus|onmouseover|onclick|href\s*=\s*[\"\']?\s*javascript:)#i', '', $value) ?? $value;

        return trim($value);
    }

    /**
     * Pilih sanitizer berdasarkan nama field, supaya field rich-text dari admin
     * (description/content) tetap bisa pakai tag, sedangkan field teks biasa
     * (nama, username, email, dll) di-strip seluruh html-nya.
     */
    public static function field(string $field, mixed $value, int $max = 0): string
    {
        if (in_array($field, self::RICH_FIELDS, true)) {
            return self::html($value, $max);
        }

        return self::text($value, $max);
    }
}