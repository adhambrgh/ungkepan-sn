<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil semua pesanan (terpisah: orders + items, dengan pagination)
if ($method === 'GET') {
    $status = $_GET['status'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $sql = "SELECT * FROM orders";
    $countSql = "SELECT COUNT(*) FROM orders";
    $params = [];
    if ($status) {
        $sql .= " WHERE status = ?";
        $countSql .= " WHERE status = ?";
        $params[] = $status;
    }
    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $countParams = $params;

    $total = $pdo->prepare($countSql);
    $total->execute($countParams);
    $totalCount = $total->fetchColumn();

    $stmt = $pdo->prepare($sql);
    $params[] = $perPage;
    $params[] = $offset;
    $stmt->execute($params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($orders)) {
        $orderIds = array_column($orders, 'id');
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $stmtItems = $pdo->prepare("
            SELECT order_id, product_id, product_name, product_price, quantity
            FROM order_items WHERE order_id IN ($placeholders)
        ");
        $stmtItems->execute($orderIds);
        $allItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        $itemsByOrder = [];
        foreach ($allItems as $item) {
            $itemsByOrder[$item['order_id']][] = [
                'product_id' => $item['product_id'],
                'product_name' => $item['product_name'],
                'product_price' => $item['product_price'],
                'quantity' => $item['quantity'],
            ];
        }

        foreach ($orders as &$order) {
            $order['items'] = $itemsByOrder[$order['id']] ?? [];
        }
        unset($order);
    }

    echo json_encode([
        'data' => $orders,
        'total' => (int)$totalCount,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($totalCount / $perPage),
    ]);
    exit;
}

// PUT — update status pesanan
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['id']) || empty($input['status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID dan status required']);
        exit;
    }
    $allowed = ['pending', 'processed', 'shipped', 'completed'];
    if (!in_array($input['status'], $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Status tidak valid']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$input['status'], $input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

// DELETE — hapus pesanan
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID pesanan required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
