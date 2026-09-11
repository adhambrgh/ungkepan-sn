<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil konten berdasarkan page
if ($method === 'GET') {
    $page = $_GET['page'] ?? 'about';
    $stmt = $pdo->prepare("SELECT content FROM site_content WHERE page = ?");
    $stmt->execute([$page]);
    $row = $stmt->fetch();
    if ($row) {
        echo $row['content'];
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Konten tidak ditemukan']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
