<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — semua review (dengan pagination)
if ($method === 'GET') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $total = $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
    $stmt = $pdo->prepare("
        SELECT r.*, p.name as product_name, p.category_id,
               c.name as category_name
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$perPage, $offset]);

    echo json_encode([
        'data' => $stmt->fetchAll(),
        'total' => (int)$total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
    exit;
}

// PUT — update review (approve / edit)
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID review required']);
        exit;
    }

    // Toggle approve
    if (array_key_exists('is_approved', $input)) {
        $stmt = $pdo->prepare("UPDATE reviews SET is_approved = ? WHERE id = ?");
        $stmt->execute([$input['is_approved'] ? 1 : 0, $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Field tidak dikenal']);
    exit;
}

// DELETE — hapus review
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID review required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
