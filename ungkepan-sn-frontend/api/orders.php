<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil semua pesanan (dipisah: orders + items)
if ($method === 'GET') {
    $phone = $_GET['phone'] ?? null;

    $sql = "SELECT * FROM orders";
    $params = [];
    if ($phone) {
        $sql .= " WHERE phone = ?";
        $params[] = $phone;
    }
    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Ambil semua items sekaligus
    if (!empty($orders)) {
        $orderIds = array_column($orders, 'id');
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $stmtItems = $pdo->prepare("
            SELECT order_id, product_id, product_name, product_price, quantity
            FROM order_items WHERE order_id IN ($placeholders)
        ");
        $stmtItems->execute($orderIds);
        $allItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Group items by order_id
        $itemsByOrder = [];
        foreach ($allItems as $item) {
            $itemsByOrder[$item['order_id']][] = [
                'product_id' => $item['product_id'],
                'product_name' => $item['product_name'],
                'product_price' => $item['product_price'],
                'quantity' => $item['quantity'],
            ];
        }

        // Attach items ke orders
        foreach ($orders as &$order) {
            $order['items'] = $itemsByOrder[$order['id']] ?? [];
        }
        unset($order);
    }

    echo json_encode($orders);
    exit;
}

// POST — buat pesanan baru
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['items'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Data pesanan tidak lengkap']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $orderCode = 'WM-' . strtoupper(substr(base_convert(time(), 10, 36), -6));

        $stmt = $pdo->prepare("
            INSERT INTO orders (order_code, customer_name, phone, address, city, notes,
                                shipping_method, payment_method, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([
            $orderCode,
            $input['customer_name'],
            $input['phone'],
            $input['address'],
            $input['city'],
            $input['notes'] ?? '',
            $input['shipping_method'],
            $input['payment_method'],
            $input['total'],
        ]);

        $orderId = $pdo->lastInsertId();

        $stmtItem = $pdo->prepare("
            INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmtStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
        $stmtCheck = $pdo->prepare("SELECT stock FROM products WHERE id = ? FOR UPDATE");

        foreach ($input['items'] as $item) {
            $stmtItem->execute([
                $orderId,
                $item['product_id'],
                $item['product_name'],
                $item['product_price'],
                $item['quantity'],
            ]);

            // Kurangi stok realtime
            $stmtCheck->execute([$item['product_id']]);
            $row = $stmtCheck->fetch();
            if (!$row || $row['stock'] < $item['quantity']) {
                throw new Exception("Stok '{$item['product_name']}' tidak mencukupi. Sisa: " . ($row ? $row['stock'] : 0));
            }
            $stmtStock->execute([$item['quantity'], $item['product_id'], $item['quantity']]);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'order_code' => $orderCode,
            'id' => $orderId,
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Gagal menyimpan pesanan: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
