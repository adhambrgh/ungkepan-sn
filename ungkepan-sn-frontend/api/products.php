<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — semua produk, satu produk, atau featured
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    $featured = $_GET['featured'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare("
            SELECT p.*,
                   c.name as category_name,
                   COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating,
                   COUNT(r.id) as review_count
            FROM products p
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
            WHERE p.id = ?
            GROUP BY p.id
        ");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if ($product) {
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Produk tidak ditemukan']);
        }
        exit;
    }

    if ($featured === '1') {
        try {
            $stmt = $pdo->query("
                SELECT p.*,
                       c.name as category_name,
                       COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating,
                       COUNT(r.id) as review_count
                FROM products p
                JOIN categories c ON p.category_id = c.id
                LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
                WHERE p.is_featured = 1
                GROUP BY p.id
                ORDER BY p.created_at DESC
            ");
            $products = $stmt->fetchAll();
            echo json_encode($products);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        exit;
    }

    $stmt = $pdo->query("
        SELECT p.*,
               c.name as category_name,
               COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating,
               COUNT(r.id) as review_count
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
    ");
    $products = $stmt->fetchAll();

    // Map category icon names
    $iconMap = [
        'Kue Kering' => 'Cookie',
        'Minuman' => 'Coffee',
        'Camilan' => 'BowlFood',
        'Kue Basah' => 'Cake',
    ];

    $result = array_map(function ($p) use ($iconMap) {
        $p['category_icon'] = $iconMap[$p['category_name']] ?? 'Package';
        return $p;
    }, $products);

    echo json_encode($result);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
