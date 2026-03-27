<?php
require_once __DIR__ . '/config.php';

// ── Session configuration (must be set before session_start) ──────────────────
// Store sessions above web root so they survive GoDaddy's /tmp cleanup
$_st_sess_path = dirname($_SERVER['DOCUMENT_ROOT']) . '/skilltrack-sessions';
if (!is_dir($_st_sess_path)) @mkdir($_st_sess_path, 0700, true);
if (is_dir($_st_sess_path) && is_writable($_st_sess_path)) {
    session_save_path($_st_sess_path);
}
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_path', '/');

/**
 * Output a JSON response and exit.
 *
 * @param bool        $ok    Whether the request succeeded.
 * @param mixed       $data  Payload to return on success.
 * @param string      $error Error message to return on failure.
 */
function jsonOut(bool $ok, $data = null, string $error = ''): void {
    header('Content-Type: application/json; charset=utf-8');
    if ($ok) {
        echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

/**
 * Read and decode the JSON request body.
 *
 * @return array Decoded associative array; empty array if body is missing/invalid.
 */
function getBody(): array {
    static $cached = null;
    if ($cached !== null) return $cached;
    $raw = file_get_contents('php://input');
    if (!$raw) { $cached = []; return $cached; }
    $decoded = json_decode($raw, true);
    $cached = is_array($decoded) ? $decoded : [];
    return $cached;
}

/**
 * Start the application session and validate the inactivity timeout.
 *
 * @return bool True if a valid, active session exists; false otherwise.
 */
function startAppSession(): bool {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (!isset($_SESSION['uid'])) {
        return false;
    }
    if (isset($_SESSION['last_active']) && (time() - $_SESSION['last_active']) > SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        return false;
    }
    $_SESSION['last_active'] = time();
    return true;
}

/**
 * Require a valid session. Outputs an error JSON response and exits if not authenticated.
 *
 * @return string The authenticated user's uid.
 */
function requireSession(): string {
    $valid = startAppSession();
    if (!$valid || !isset($_SESSION['uid'])) {
        jsonOut(false, null, 'Not authenticated');
    }
    // Admin "Work as user" — if as_uid is set and caller is admin, use target uid
    $body = getBody();
    $asUid = $body['as_uid'] ?? '';
    if ($asUid && ($_SESSION['role'] ?? '') === 'admin') {
        if (!preg_match('/^[a-zA-Z0-9@._\-]+$/', $asUid)) {
            jsonOut(false, null, 'Invalid target user ID');
        }
        return $asUid;
    }
    return $_SESSION['uid'];
}

/**
 * Return the data directory path for a given user.
 * Validates the uid to prevent path traversal attacks.
 *
 * @param string $uid User ID.
 * @return string Absolute directory path (with trailing slash).
 */
function userDir(string $uid): string {
    if (!preg_match('/^[a-zA-Z0-9@._\-]+$/', $uid)) {
        jsonOut(false, null, 'Invalid user ID');
    }
    return DATA_PATH . $uid . DIRECTORY_SEPARATOR;
}

/**
 * Require that the authenticated user has admin role.
 * Outputs an error JSON response and exits if not admin.
 */
function requireAdmin(): void {
    requireSession(); // ensure session is active first
    if (($_SESSION['role'] ?? '') !== 'admin') {
        jsonOut(false, null, 'Admin access required');
    }
}

/**
 * Get a parameter from the request body, with optional default.
 *
 * @param array  $body    Decoded request body array.
 * @param string $key     Parameter name.
 * @param mixed  $default Default value if key is missing.
 * @return mixed
 */
function getParam(array $body, string $key, $default = '') {
    return $body[$key] ?? $default;
}

/**
 * Read a JSON data file for a user module.
 *
 * @param string $uid    User ID.
 * @param string $module Module name (e.g. 'goals', 'skills').
 * @return array Decoded data; empty array if file does not exist or is invalid.
 */
function readJson(string $uid, string $module): array {
    $path = userDir($uid) . $module . '.json';
    if (!file_exists($path)) return [];
    $content = file_get_contents($path);
    if ($content === false) return [];
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Write data to a JSON file for a user module.
 *
 * Creates the user directory recursively if it does not exist.
 *
 * @param string $uid    User ID.
 * @param string $module Module name (e.g. 'goals', 'skills').
 * @param array  $data   Data to encode and store.
 * @return bool True on success, false on failure.
 */
function writeJson(string $uid, string $module, array $data): bool {
    $dir = userDir($uid);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            return false;
        }
    }
    $path = $dir . $module . '.json';
    $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($path, $encoded, LOCK_EX) !== false;
}

/**
 * Generate a unique user ID.
 *
 * @return string UID in the form 'u_<16 hex chars>'.
 */
function generateUid(): string {
    return 'u_' . bin2hex(random_bytes(8));
}
