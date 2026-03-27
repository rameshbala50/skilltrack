<?php
require_once __DIR__ . '/_common.php';

if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json; charset=utf-8');

$uid = requireSession();
$body = getBody();
$url = trim($body['url'] ?? '');

if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    jsonOut(false, null, 'Please enter a valid URL.');
}

// Only allow http/https
$scheme = parse_url($url, PHP_URL_SCHEME);
if (!in_array($scheme, ['http', 'https'])) {
    jsonOut(false, null, 'Only HTTP/HTTPS URLs are supported.');
}

// Fetch the page
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    CURLOPT_HTTPHEADER     => [
        'Accept: text/html,application/xhtml+xml',
        'Accept-Language: en-US,en;q=0.9',
    ],
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if (!$html || $httpCode >= 400) {
    $msg = $error ?: "Server returned HTTP $httpCode";
    jsonOut(false, null, "Could not fetch the page: $msg. Try copying the job text manually.");
}

// ── Extract meaningful text from HTML ────────────────────────────────

// Special handling for Dice.com — job description is in RSC data
$isDice = strpos($url, 'dice.com') !== false;
if ($isDice) {
    $diceText = '';
    // Method 1: dangerouslySetInnerHTML with unicode-escaped HTML
    if (preg_match('/dangerouslySetInnerHTML.*?"__html":"((?:[^"\\\\]|\\\\.)*)"/s', $html, $dm)) {
        $raw = $dm[1];
        // Decode unicode escapes (\u003c = <, \u003e = >, etc.)
        $raw = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function($m) {
            return mb_convert_encoding(pack('H*', $m[1]), 'UTF-8', 'UCS-2BE');
        }, $raw);
        $raw = str_replace(['\\n', '\\t', '\\"', '\\\\'], ["\n", "\t", '"', '\\'], $raw);
        $diceText = strip_tags($raw);
    }
    // Method 2: Look for jobDescription div content in RSC
    if (empty($diceText) && preg_match('/jobDescription">(.*?)(?:<\/div>|<\/section>)/si', $html, $dm)) {
        $diceText = strip_tags($dm[1]);
    }
    // Method 3: Extract from og:description as fallback
    if (empty($diceText) && preg_match('/og:description[^>]+content="([^"]+)"/i', $html, $dm)) {
        $diceText = html_entity_decode($dm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    if (!empty($diceText)) {
        $diceText = html_entity_decode($diceText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $diceText = preg_replace('/[ \t]+/', ' ', $diceText);
        $diceText = preg_replace('/\n\s*\n\s*\n/', "\n\n", $diceText);
        $diceText = trim($diceText);

        // Extract job title, company, location from RSC or og:title
        $title = ''; $company = ''; $location = ''; $posted = '';
        if (preg_match('/\\\\"jobTitle\\\\":\s*\\\\"([^"\\\\]+)/', $html, $tm)) $title = $tm[1];
        if (preg_match('/\\\\"companyName\\\\":\s*\\\\"([^"\\\\]+)/', $html, $cm)) $company = $cm[1];
        if (preg_match('/\\\\"formattedLocation\\\\":\s*\\\\"([^"\\\\]+)/', $html, $lm)) $location = $lm[1];
        // Fallback: og:title = "Role - Company - Location"
        if ((!$title || !$company) && preg_match('/og:title[^>]+content="([^"]+)"/i', $html, $ogm)) {
            $parts = explode(' - ', $ogm[1]);
            if (!$title && count($parts) >= 1) $title = trim($parts[0]);
            if (!$company && count($parts) >= 2) $company = trim($parts[1]);
            if (!$location && count($parts) >= 3) $location = trim(str_replace(' | Dice.com', '', $parts[2]));
        }
        // Posted time from og:description
        if (preg_match('/(\d+\s+(?:hours?|days?|minutes?)\s+ago)/i', $html, $pm)) $posted = $pm[1];
        // Build header
        $headerParts = array_filter([$company, $title, $location, $posted]);
        if (!empty($headerParts)) {
            $diceText = implode("\n", $headerParts) . "\n\n" . $diceText;
        }

        if (strlen($diceText) >= 50) {
            $diceText = mb_substr($diceText, 0, 8000);
            jsonOut(true, ['text' => $diceText, 'url' => $url]);
        }
    }
}

// Remove script, style, nav, header, footer tags
$html = preg_replace('#<(script|style|nav|header|footer|noscript)[^>]*>.*?</\1>#si', '', $html);

// Remove HTML comments
$html = preg_replace('/<!--.*?-->/s', '', $html);

// Try to find job description in common containers
$text = '';

// Method 1: Look for common job description selectors via regex
$patterns = [
    '#<(article|section|div)[^>]*class="[^"]*(?:job-description|jobDescription|job-details|description__text|jobsearch-jobDescriptionText|JobDescription|posting-requirements|job-posting-content|dhi-job-description)[^"]*"[^>]*>(.*?)</\1>#si',
    '#<div[^>]*id="[^"]*(?:job-description|jobDescription|job-details|jobDescriptionText)[^"]*"[^>]*>(.*?)</div>#si',
    '#<div[^>]*class="[^"]*(?:show-more-less-html__markup|description__text)[^"]*"[^>]*>(.*?)</div>#si',
];

foreach ($patterns as $pattern) {
    if (preg_match($pattern, $html, $m)) {
        $text = $m[2] ?? $m[1];
        break;
    }
}

// Method 2: Look for the largest text block in the page
if (empty($text)) {
    // Get the body content
    if (preg_match('#<body[^>]*>(.*)</body>#si', $html, $m)) {
        $bodyHtml = $m[1];
    } else {
        $bodyHtml = $html;
    }

    // Remove remaining tags but keep structure with newlines
    $bodyHtml = preg_replace('#<(br|hr|/p|/div|/li|/tr|/h[1-6])[^>]*>#i', "\n", $bodyHtml);
    $bodyHtml = preg_replace('#<li[^>]*>#i', "\n• ", $bodyHtml);
    $text = strip_tags($bodyHtml);
}

// Clean up extracted text
if (!empty($text)) {
    // Convert HTML to readable text
    $text = preg_replace('#<(br|hr|/p|/div|/li|/tr|/h[1-6])[^>]*>#i', "\n", $text);
    $text = preg_replace('#<li[^>]*>#i', "\n• ", $text);
    $text = strip_tags($text);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // Normalize whitespace
    $text = preg_replace('/[ \t]+/', ' ', $text);
    $text = preg_replace('/\n\s*\n\s*\n/', "\n\n", $text);
    $text = trim($text);
}

if (empty($text) || strlen($text) < 50) {
    jsonOut(false, null, 'Could not extract job description. This site may require JavaScript or block automated access. Try copying the job text manually.');
}

// Truncate to reasonable length
$text = mb_substr($text, 0, 8000);

jsonOut(true, ['text' => $text, 'url' => $url]);
