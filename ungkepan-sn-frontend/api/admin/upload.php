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

$fileKey = 'file';
if (empty($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'File tidak valid']);
    exit;
}

$ext = strtolower(pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(['error' => 'Format tidak didukung. Gunakan: ' . implode(', ', $allowed)]);
    exit;
}

$filename = 'hero_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
move_uploaded_file($_FILES[$fileKey]['tmp_name'], $uploadDir . $filename);

$path = 'uploads/' . $filename;

echo json_encode(['success' => true, 'url' => $path]);
