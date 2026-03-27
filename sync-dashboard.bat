@echo off
REM Syncs dashboard.html -> dashboard.php while preserving the PHP header and PHP injection
REM Usage: sync-dashboard.bat

powershell -ExecutionPolicy Bypass -Command ^
  "$html = Get-Content '%~dp0dashboard.html' -Raw;" ^
  "$html = $html -replace '<!-- MIRROR SYNC:.*?-->\r?\n', '';" ^
  "$html = $html -replace '(?s)(<!-- Inline: set user info.*?)\r?\n\s*var s = null;', '$1`r`n      // Server mode: PHP injects session data directly`r`n      var s = <?php echo $_st_user_json; ?>;`r`n      if (!s || !s.uid) { s = null;';" ^
  "$phpHeader = @'`r`n<?php`r`n// MIRROR SYNC: This file must be kept in sync with dashboard.html.`r`n// Any structural changes (panels, modals, nav items, scripts) must be`r`n// applied to BOTH files. dashboard.php is the server-mode entry point;`r`n// dashboard.html is the local/file-mode entry point.`r`nrequire_once __DIR__ . '/api/_common.php';`r`nstartAppSession();`r`nif (!isset($_SESSION['uid'])) {`r`n    header('Location: index.html');`r`n    exit;`r`n}`r`n$_st_user_json = json_encode([`r`n    'uid'   => $_SESSION['uid']   ?? '',`r`n    'name'  => $_SESSION['name']  ?? '',`r`n    'email' => $_SESSION['email'] ?? '',`r`n    'role'  => $_SESSION['role']  ?? 'webuser',`r`n], JSON_HEX_TAG | JSON_HEX_APOS);`r`nsession_write_close();`r`n?>`r`n`r`n'@;" ^
  "Set-Content '%~dp0dashboard.php' ($phpHeader + $html) -NoNewline;" ^
  "Write-Host 'dashboard.php synced OK' -ForegroundColor Green"
