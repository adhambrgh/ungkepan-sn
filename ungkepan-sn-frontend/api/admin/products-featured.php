<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;
$is_featured = $input['is_featured'] ?? null;

if (!$id || $is_featured === null) {
    http_response_code(400);
    echo json_encode(['error' => 'ID dan is_featured required']);
    exit;
}

$stmt = $pdo->prepare("UPDATE products SET is_featured = ? WHERE id = ?");
$stmt->execute([$is_featured ? 1 : 0, $id]);

echo json_encode(['success' => true]);
