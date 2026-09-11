-- ============================================================
-- Ungkepan SN — Database Schema
-- Jalankan di Laragon MySQL (phpMyAdmin atau terminal)
-- ============================================================

CREATE DATABASE IF NOT EXISTS ungkepan_sn
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ungkepan_sn;

-- -----------------------------------------------------------
-- KATEGORI
-- -----------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL DEFAULT '',
  icon VARCHAR(50) NOT NULL DEFAULT 'Cookie',
  image VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- PRODUK
-- -----------------------------------------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  price INT NOT NULL,
  image VARCHAR(500) NOT NULL,
  description TEXT,
  weight VARCHAR(50) DEFAULT '',
  stock INT DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- PESANAN
-- -----------------------------------------------------------
CREATE TABLE orders (
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
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- ITEM PESANAN
-- -----------------------------------------------------------
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_price INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- ADMIN (sederhana)
-- -----------------------------------------------------------
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- SITE CONTENT (Tentang Kami, Kontak, dll)
-- -----------------------------------------------------------
CREATE TABLE site_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(50) NOT NULL UNIQUE,
  content JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO site_content (page, content) VALUES ('contact', JSON_OBJECT(
  'subtitle', 'Punya pertanyaan? Kami siap bantu.',
  'whatsapp', '6281234567890',
  'whatsapp_display', '0812-3456-7890',
  'whatsapp_label', 'Fast response, chat aja',
  'location', 'Jakarta, Indonesia',
  'location_note', '(*Untuk ambil langsung, hubungi kami dulu via WA)',
  'email', 'ungkepansn@email.com',
  'hours_weekday', 'Senin - Sabtu: 08.00 - 20.00',
  'hours_weekend', 'Minggu: 09.00 - 17.00',
  'map_placeholder', 'Jakarta, Indonesia'
));

INSERT INTO site_content (page, content) VALUES ('about', JSON_OBJECT(
  'title', 'Cerita Ungkepan SN',
  'subtitle', 'Berawal dari dapur kecil, resep turun-temurun, dan cinta untuk berbagi.',
  'storyTitle', 'Awal Mula',
  'storyParagraphs', JSON_ARRAY(
    'Ungkepan SN didirikan oleh Mamak, seorang ibu rumah tangga yang hobi memasak. Awalnya Mamak hanya membuat kue kering untuk acara keluarga dan tetangga. Karena rasanya enak, banyak yang minta dibuatkan.',
    'Dari situ, Mamak mulai menerima pesanan kecil-kecilan. Alhamdulillah, sekarang Ungkepan SN sudah punya puluhan pelanggan setia dari berbagai kota.',
    'Semua produk dibuat fresh setelah ada pesanan. Mamak percaya, makanan enak itu harus dibuat dengan hati.'
  ),
  'values', JSON_ARRAY(
    JSON_OBJECT('icon', 'Heart', 'title', 'Dibuat dengan Cinta', 'desc', 'Setiap produk dibuat secara handmade dengan resep keluarga'),
    JSON_OBJECT('icon', 'ShieldCheck', 'title', 'Bersih & Higienis', 'desc', 'Dapur bersih, bahan segar, proses higienis'),
    JSON_OBJECT('icon', 'ShoppingBag', 'title', 'Fresh after Order', 'desc', 'Produk dibuat setelah kamu pesan, bukan stok lama')
  )
));

-- -----------------------------------------------------------
-- PAYMENT CONFIG
-- -----------------------------------------------------------
CREATE TABLE payment_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  method VARCHAR(50) NOT NULL,
  label VARCHAR(200) NOT NULL,
  account_name VARCHAR(200) DEFAULT '',
  account_number VARCHAR(100) DEFAULT '',
  bank_name VARCHAR(100) DEFAULT '',
  qris_image VARCHAR(500) DEFAULT '',
  logo TEXT,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO payment_config (method, label, account_name, account_number, bank_name, is_active, sort_order) VALUES
('transfer', 'Transfer BNI', 'Ungkepan SN', '1234567890', 'BNI', 1, 1),
('transfer', 'Transfer BCA', 'Ungkepan SN', '0987654321', 'BCA', 1, 2),
('transfer', 'Transfer Mandiri', 'Ungkepan SN', '1122334455', 'Mandiri', 1, 3),
('e-wallet', 'DANA', 'Ungkepan SN', '08123456789', '', 1, 4),
('e-wallet', 'OVO', 'Ungkepan SN', '08123456789', '', 1, 5),
('e-wallet', 'GoPay', 'Ungkepan SN', '08123456789', '', 1, 6),
('qris', 'QRIS', '', '', '', 1, 7),
('cod', 'Bayar di Tempat (COD)', '', '', '', 1, 8);

-- -----------------------------------------------------------
-- REVIEWS
-- -----------------------------------------------------------
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT DEFAULT NULL,
  name VARCHAR(200) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  is_approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Admin diisi via setup.php (jalankan: php database/setup.php)

-- -----------------------------------------------------------
-- SEED DATA — KATEGORI
-- -----------------------------------------------------------
INSERT INTO categories (name, icon, image) VALUES
('Kue Kering', 'Cookie', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80&auto=format'),
('Minuman', 'Coffee', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80&auto=format'),
('Camilan', 'BowlFood', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80&auto=format'),
('Kue Basah', 'Cake', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80&auto=format');

-- -----------------------------------------------------------
-- SEED DATA — PRODUK
-- -----------------------------------------------------------
INSERT INTO products (category_id, name, price, image, description, weight, stock) VALUES
(1, 'Kue Nastar Keju', 55000,
 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80&auto=format',
 'Kue nastar dengan selai nanas homemade dan taburan keju edam parut. Lumer di mulut.',
 '500 gram', 25),

(1, 'Putri Salju', 60000,
 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&auto=format',
 'Kue putri salju dengan gula halus taburan. Tekstur renyah dan lumer.',
 '500 gram', 20),

(1, 'Kastengel Keju', 65000,
 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80&auto=format',
 'Kastengel keju asli dengan rasa gurih. Dibuat dari keju edam dan cheddar premium.',
 '500 gram', 18),

(1, 'Kue Sagu Keju', 50000,
 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80&auto=format',
 'Kue sagu keju yang renyah dan lumer. Campuran keju dan sagu pilihan.',
 '400 gram', 30),

(2, 'Es Cendol Gula Merah', 15000,
 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80&auto=format',
 'Cendol homemade dengan gula merah asli dan santan segar.',
 '300 ml', 50),

(2, 'Es Kelapa Muda', 18000,
 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80&auto=format',
 'Kelapa muda segar dengan air kelapa asli. Ditambah sedikit sirup gula merah.',
 '350 ml', 40),

(2, 'Bandrek Susu Jahe', 12000,
 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80&auto=format',
 'Minuman jahe hangat dengan susu dan gula aren. Cocok untuk cuaca dingin.',
 '250 ml', 35),

(3, 'Pisang Goreng Crispy', 12000,
 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&auto=format',
 'Pisang goreng crispy dengan taburan coklat dan keju. 1 porsi 8 potong.',
 '200 gram', 30),

(3, 'Risoles Mayo', 15000,
 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&auto=format',
 'Risoles kulit lumpia berisi campuran sayur, telur, dan mayonaise. 1 box 10 pcs.',
 '300 gram', 25),

(3, 'Pastel Isi Sayur', 13000,
 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&auto=format',
 'Pastel goreng isi sayuran segar (wortel, kentang, buncis). 1 box 8 pcs.',
 '250 gram', 20),

(4, 'Klepon Gula Merah', 15000,
 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&auto=format',
 'Kue klepon tradisional dengan gula merah cair di dalamnya. 1 box 12 pcs.',
 '300 gram', 15),

(4, 'Kue Lumpur Kentang', 18000,
 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80&auto=format',
 'Kue lumpur kentang lembut topping kismis dan keju. 1 box 10 pcs.',
 '350 gram', 20);
