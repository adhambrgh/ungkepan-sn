<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ─── Upload dir ───
$uploadDir = __DIR__ . '/../uploads/';

function handleImageUpload(): string {
    global $uploadDir;
    // Cek upload file (dikirim dengan key 'imageFile')
    $fileKey = 'imageFile';
    if (!empty($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(['error' => 'Format gambar tidak didukung. Gunakan: ' . implode(', ', $allowed)]);
            exit;
        }
        $filename = 'product_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        move_uploaded_file($_FILES[$fileKey]['tmp_name'], $uploadDir . $filename);
        return 'uploads/' . $filename;
    }
    // Fallback ke URL dari form-data atau JSON
    if (isset($_POST['image'])) return $_POST['image'];
    return '';
}

function getInput(): array {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($ct, 'multipart/form-data') || !empty($_FILES)) {
        return $_POST;
    }
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

$method = $_SERVER['REQUEST_METHOD'];

// GET — ambil semua produk (dengan kategori + pagination)
if ($method === 'GET') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $total = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    $stmt = $pdo->prepare("
        SELECT p.*, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
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

// POST — tambah produk baru
if ($method === 'POST') {
    $input = getInput();
    $image = !empty($input['image']) ? $input['image'] : handleImageUpload();

    $stmt = $pdo->prepare("
        INSERT INTO products (category_id, name, price, image, description, weight, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $input['category_id'],
        $input['name'],
        $input['price'],
        $image,
        $input['description'] ?? '',
        $input['weight'] ?? '',
        $input['stock'] ?? 0,
    ]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'image' => $image]);
    exit;
}

// PUT — update produk (full) atau toggle featured (partial)
if ($method === 'PUT') {
    $input = getInput();
    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID produk required']);
        exit;
    }

    // Featured toggle (partial update — cukup is_featured saja)
    if (array_key_exists('is_featured', $input)) {
        try {
            $stmt = $pdo->prepare("UPDATE products SET is_featured = ? WHERE id = ?");
            $stmt->execute([$input['is_featured'] ? 1 : 0, $input['id']]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Gagal update favorit. Jalankan SQL: ALTER TABLE products ADD is_featured TINYINT(1) DEFAULT 0']);
        }
        exit;
    }

    // Full update produk
    $newImage = !empty($input['image']) ? $input['image'] : handleImageUpload();
    if (empty($newImage)) {
        $stmt = $pdo->prepare("SELECT image FROM products WHERE id=?");
        $stmt->execute([$input['id']]);
        $newImage = $stmt->fetchColumn() ?: '';
    }

    $stmt = $pdo->prepare("
        UPDATE products SET category_id=?, name=?, price=?, image=?, description=?, weight=?, stock=?
        WHERE id=?
    ");
    $stmt->execute([
        $input['category_id'],
        $input['name'],
        $input['price'],
        $newImage,
        $input['description'] ?? '',
        $input['weight'] ?? '',
        $input['stock'] ?? 0,
        $input['id'],
    ]);
    echo json_encode(['success' => true]);
    exit;
}

// DELETE — hapus produk
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID produk required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
