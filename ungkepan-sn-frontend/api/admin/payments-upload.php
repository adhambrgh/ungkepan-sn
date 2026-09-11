<?php
require_once __DIR__ . '/../config.php';

$admin = verifyAdminToken();
if (!$admin) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID required']);
    exit;
}

if (empty($_FILES['qrisFile']) || $_FILES['qrisFile']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'File gambar tidak valid']);
    exit;
}

$ext = strtolower(pathinfo($_FILES['qrisFile']['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp'];
if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Format tidak didukung. Gunakan: ' . implode(', ', $allowed)]);
    exit;
}

$filename = 'qris_' . $id . '_' . time() . '.' . $ext;
move_uploaded_file($_FILES['qrisFile']['tmp_name'], $uploadDir . $filename);

$path = 'uploads/' . $filename;
$stmt = $pdo->prepare("UPDATE payment_config SET qris_image = ? WHERE id = ?");
$stmt->execute([$path, $id]);

echo json_encode(['success' => true, 'qris_image' => $path]);
