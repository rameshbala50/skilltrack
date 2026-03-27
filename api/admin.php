<?php
require_once __DIR__ . '/_common.php';

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json; charset=utf-8');

// ── Auth guard (any logged-in user) ──────────────────────────────────
$uid    = requireSession();
$body   = getBody();
$action = $body['action'] ?? '';

// requireAdmin() is defined in _common.php — no need to redeclare here

// ── Template storage path ─────────────────────────────────────────────
function adminTemplatesPath(): string {
    // DATA_PATH = /home/.../skilltrack-data/users/
    // We store templates at /home/.../skilltrack-data/admin-templates.json
    $base = dirname(rtrim(DATA_PATH, DIRECTORY_SEPARATOR));
    return $base . DIRECTORY_SEPARATOR . 'admin-templates.json';
}

function readAdminTemplates(): array {
    $path = adminTemplatesPath();
    if (!file_exists($path)) return [];
    $raw = file_get_contents($path);
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function writeAdminTemplates(array $templates): bool {
    $path = adminTemplatesPath();
    $dir  = dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return file_put_contents($path, json_encode($templates, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
}

// ── User helpers ─────────────────────────────────────────────────────
function readIndex(): array {
    $path = DATA_PATH . 'index.json';
    if (!file_exists($path)) return ['emails' => []];
    $decoded = json_decode(file_get_contents($path), true);
    return is_array($decoded) ? $decoded : ['emails' => []];
}

function writeIndex(array $index): bool {
    $path = DATA_PATH . 'index.json';
    return file_put_contents($path, json_encode($index, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
}

function listAllUsers(): array {
    $index = readIndex();
    $users = [];
    foreach (($index['emails'] ?? []) as $emailKey => $userUid) {
        $profile = readJson($userUid, 'profile');
        if ($profile) {
            $users[] = [
                'uid'       => $userUid,
                'name'      => $profile['name']      ?? '',
                'email'     => $profile['email']     ?? $emailKey,
                'role'      => $profile['role']      ?? 'webuser',
                'createdAt' => $profile['createdAt'] ?? '',
            ];
        }
    }
    usort($users, fn($a, $b) => strcmp($a['createdAt'], $b['createdAt']));
    return $users;
}

// ── Actions ───────────────────────────────────────────────────────────
switch ($action) {

    // ── get_templates ────────────────────────────────────────────────
    case 'get_templates': {
        jsonOut(true, ['templates' => readAdminTemplates()]);
        break;
    }

    // ── save_all_templates ───────────────────────────────────────────
    case 'save_all_templates': {
        requireAdmin();
        $templates = $body['templates'] ?? [];
        if (!is_array($templates)) jsonOut(false, null, 'Invalid templates data.');
        if (!writeAdminTemplates($templates)) jsonOut(false, null, 'Failed to save templates.');
        jsonOut(true, ['count' => count($templates)]);
        break;
    }

    // ── list_users ───────────────────────────────────────────────────
    case 'list_users': {
        requireAdmin();
        jsonOut(true, ['users' => listAllUsers()]);
        break;
    }

    // ── update_user ──────────────────────────────────────────────────
    case 'update_user': {
        requireAdmin();
        $targetUid  = trim($body['uid']  ?? '');
        $newName    = trim($body['name'] ?? '');
        $newRole    = trim($body['role'] ?? '');
        $validRoles = ['admin', 'webuser', 'webreader'];

        if (!$targetUid) jsonOut(false, null, 'User ID required.');
        if (!$newName)   jsonOut(false, null, 'Name is required.');
        if (!in_array($newRole, $validRoles)) jsonOut(false, null, 'Invalid role.');

        $profile = readJson($targetUid, 'profile');
        if (!$profile) jsonOut(false, null, 'User not found.');

        $profile['name'] = $newName;
        $profile['role'] = $newRole;
        if (!writeJson($targetUid, 'profile', $profile)) jsonOut(false, null, 'Failed to save user.');

        jsonOut(true, ['uid' => $targetUid, 'name' => $newName, 'role' => $newRole]);
        break;
    }

    // ── set_role ─────────────────────────────────────────────────────
    case 'set_role': {
        requireAdmin();
        $targetUid  = trim($body['uid']  ?? '');
        $newRole    = trim($body['role'] ?? '');
        $validRoles = ['admin', 'webuser', 'webreader'];

        if (!$targetUid) jsonOut(false, null, 'User ID required.');
        if (!in_array($newRole, $validRoles)) jsonOut(false, null, 'Invalid role.');

        $profile = readJson($targetUid, 'profile');
        if (!$profile) jsonOut(false, null, 'User not found.');

        $profile['role'] = $newRole;
        if (!writeJson($targetUid, 'profile', $profile)) jsonOut(false, null, 'Failed to save role.');

        jsonOut(true, ['uid' => $targetUid, 'role' => $newRole]);
        break;
    }

    // ── delete_user ──────────────────────────────────────────────────
    case 'delete_user': {
        requireAdmin();
        $targetUid = trim($body['uid'] ?? '');
        if (!$targetUid) jsonOut(false, null, 'User ID required.');

        // Prevent self-deletion
        if ($targetUid === $uid) jsonOut(false, null, 'You cannot delete your own account.');

        $profile = readJson($targetUid, 'profile');
        if (!$profile) jsonOut(false, null, 'User not found.');

        // Remove from index
        $index = readIndex();
        $emailKey = strtolower($profile['email'] ?? '');
        unset($index['emails'][$emailKey]);
        if (!writeIndex($index)) jsonOut(false, null, 'Failed to update user index.');

        // Move user directory to deleted-users archive
        $userDir = userDir($targetUid);
        if (is_dir($userDir)) {
            $deletedBase = dirname(rtrim(DATA_PATH, DIRECTORY_SEPARATOR)) . DIRECTORY_SEPARATOR . 'deleted-users';
            if (!is_dir($deletedBase)) @mkdir($deletedBase, 0755, true);
            $timestamp = date('Ymd_His');
            $archiveDir = $deletedBase . DIRECTORY_SEPARATOR . $targetUid . '_' . $timestamp;
            if (!@rename($userDir, $archiveDir)) {
                // Fallback: copy files then delete originals
                @mkdir($archiveDir, 0755, true);
                $files = glob(rtrim($userDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*');
                foreach ($files as $f) {
                    if (is_file($f)) {
                        @copy($f, $archiveDir . DIRECTORY_SEPARATOR . basename($f));
                        @unlink($f);
                    }
                }
                @rmdir($userDir);
            }
        }

        jsonOut(true, ['uid' => $targetUid]);
        break;
    }

    // ── reset_user_password ─────────────────────────────────────────
    case 'reset_user_password': {
        requireAdmin();
        $targetUid   = trim($body['uid']         ?? '');
        $newPassword = $body['newPassword']      ?? '';

        if (!$targetUid) jsonOut(false, null, 'User ID required.');
        if (strlen($newPassword) < 8) jsonOut(false, null, 'Password must be at least 8 characters.');

        $profile = readJson($targetUid, 'profile');
        if (!$profile) jsonOut(false, null, 'User not found.');

        $profile['passwordHash'] = password_hash($newPassword, PASSWORD_BCRYPT);
        if (!writeJson($targetUid, 'profile', $profile)) jsonOut(false, null, 'Failed to update password.');

        jsonOut(true, ['uid' => $targetUid]);
        break;
    }

    default:
        jsonOut(false, null, 'Unknown action.');
}
