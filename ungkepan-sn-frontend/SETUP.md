# Setup Ungkepan SN

## 1. Database (Laragon)

1. Buka Laragon → Start **MySQL**
2. Buka phpMyAdmin: `http://localhost/phpmyadmin`
3. **Import** file `database/schema.sql`
4. Buka Terminal Laragon, jalankan:
   ```bash
   cd path/to/ungkepan-sn/database
   php setup.php
   ```
   Nanti akan muncul: ✅ Setup selesai!

## 2. API Backend

1. **Copy folder `api/`** ke Laragon:
   ```
   C:\laragon\www\ungkepan-sn-api\
   ```
   (pastikan hasilnya: `C:\laragon\www\ungkepan-sn-api\config.php`, dll)

2. **Restart Apache** dari Laragon

3. **Test API**: Buka `http://localhost/ungkepan-sn-api/categories.php`
   - Kalau muncul JSON data → API siap!

## 3. Website

```bash
cd ungkepan-sn
npm install
npm run dev
```

- Website: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`
- Login: `admin` / `admin123`

## Struktur Folder

```
ungkepan-sn/
├── database/         ← SQL + setup script
│   ├── schema.sql    ← Buat tabel + contoh produk
│   └── setup.php     ← Setup admin (admin/admin123)
├── api/              ← PHP backend (copy ke Laragon)
│   ├── config.php
│   ├── products.php
│   ├── categories.php
│   ├── orders.php
│   └── admin/        ← Admin API
├── src/
│   ├── api/          ← React API client
│   ├── pages/
│   │   └── admin/    ← Admin pages
│   └── ...
```

## Catatan

- **Public pages** (belanja) pakai data statis — jalan tanpa database
- **Admin panel** butuh database + API PHP
- Admin credentials bisa diganti di `database/setup.php`
