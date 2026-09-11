# ERD Ungkepan SN API

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : "memiliki"
    PRODUCTS ||--o{ PRODUCTS_REVIEWS : "mendapat"
    PRODUCTS ||--o{ ORDER_ITEMS : "dibeli"
    ORDERS ||--o{ ORDER_ITEMS : "berisi"

    CATEGORIES {
        bigint id PK
        string name "100"
        string slug "100, default ''"
        string icon "50, default 'Cookie'"
        string image "500, default ''"
        timestamp created_at
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK "-> categories.id, cascade delete"
        string name "200"
        int price
        string image "500"
        text description "nullable"
        string weight "50, default ''"
        int stock "default 0"
        tinyint is_featured "0/1, default 0"
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS_REVIEWS {
        bigint id PK
        bigint product_id FK "-> products.id, nullable, null on delete"
        string name "200"
        tinyint rating "1-5"
        text review
        tinyint is_approved "0/1, default 0"
        timestamp created_at
    }

    ORDERS {
        bigint id PK
        string order_code "20, unique"
        string customer_name "200"
        string phone "20"
        text address
        string city "100"
        text notes NULL
        string shipping_method "50"
        string payment_method "50"
        int total
        enum status "pending/processed/shipped/completed"
        timestamp created_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK "-> orders.id, cascade delete"
        bigint product_id FK "-> products.id, cascade delete"
        string product_name "200 (snapshot)"
        int product_price "snapshot"
        int quantity
    }

    ADMINS {
        bigint id PK
        string username "50, unique"
        string password "255 (hash)"
        timestamp created_at
    }

    SITE_CONTENT {
        bigint id PK
        string page "50, unique"
        json content
        timestamp updated_at
    }

    PAYMENT_CONFIG {
        bigint id PK
        string method "50"
        string label "200"
        string account_name "200"
        string account_number "100"
        string bank_name "100"
        string qris_image "500"
        text logo NULL
        tinyint is_active "0/1"
        int sort_order
        timestamp created_at
    }
```

## Ringkasan Relasi

| Tabel | Nama Kolom | Referensi | On Delete |
|---|---|---|---|
| `products` | `category_id` | `categories.id` | CASCADE |
| `reviews` | `product_id` | `products.id` | SET NULL (nullable) |
| `order_items` | `order_id` | `orders.id` | CASCADE |
| `order_items` | `product_id` | `products.id` | CASCADE |

Note: `order_items` menyimpan snapshot `product_name` & `product_price` agar tidak berubah jika produk dihapus/diedit.

Standalone (tanpa relasi): `admins`, `site_content`, `payment_config`.