<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil review
if ($method === 'GET') {
    $productId = $_GET['product_id'] ?? null;
    $testimonials = $_GET['testimonials'] ?? null;

    if ($testimonials === '1') {
        // Testimoni umum (product_id IS NULL) yang sudah disetujui
        $stmt = $pdo->query("
            SELECT id, name, rating, review, created_at
            FROM reviews
            WHERE product_id IS NULL AND is_approved = 1
            ORDER BY created_at DESC
        ");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    if ($productId) {
        // Review per produk (yang sudah disetujui)
        $stmt = $pdo->prepare("
            SELECT id, name, rating, review, created_at
            FROM reviews
            WHERE product_id = ? AND is_approved = 1
            ORDER BY created_at DESC
        ");
        $stmt->execute([$productId]);
        echo json_encode($stmt->fetchAll());
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Parameter tidak lengkap']);
    exit;
}

// POST — tambah review baru
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = trim($input['name'] ?? '');
    $rating = (int)($input['rating'] ?? 0);
    $review = trim($input['review'] ?? '');
    $productId = $input['product_id'] ?? null;

    if (!$name || !$rating || !$review) {
        http_response_code(400);
        echo json_encode(['error' => 'Nama, rating, dan review wajib diisi']);
        exit;
    }
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['error' => 'Rating harus 1-5']);
        exit;
    }

    // Semua review langsung disetujui
    $approved = 1;

    $stmt = $pdo->prepare("
        INSERT INTO reviews (product_id, name, rating, review, is_approved)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$productId, $name, $rating, $review, $approved]);

    echo json_encode(['success' => true, 'message' => 'Review terkirim!']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
