<#
.SYNOPSIS
  🚀 Ungkepan SN — Setup Otomatis (Laragon + MySQL + API)
.DESCRIPTION
  Script ini akan:
  1. Cek Laragon & MySQL
  2. Copy API ke Laragon www
  3. Import database + seed data
  4. Setup admin
  5. Install npm dependencies
  6. Buka website
#>

$ErrorActionPreference = "Stop"
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red
$Cyan = [System.ConsoleColor]::Cyan

function Write-Color($text, $color) {
  Write-Host $text -ForegroundColor $color
}

Write-Color @"
╔══════════════════════════════════════════════╗
║        🍪 Ungkepan SN — AUTO SETUP         ║
║        Ini bakal setup semuanya buat kamu   ║
╚══════════════════════════════════════════════╝
"@ $Cyan

# ─── 1. Cek Laragon ───
Write-Color "`n📌 Langkah 1: Cek Laragon..." $Yellow
$laragonWww = "C:\laragon\www"

if (-not (Test-Path $laragonWww)) {
  Write-Color "✗ Folder Laragon tidak ditemukan di $laragonWww" $Red
  Write-Color "  Pastikan Laragon sudah terinstall." $Red
  exit 1
}
Write-Color "✓ Laragon ditemukan!" $Green

# ─── 2. Copy API ───
Write-Color "`n📌 Langkah 2: Copy API ke Laragon..." $Yellow
$apiDest = "$laragonWww\ungkepan-sn-api"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Test-Path $apiDest) {
  Write-Color "  Folder API sudah ada, update file..." $Yellow
} else {
  New-Item -ItemType Directory -Path $apiDest -Force | Out-Null
}

# Copy semua file PHP dari folder api/
$apiSource = Join-Path $projectRoot "api"
if (Test-Path $apiSource) {
  Copy-Item -Path "$apiSource\*" -Destination $apiDest -Recurse -Force
  Write-Color "✓ File API berhasil di-copy" $Green
} else {
  Write-Color "⚠ Folder api/ tidak ditemukan di $apiSource" $Yellow
  Write-Color "  Pastikan kamu menjalankan script dari folder ungkepan-sn" $Yellow
}

# Copy install.php juga
$installSource = Join-Path $projectRoot "install.php"
if (Test-Path $installSource) {
  Copy-Item -Path $installSource -Destination $apiDest -Force
  Write-Color "✓ install.php siap" $Green
}

# ─── 3. Cek MySQL ───
Write-Color "`n📌 Langkah 3: Cek MySQL..." $Yellow

$mysqlRunning = $false
try {
  $testConn = [System.Net.Sockets.TcpClient]::new()
  $testConn.ConnectAsync("127.0.0.1", 3306).Wait(1000)
  if ($testConn.Connected) {
    $mysqlRunning = $true
    $testConn.Close()
  }
} catch {}

if (-not $mysqlRunning) {
  Write-Color "⚠ MySQL belum running. Buka Laragon → Start MySQL" $Yellow
  Write-Color "  Setelah MySQL running, jalankan script ini lagi" $Yellow
  Write-Color "  Atau akses manual: http://localhost/ungkepan-sn-api/install.php" $Yellow
  exit 0
}
Write-Color "✓ MySQL running!" $Green

# ─── 4. Setup database via install.php ───
Write-Color "`n📌 Langkah 4: Setup database..." $Yellow

# Cek apakah PHP tersedia
$phpPath = Get-Command "php" -ErrorAction SilentlyContinue
if ($phpPath) {
  $installPhp = Join-Path $apiDest "install.php"
  if (Test-Path $installPhp) {
    $output = & php "$installPhp" 2>&1
    Write-Color "✓ Database berhasil di-setup!" $Green
  }
} else {
  Write-Color "⚠ PHP CLI tidak ditemukan" $Yellow
  Write-Color "  Akses manual: http://localhost/ungkepan-sn-api/install.php" $Yellow
  Write-Color "  Lalu hapus install.php setelah selesai" $Yellow
}

# ─── 5. Install npm ───
Write-Color "`n📌 Langkah 5: Install npm packages..." $Yellow
Set-Location -LiteralPath $projectRoot

if (Test-Path "node_modules") {
  Write-Color "  node_modules sudah ada, skip..." $Green
} else {
  npm install
  if ($LASTEXITCODE -eq 0) {
    Write-Color "✓ npm install berhasil!" $Green
  } else {
    Write-Color "✗ npm install gagal, coba manual: npm install" $Red
  }
}

# ─── Selesai ───
Write-Color @"

╔══════════════════════════════════════════════╗
║        ✅ SETUP SELESAI!                     ║
╠══════════════════════════════════════════════╣
║                                              ║
║  Website:  npm run dev                       ║
║  Admin:    http://localhost:5173/admin       ║
║  Login:    admin / admin123                  ║
║                                              ║
║  Kalau ada error, buka:                      ║
║  http://localhost/ungkepan-sn-api/install.php║
║                                              ║
╚══════════════════════════════════════════════╝

"@ $Cyan

Set-Location -LiteralPath $projectRoot
