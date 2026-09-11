<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';

$method = $_SERVER['REQUEST_METHOD'];

// GET — semua payment config
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM payment_config ORDER BY sort_order ASC");
    echo json_encode($stmt->fetchAll());
    exit;
}

// POST — tambah
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("
        INSERT INTO payment_config (method, label, account_name, account_number, bank_name, qris_image, logo, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $input['method'],
        $input['label'],
        $input['account_name'] ?? '',
        $input['account_number'] ?? '',
        $input['bank_name'] ?? '',
        $input['qris_image'] ?? '',
        $input['logo'] ?? '',
        $input['is_active'] ?? 1,
        $input['sort_order'] ?? 0,
    ]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}

// PUT — update
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }
    $stmt = $pdo->prepare("
        UPDATE payment_config SET method=?, label=?, account_name=?, account_number=?, bank_name=?, qris_image=?, logo=?, is_active=?, sort_order=?
        WHERE id=?
    ");
    $stmt->execute([
        $input['method'],
        $input['label'],
        $input['account_name'] ?? '',
        $input['account_number'] ?? '',
        $input['bank_name'] ?? '',
        $input['qris_image'] ?? '',
        $input['logo'] ?? '',
        $input['is_active'] ?? 1,
        $input['sort_order'] ?? 0,
        $input['id'],
    ]);
    echo json_encode(['success' => true]);
    exit;
}

// DELETE
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM payment_config WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
