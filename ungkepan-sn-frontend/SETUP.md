# Setup Ungkepan SN

Struktur proyek:

```
UngkepanSn/
├── start.bat               ← jalankan backend + frontend sekaligus
├── ungkepan-sn-backend/    ← Laravel (API-only, tanpa view/vite)
└── ungkepan-sn-frontend/   ← React + Vite (SPA)
```

## 1. Prasyarat

- Laragon (MySQL + PHP 8.2+) — `composer` dan `node`/`npm` terpasang.
- Database MySQL sudah dibuat (mis. `ungkepan_sn`).

## 2. Backend (Laravel)

```bash
cd ungkepan-sn-backend
copy .env.example .env
composer install
php artisan key:generate
```

Sesuaikan kredensial DB di `.env` (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`),
lalu buat tabel + data awal:

```bash
php artisan migrate --seed
```

Jalankan server:

```bash
php artisan serve
```

API tersedia di `http://127.0.0.1:8000`.

## 3. Frontend (React)

```bash
cd ungkepan-sn-frontend
copy .env.example .env
npm install
npm run dev
```

- Website: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`

Atur `VITE_API_URL` di `.env` frontend agar menunjuk ke backend (lihat komentar di `.env.example`).

## 4. Jalankan keduanya sekaligus

Dari root proyek, jalankan `start.bat`, atau:

```bash
npm run dev
```

## 5. Akun admin

Akun admin disimpan di tabel `admins` dan diverifikasi di
`app/Http/Controllers/Admin/AuthController.php` (login via `POST /admin/login.php`).

Tidak ada akun/kredensial default yang ditulis di repo. Buat akun admin secara manual
(seed atau insert ke tabel `admins`) lalu login di `/admin/login`.

## Catatan

- Backend adalah API-only: tidak ada view Blade maupun build aset (Vite) di backend.
  Aset frontend dibangun di `ungkepan-sn-frontend`.
- `database/schema.sql` hanya dokumentasi skema; sumber kebenaran tabel adalah migrasi Laravel.
