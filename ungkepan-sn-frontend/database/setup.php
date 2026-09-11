<?php
/**
 * Setup script — jalankan via terminal: php setup.php
 * Atau letakkan di Laragon www dan akses via browser.
 */

$host = 'localhost';
$dbname = 'ungkepan_sn';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $e) {
    die("Koneksi database gagal: " . $e->getMessage() . "\n");
}

// Setup admin
$adminUser = 'admin';
$adminPass = 'admin123';
$hash = password_hash($adminPass, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("DELETE FROM admins WHERE username = ?");
$stmt->execute([$adminUser]);

$stmt = $pdo->prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
$stmt->execute([$adminUser, $hash]);

echo "✅ Setup selesai!\n";
echo "   Username: $adminUser\n";
echo "   Password: $adminPass\n";
