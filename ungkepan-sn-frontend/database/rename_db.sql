-- ============================================================
-- RENAME DATABASE: warung_mamak -> ungkepan_sn
-- Jalankan saat Laragon (MySQL) sudah nyala via phpMyAdmin (SQL)
-- atau: mysql -u root < rename_db.sql
-- MySQL tidak punya RENAME DATABASE, jadi dibuat DB baru lalu
-- semua tabel DIKOPI + DROP yang lama.
-- ============================================================

CREATE DATABASE IF NOT EXISTS ungkepan_sn
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SET @db = 'warung_mamak';
SET @new = 'ungkepan_sn';

-- Bangun query COPY per tabel lalu jalankan lewat prepared statement
SELECT GROUP_CONCAT(
  CONCAT(
    'CREATE TABLE `', @new, '`.`', table_name, '` LIKE `', @db, '`.`', table_name, '`; ',
    'INSERT INTO `', @new, '`.`', table_name, '` SELECT * FROM `', @db, '`.`', table_name, '`; '
  ) SEPARATOR ' '
) INTO @todo
FROM information_schema.tables
WHERE table_schema = @db;

PREPARE stmt FROM @todo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Opsional: hapus database lama setelah hasil di cek.
-- Uncomment jika sudah yakin data di ungkepan_sn lengkap.
-- DROP DATABASE warung_mamak;

SELECT 'Selesai. Database warung_mamak telah disalin ke ungkepan_sn.' AS hasil;