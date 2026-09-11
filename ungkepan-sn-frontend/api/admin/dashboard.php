<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Total produk
$totalProducts = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();

// Total pesanan
$totalOrders = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();

// Total pendapatan
$totalRevenue = $pdo->query("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'pending'")->fetchColumn();

// Pesanan per status
$pendingOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'")->fetchColumn();
$processedOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'processed'")->fetchColumn();
$shippedOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'shipped'")->fetchColumn();
$completedOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'completed'")->fetchColumn();

// Pesanan terbaru (5)
$recentOrders = $pdo->query("
    SELECT order_code, customer_name, total, status, created_at
    FROM orders ORDER BY created_at DESC LIMIT 5
")->fetchAll();

// Stok menipis (< 10)
$lowStock = $pdo->query("
    SELECT name, stock FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 5
")->fetchAll();

// Distribusi produk per kategori
$chartCategories = $pdo->query("
    SELECT c.name, COUNT(p.id) as value
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY value DESC
")->fetchAll(PDO::FETCH_KEY_PAIR);

echo json_encode([
    'total_products' => (int) $totalProducts,
    'total_orders' => (int) $totalOrders,
    'total_revenue' => (int) $totalRevenue,
    'pending_orders' => (int) $pendingOrders,
    'processed_orders' => (int) $processedOrders,
    'shipped_orders' => (int) $shippedOrders,
    'completed_orders' => (int) $completedOrders,
    'recent_orders' => $recentOrders,
    'low_stock' => $lowStock,
    'chart_categories' => array_map(fn($name, $value) => ['name' => $name, 'value' => (int)$value], array_keys($chartCategories), $chartCategories),
]);
