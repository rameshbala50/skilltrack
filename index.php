<?php
require_once __DIR__ . '/api/_common.php';
$loggedIn = startAppSession();
if ($loggedIn && isset($_SESSION['uid'])) {
    header('Location: dashboard.php');
} else {
    header('Location: index.html');
}
exit;
