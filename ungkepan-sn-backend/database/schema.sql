-- ============================================================
-- UNGKEPAN SN - Database Schema (MySQL DDL)
-- Generated from Laravel migrations
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `site_content`;
DROP TABLE IF EXISTS `payment_config`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 0. users (pelanggan / pembeli)
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(200) NOT NULL,
  `email`      VARCHAR(191) NOT NULL,
  `phone`      VARCHAR(20)  NULL,
  `password`   VARCHAR(255) NULL,
  `google_id`  VARCHAR(100) NULL,
  `avatar`     VARCHAR(500) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 1. categories
-- ------------------------------------------------------------
CREATE TABLE `categories` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `slug`       VARCHAR(100) NOT NULL DEFAULT '',
  `icon`       VARCHAR(50)  NOT NULL DEFAULT 'Cookie',
  `image`      VARCHAR(500) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. products
-- ------------------------------------------------------------
CREATE TABLE `products` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `name`        VARCHAR(200) NOT NULL,
  `price`       INT NOT NULL,
  `image`       VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `weight`      VARCHAR(50) NOT NULL DEFAULT '',
  `stock`       INT NOT NULL DEFAULT 0,
  `is_featured` TINYINT NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `products_category_id_index` (`category_id`),
  CONSTRAINT `products_category_id_foreign`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. reviews
-- ------------------------------------------------------------
CREATE TABLE `reviews` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  BIGINT UNSIGNED NULL,
  `name`        VARCHAR(200) NOT NULL,
  `rating`      TINYINT NOT NULL,
  `review`      TEXT NOT NULL,
  `is_approved` TINYINT NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reviews_product_id_index` (`product_id`),
  CONSTRAINT `reviews_product_id_foreign`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. orders
-- ------------------------------------------------------------
CREATE TABLE `orders` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_code`      VARCHAR(20) NOT NULL,
  `customer_name`   VARCHAR(200) NOT NULL,
  `phone`           VARCHAR(20) NOT NULL,
  `address`         TEXT NOT NULL,
  `city`            VARCHAR(100) NOT NULL,
  `notes`           TEXT NULL,
  `shipping_method` VARCHAR(50) NOT NULL,
  `payment_method`  VARCHAR(50) NOT NULL,
  `total`           INT NOT NULL,
  `status`          ENUM('pending','processed','shipped','completed') NOT NULL DEFAULT 'pending',
  `created_at`      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_code_unique` (`order_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. order_items
-- ------------------------------------------------------------
CREATE TABLE `order_items` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`      BIGINT UNSIGNED NOT NULL,
  `product_id`    BIGINT UNSIGNED NOT NULL,
  `product_name`  VARCHAR(200) NOT NULL,
  `product_price` INT NOT NULL,
  `quantity`      INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. admins (standalone)
-- ------------------------------------------------------------
CREATE TABLE `admins` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. site_content (standalone)
-- ------------------------------------------------------------
CREATE TABLE `site_content` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `page`       VARCHAR(50) NOT NULL,
  `content`    JSON NOT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_content_page_unique` (`page`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. payment_config (standalone)
-- ------------------------------------------------------------
CREATE TABLE `payment_config` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `method`         VARCHAR(50) NOT NULL,
  `label`          VARCHAR(200) NOT NULL,
  `account_name`   VARCHAR(200) NOT NULL DEFAULT '',
  `account_number` VARCHAR(100) NOT NULL DEFAULT '',
  `bank_name`      VARCHAR(100) NOT NULL DEFAULT '',
  `qris_image`     VARCHAR(500) NOT NULL DEFAULT '',
  `logo`           TEXT NULL,
  `is_active`      TINYINT NOT NULL DEFAULT 1,
  `sort_order`     INT NOT NULL DEFAULT 0,
  `created_at`     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;