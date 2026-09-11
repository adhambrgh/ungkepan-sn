<?php
header('Content-Type: application/json');

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://ungkepan-sn.test',
    'http://ungkepan-sn-frontend.test',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'ungkepan_sn';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Koneksi database gagal']);
    exit;
}

/**
 * Verifikasi admin token via sha256 hash lookup.
 * Return admin data jika valid, atau null jika tidak.
 */
function verifyAdminToken(): ?array
{
    global $pdo;

    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';

    if (!str_starts_with($auth, 'Bearer ')) {
        return null;
    }

    $token = substr($auth, 7);
    $hash = hash('sha256', $token);

    $stmt = $pdo->prepare('SELECT id, username FROM admins WHERE api_token = ? LIMIT 1');
    $stmt->execute([$hash]);
    $admin = $stmt->fetch();

    return $admin ?: null;
}
