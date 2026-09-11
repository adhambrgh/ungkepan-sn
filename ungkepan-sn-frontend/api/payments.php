<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$stmt = $pdo->query("SELECT * FROM payment_config WHERE is_active = 1 ORDER BY sort_order ASC");
echo json_encode($stmt->fetchAll());
