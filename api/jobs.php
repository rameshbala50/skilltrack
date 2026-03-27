<?php
require_once __DIR__ . '/_common.php';

header('Content-Type: application/json; charset=utf-8');

$uid  = requireSession();
$body = getBody();

$action = $body['action'] ?? '';

switch ($action) {

    case 'list': {
        $data = readJson($uid, 'jobs');
        jsonOut(true, $data);
        break;
    }

    case 'sync': {
        $data = $body['data'] ?? [];
        if (!is_array($data)) {
            jsonOut(false, null, 'Invalid data: expected an array.');
        }
        if (!writeJson($uid, 'jobs', $data)) {
            jsonOut(false, null, 'Failed to save jobs. Check server storage permissions.');
        }
        jsonOut(true, null);
        break;
    }

    default: {
        jsonOut(false, null, 'Unknown action: ' . htmlspecialchars($action));
        break;
    }
}
