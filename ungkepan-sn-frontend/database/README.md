# Database Ungkepan SN

## Cara Otomatis (Rekomendasi)

Ada 2 cara:

### 1. Via install.php (termudah)

Copy file `install.php` ke folder Laragon:
```
C:\laragon\www\ungkepan-sn-api\
```

Lalu akses di browser:
```
http://localhost/ungkepan-sn-api/install.php
```

Selesai! Hapus `install.php` setelahnya.

### 2. Via PowerShell (lengkap)

Jalankan di Terminal (sebagai Admin):
```powershell
.\setup.ps1
```

Script akan: copy API, setup DB, install npm, semuanya otomatis.

## Manual (jika perlu)

1. Buka phpMyAdmin → Import `schema.sql`
2. Jalankan `php setup.php` untuk buat admin
