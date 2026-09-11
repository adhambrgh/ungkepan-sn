<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil konten by page
if ($method === 'GET') {
    $page = $_GET['page'] ?? 'about';
    $stmt = $pdo->prepare("SELECT page, content, updated_at FROM site_content WHERE page = ?");
    $stmt->execute([$page]);
    $row = $stmt->fetch();
    if ($row) {
        $row['content'] = json_decode($row['content'], true);
        echo json_encode($row);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Konten tidak ditemukan']);
    }
    exit;
}

// PUT — update konten
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['page']) || empty($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Page dan content wajib diisi']);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO site_content (page, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)");
    $stmt->execute([$input['page'], json_encode($input['content'])]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
