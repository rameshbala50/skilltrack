<?php
require_once __DIR__ . '/_common.php';

// Start session here so cookie params from _common.php are applied
if (session_status() === PHP_SESSION_NONE) session_start();

// Emails that are automatically assigned the 'admin' role on registration
define('ADMIN_EMAILS', ['w3help@yahoo.com']);

header('Content-Type: application/json; charset=utf-8');

// Support GET ?action=logout for href-based logout links
$action = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
} else {
    $body = getBody();
    $action = $body['action'] ?? '';
}

// ── Shared helper: read global email index ────────────────────────────────────

function readIndex(): array {
    $path = DATA_PATH . 'index.json';
    if (!file_exists($path)) return ['emails' => []];
    $content = file_get_contents($path);
    if ($content === false) return ['emails' => []];
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : ['emails' => []];
}

function writeIndex(array $index): bool {
    $dir = DATA_PATH;
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) return false;
    }
    $path = $dir . 'index.json';
    return file_put_contents($path, json_encode($index, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
}

// ── Actions ───────────────────────────────────────────────────────────────────

switch ($action) {

    // ── register ─────────────────────────────────────────────────────────────
    case 'register': {
        $name     = trim($body['name']     ?? '');
        $email    = trim($body['email']    ?? '');
        $password = $body['password']      ?? '';

        if (empty($name)) {
            jsonOut(false, null, 'Name is required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonOut(false, null, 'Invalid email address.');
        }
        if (strlen($password) < 8) {
            jsonOut(false, null, 'Password must be at least 8 characters.');
        }

        $index = readIndex();
        $emailKey = strtolower($email);
        if (isset($index['emails'][$emailKey])) {
            jsonOut(false, null, 'An account with that email already exists.');
        }

        $uid          = strtolower($email);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $now          = date('c');
        $role         = in_array(strtolower($email), array_map('strtolower', ADMIN_EMAILS))
                        ? 'admin' : 'webuser';

        $profile = [
            'uid'          => $uid,
            'name'         => $name,
            'email'        => $email,
            'role'         => $role,
            'passwordHash' => $passwordHash,
            'createdAt'    => $now,
        ];

        if (!writeJson($uid, 'profile', $profile)) {
            jsonOut(false, null, 'Failed to create user profile. Check server storage permissions.');
        }

        $index['emails'][$emailKey] = $uid;
        if (!writeIndex($index)) {
            jsonOut(false, null, 'Failed to update user index. Check server storage permissions.');
        }

        $_SESSION['uid']         = $uid;
        $_SESSION['name']        = $name;
        $_SESSION['email']       = $email;
        $_SESSION['role']        = $role;
        $_SESSION['last_active'] = time();

        jsonOut(true, ['user' => ['uid' => $uid, 'name' => $name, 'email' => $email, 'role' => $role]]);
        break;
    }

    // ── login ─────────────────────────────────────────────────────────────────
    case 'login': {
        $email    = trim($body['email']    ?? '');
        $password = $body['password']      ?? '';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonOut(false, null, 'Invalid email address.');
        }
        if (empty($password)) {
            jsonOut(false, null, 'Password is required.');
        }

        $index    = readIndex();
        $emailKey = strtolower($email);

        if (!isset($index['emails'][$emailKey])) {
            jsonOut(false, null, 'Invalid email or password.');
        }

        $uid     = $index['emails'][$emailKey];
        $profile = readJson($uid, 'profile');

        if (empty($profile) || !isset($profile['passwordHash'])) {
            jsonOut(false, null, 'User profile not found. Please contact support.');
        }

        if (!password_verify($password, $profile['passwordHash'])) {
            jsonOut(false, null, 'Invalid email or password.');
        }

        // Assign admin role if email is in admin list (handles existing accounts before roles were added)
        $role = $profile['role'] ?? (
            in_array(strtolower($email), array_map('strtolower', ADMIN_EMAILS)) ? 'admin' : 'webuser'
        );

        session_regenerate_id(true);
        $_SESSION['uid']         = $uid;
        $_SESSION['name']        = $profile['name'];
        $_SESSION['email']       = $profile['email'];
        $_SESSION['role']        = $role;
        $_SESSION['last_active'] = time();

        jsonOut(true, [
            'user' => [
                'uid'   => $uid,
                'name'  => $profile['name'],
                'email' => $profile['email'],
                'role'  => $role,
            ],
        ]);
        break;
    }

    // ── logout ────────────────────────────────────────────────────────────────
    case 'logout': {
        session_unset();
        session_destroy();

        // Redirect to index if this was a GET request (href link)
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            header('Location: ../index.html');
            exit;
        }

        jsonOut(true, null);
        break;
    }

    // ── me ────────────────────────────────────────────────────────────────────
    case 'me': {
        $uid  = requireSession();
        $role = $_SESSION['role'] ?? '';
        if (!$role) {
            // Session predates role system — read from profile and cache in session
            $profile = readJson($uid, 'profile');
            $role = $profile['role'] ?? (
                in_array(strtolower($_SESSION['email'] ?? ''), array_map('strtolower', ADMIN_EMAILS)) ? 'admin' : 'webuser'
            );
            $_SESSION['role'] = $role;
        }
        jsonOut(true, [
            'user' => [
                'uid'   => $uid,
                'name'  => $_SESSION['name']  ?? '',
                'email' => $_SESSION['email'] ?? '',
                'role'  => $role,
            ],
        ]);
        break;
    }

    // ── update_name (requires active session) ───────────────────────────────
    case 'update_name': {
        $uid     = requireSession();
        $newName = trim($body['name'] ?? '');
        if (empty($newName)) {
            jsonOut(false, null, 'Name is required.');
        }

        $profile = readJson($uid, 'profile');
        if (!$profile) {
            jsonOut(false, null, 'User profile not found.');
        }

        $profile['name'] = $newName;
        if (!writeJson($uid, 'profile', $profile)) {
            jsonOut(false, null, 'Failed to update name.');
        }

        $_SESSION['name'] = $newName;
        jsonOut(true, ['name' => $newName]);
        break;
    }

    // ── reset_password (self-service, no auth required) ─────────────────────
    case 'reset_password': {
        $email       = trim($body['email']       ?? '');
        $newPassword = $body['newPassword']      ?? '';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonOut(false, null, 'Invalid email address.');
        }
        if (strlen($newPassword) < 8) {
            jsonOut(false, null, 'Password must be at least 8 characters.');
        }

        $index    = readIndex();
        $emailKey = strtolower($email);

        if (!isset($index['emails'][$emailKey])) {
            jsonOut(false, null, 'No account found with that email.');
        }

        $uid     = $index['emails'][$emailKey];
        $profile = readJson($uid, 'profile');
        if (!$profile) {
            jsonOut(false, null, 'User profile not found.');
        }

        $profile['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
        if (!writeJson($uid, 'profile', $profile)) {
            jsonOut(false, null, 'Failed to update password.');
        }

        jsonOut(true, null);
        break;
    }

    // ── change_password (requires active session) ─────────────────────────
    case 'change_password': {
        $uid             = requireSession();
        $currentPassword = $body['currentPassword'] ?? '';
        $newPassword     = $body['newPassword']     ?? '';

        if (empty($currentPassword)) {
            jsonOut(false, null, 'Current password is required.');
        }
        if (strlen($newPassword) < 8) {
            jsonOut(false, null, 'New password must be at least 8 characters.');
        }

        $profile = readJson($uid, 'profile');
        if (!$profile || !isset($profile['passwordHash'])) {
            jsonOut(false, null, 'User profile not found.');
        }

        if (!password_verify($currentPassword, $profile['passwordHash'])) {
            jsonOut(false, null, 'Current password is incorrect.');
        }

        $profile['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
        if (!writeJson($uid, 'profile', $profile)) {
            jsonOut(false, null, 'Failed to update password.');
        }

        jsonOut(true, null);
        break;
    }

    // ── unknown ───────────────────────────────────────────────────────────────
    default: {
        jsonOut(false, null, 'Unknown action: ' . htmlspecialchars($action));
        break;
    }
}
