<?php
/**
 * ============================================================
 *  🚀 Ungkepan SN — INSTALLER OTOMATIS
 *  ============================================================
 *  Cara pakai:
 *  1. Copy file ini ke C:\laragon\www\ungkepan-sn-api\
 *  2. Akses via browser: http://localhost/ungkepan-sn-api/install.php
 *  3. Selesai! Hapus file ini untuk keamanan.
 * ============================================================
 */

header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html><html lang=id><head><meta charset=utf-8>';
echo '<meta name=viewport content="width=device-width,initial-scale=1">';
echo '<title>Ungkepan SN — Installer</title>';
echo '<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;background:#f5f5f4;color:#1c1917}
h1{color:#c2410c}
pre{background:#292524;color:#e7e5e4;padding:16px;border-radius:12px;overflow-x:auto}
.ok{color:#16a34a;font-weight:700}
.err{color:#dc2626;font-weight:700}
.section{background:#fff;border-radius:16px;padding:20px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}
code{background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:.9em}
</style>';

echo '<h1>🍪 Ungkepan SN — Installer</h1>';
echo '<div class=section>';

// ─── Koneksi database ───
$host = 'localhost';
$dbname = 'ungkepan_sn';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "<p class=ok>✓ Koneksi MySQL berhasil</p>";
} catch (PDOException $e) {
    echo "<p class=err>✗ MySQL tidak terhubung: {$e->getMessage()}</p>";
    echo '<p>Pastikan Laragon MySQL sudah running.</p></div></body></html>';
    exit;
}

// ─── Buat database ───
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");
    echo "<p class=ok>✓ Database <code>$dbname</code> siap</p>";
} catch (PDOException $e) {
    echo "<p class=err>✗ Gagal buat database: {$e->getMessage()}</p>";
}

// ─── Buat tabel ───
echo '</div><div class=section><h2>📦 Membuat Tabel</h2>';

$tables = [
    'categories' => "CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL DEFAULT '',
        icon VARCHAR(50) NOT NULL DEFAULT 'Cookie',
        image VARCHAR(500) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB",

    'products' => "CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        price INT NOT NULL,
        image VARCHAR(500) NOT NULL,
        description TEXT,
        weight VARCHAR(50) DEFAULT '',
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB",

    'orders' => "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(20) NOT NULL UNIQUE,
        customer_name VARCHAR(200) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        notes TEXT,
        shipping_method VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        total INT NOT NULL,
        status ENUM('pending','processed','shipped','completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB",

    'order_items' => "CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        product_price INT NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB",

    'admins' => "CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB",

    'site_content' => "CREATE TABLE IF NOT EXISTS site_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page VARCHAR(50) NOT NULL UNIQUE,
        content JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB",
];

foreach ($tables as $name => $sql) {
    try {
        $pdo->exec($sql);
        echo "<p class=ok>✓ Tabel <code>$name</code> siap</p>";
    } catch (PDOException $e) {
        echo "<p class=err>✗ Tabel <code>$name</code> gagal: {$e->getMessage()}</p>";
    }
}

// ─── Migrasi: pastikan kolom slug & default values ───
$migrations = [
    "ALTER TABLE categories ADD COLUMN slug VARCHAR(100) NOT NULL DEFAULT '' AFTER name",
    "ALTER TABLE categories MODIFY icon VARCHAR(50) NOT NULL DEFAULT 'Cookie'",
    "ALTER TABLE categories MODIFY image VARCHAR(500) NOT NULL DEFAULT ''",
];
foreach ($migrations as $sql) {
    try { $pdo->exec($sql); } catch (PDOException $e) { /* kolom sudah ada, skip */ }
}

// ─── Seed data ───
echo '</div><div class=section><h2>🌱 Seed Data</h2>';

// Categories
try {
    $count = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO categories (name, icon, image) VALUES
            ('Kue Kering', 'Cookie', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80&auto=format'),
            ('Minuman', 'Coffee', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80&auto=format'),
            ('Camilan', 'BowlFood', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80&auto=format'),
            ('Kue Basah', 'Cake', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80&auto=format')");
        echo "<p class=ok>✓ 4 kategori berhasil ditambahkan</p>";
    } else {
        echo "<p class=ok>✓ Kategori sudah ada ($count), skip</p>";
    }
} catch (PDOException $e) {
    echo "<p class=err>✗ Kategori gagal: {$e->getMessage()}</p>";
}

// Products
try {
    $count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO products (category_id, name, price, image, description, weight, stock) VALUES
        (1, 'Kue Nastar Keju', 55000, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80&auto=format', 'Kue nastar dengan selai nanas homemade dan taburan keju edam parut.', '500 gram', 25),
        (1, 'Putri Salju', 60000, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&auto=format', 'Kue putri salju dengan gula halus taburan. Tekstur renyah dan lumer.', '500 gram', 20),
        (1, 'Kastengel Keju', 65000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&auto=format', 'Kastengel keju asli dengan rasa gurih.', '500 gram', 18),
        (1, 'Kue Sagu Keju', 50000, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80&auto=format', 'Kue sagu keju yang renyah dan lumer.', '400 gram', 30),
        (2, 'Es Cendol Gula Merah', 15000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80&auto=format', 'Cendol homemade dengan gula merah asli dan santan segar.', '300 ml', 50),
        (2, 'Es Kelapa Muda', 18000, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80&auto=format', 'Kelapa muda segar dengan air kelapa asli.', '350 ml', 40),
        (2, 'Bandrek Susu Jahe', 12000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80&auto=format', 'Minuman jahe hangat dengan susu dan gula aren.', '250 ml', 35),
        (3, 'Pisang Goreng Crispy', 12000, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&auto=format', 'Pisang goreng crispy. 1 porsi 8 potong.', '200 gram', 30),
        (3, 'Risoles Mayo', 15000, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&auto=format', 'Risoles kulit lumpia berisi sayur + mayonaise. 1 box 10 pcs.', '300 gram', 25),
        (3, 'Pastel Isi Sayur', 13000, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&auto=format', 'Pastel goreng isi sayuran segar. 1 box 8 pcs.', '250 gram', 20),
        (4, 'Klepon Gula Merah', 15000, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&auto=format', 'Kue klepon tradisional. 1 box 12 pcs.', '300 gram', 15),
        (4, 'Kue Lumpur Kentang', 18000, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&auto=format', 'Kue lumpur kentang lembut topping kismis dan keju. 1 box 10 pcs.', '350 gram', 20)");
        echo "<p class=ok>✓ 12 produk berhasil ditambahkan</p>";
    } else {
        echo "<p class=ok>✓ Produk sudah ada ($count), skip</p>";
    }
} catch (PDOException $e) {
    echo "<p class=err>✗ Produk gagal: {$e->getMessage()}</p>";
}

// Site Content
echo '</div><div class=section><h2>📄 Tentang Kami</h2>';
try {
    $count = $pdo->query("SELECT COUNT(*) FROM site_content")->fetchColumn();
    if ($count == 0) {
        $aboutContent = json_encode([
            'title' => 'Cerita Ungkepan SN',
            'subtitle' => 'Berawal dari dapur kecil, resep turun-temurun, dan cinta untuk berbagi.',
            'storyTitle' => 'Awal Mula',
            'storyParagraphs' => [
                'Ungkepan SN didirikan oleh Mamak, seorang ibu rumah tangga yang hobi memasak. Awalnya Mamak hanya membuat kue kering untuk acara keluarga dan tetangga. Karena rasanya enak, banyak yang minta dibuatkan.',
                'Dari situ, Mamak mulai menerima pesanan kecil-kecilan. Alhamdulillah, sekarang Ungkepan SN sudah punya puluhan pelanggan setia dari berbagai kota.',
                'Semua produk dibuat fresh setelah ada pesanan. Mamak percaya, makanan enak itu harus dibuat dengan hati.',
            ],
            'values' => [
                ['icon' => 'Heart', 'title' => 'Dibuat dengan Cinta', 'desc' => 'Setiap produk dibuat secara handmade dengan resep keluarga'],
                ['icon' => 'ShieldCheck', 'title' => 'Bersih & Higienis', 'desc' => 'Dapur bersih, bahan segar, proses higienis'],
                ['icon' => 'ShoppingBag', 'title' => 'Fresh after Order', 'desc' => 'Produk dibuat setelah kamu pesan, bukan stok lama'],
            ],
        ]);
        $stmt = $pdo->prepare("INSERT INTO site_content (page, content) VALUES ('about', ?)");
        $stmt->execute([$aboutContent]);
        echo "<p class=ok>✓ Konten Tentang Kami berhasil ditambahkan</p>";
    } else {
        echo "<p class=ok>✓ Konten Tentang Kami sudah ada, skip</p>";
    }
} catch (PDOException $e) {
    echo "<p class=err>✗ Konten Tentang Kami gagal: {$e->getMessage()}</p>";
}

// Footer
echo '</div><div class=section><h2>🦶 Footer</h2>';
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM site_content WHERE page = 'footer'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $footerContent = json_encode([
            'description' => 'Jajanan rumahan enak, bersih, dan terpercaya. Dibuat dengan resep turun-temurun dari dapur Mamak.',
            'copyright' => '© {year} Ungkepan SN. Dibuat dengan sepenuh hati.',
        ]);
        $stmt = $pdo->prepare("INSERT INTO site_content (page, content) VALUES ('footer', ?)");
        $stmt->execute([$footerContent]);
        echo "<p class=ok>✓ Footer berhasil ditambahkan</p>";
    } else {
        echo "<p class=ok>✓ Footer sudah ada, skip</p>";
    }
} catch (PDOException $e) {
    echo "<p class=err>✗ Footer gagal: {$e->getMessage()}</p>";
}

// Admin
echo '</div><div class=section><h2>🔐 Admin</h2>';
try {
    $stmt = $pdo->prepare("DELETE FROM admins WHERE username = ?");
    $stmt->execute(['admin']);

    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
    $stmt->execute(['admin', $hash]);
    echo "<p class=ok>✓ Admin berhasil dibuat</p>";
    echo '<pre>Username: admin
Password: admin123</pre>';
} catch (PDOException $e) {
    echo "<p class=err>✗ Admin gagal: {$e->getMessage()}</p>";
}

// ─── Selesai ───
echo '</div><div class=section style="background:#f0fdf4;border:2px solid #16a34a">';
echo '<h2 style=color:#16a34a>✅ INSTALASI SELESAI!</h2>';
echo '<p>Semua beres! Sekarang:</p>';
echo '<ol>';
echo '<li><strong>Hapus file <code>install.php</code></strong> dari folder Laragon (untuk keamanan)</li>';
echo '<li>Jalankan website: <code>cd ungkepan-sn && npm run dev</code></li>';
echo '<li>Buka <a href="http://localhost:5173" target=_blank>http://localhost:5173</a></li>';
echo '<li>Admin: <a href="http://localhost:5173/admin" target=_blank>http://localhost:5173/admin</a></li>';
echo '</ol>';
echo '<p style=margin-top:16px><code>admin / admin123</code></p>';
echo '</div>';

// ─── Copy file API otomatis ───
echo '<div class=section><h2>📂 File API</h2>';

// Cek apakah kita ada di folder Laragon www
$currentDir = __DIR__;
if (str_contains($currentDir, 'laragon\\www')) {
    echo "<p class=ok>✓ File API sudah berada di folder Laragon</p>";
} else {
    echo "<p>⚠ File API ada di <code>$currentDir</code></p>";
    echo '<p>Copy folder <code>api/</code> ke <code>C:\\laragon\\www\\ungkepan-sn-api\\</code></p>';
    echo '<pre>Copy-Item -Path "api/*" -Destination "C:\laragon\www\ungkepan-sn-api\" -Recurse</pre>';
}

echo '</div></body></html>';
