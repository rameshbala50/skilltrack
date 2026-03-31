<?php
/**
 * Dice Search Proxy — fetches a Dice search page and extracts job IDs,
 * or fetches a single job detail page and extracts metadata + description.
 */
require_once __DIR__ . '/_common.php';

if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json; charset=utf-8');

$uid = requireSession();
$body = getBody();
$action = $body['action'] ?? '';

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function curlFetch($url, $ua) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => $ua,
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html,application/xhtml+xml',
            'Accept-Language: en-US,en;q=0.9',
        ],
    ]);
    $html = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    return ['html' => $html, 'code' => $code, 'error' => $err];
}

// ── Action: search — fetch search page, return job IDs ──────────────
if ($action === 'search') {
    $url = trim($body['url'] ?? '');
    if (empty($url)) jsonOut(false, null, 'Missing search URL');

    $r = curlFetch($url, $ua);
    if (!$r['html'] || $r['code'] >= 400) {
        jsonOut(false, null, 'Fetch failed: ' . ($r['error'] ?: "HTTP {$r['code']}"));
    }

    preg_match_all('/\/job-detail\/([a-f0-9\-]+)/', $r['html'], $m);
    $ids = array_values(array_unique($m[1] ?? []));
    jsonOut(true, ['ids' => $ids, 'count' => count($ids)]);
}

// ── Action: detail — fetch job detail, return metadata + description ─
if ($action === 'detail') {
    $jobDiceId = trim($body['jobDiceId'] ?? '');
    if (empty($jobDiceId)) jsonOut(false, null, 'Missing jobDiceId');

    $url = "https://www.dice.com/job-detail/$jobDiceId";
    $r = curlFetch($url, $ua);
    if (!$r['html'] || $r['code'] >= 400) {
        jsonOut(false, null, 'Fetch failed');
    }
    $c = $r['html'];

    // Extract metadata from RSC JSON
    $title = ''; $company = ''; $location = '';
    if (preg_match('/\\\\"jobTitle\\\\":\s*\\\\"([^"\\\\]+)/', $c, $m)) $title = $m[1];
    if (preg_match('/\\\\"companyName\\\\":\s*\\\\"([^"\\\\]+)/', $c, $m)) $company = $m[1];
    if (preg_match('/\\\\"formattedLocation\\\\":\s*\\\\"([^"\\\\]+)/', $c, $m)) $location = $m[1];

    // Fallback: og:title
    if (!$title && preg_match('/og:title[^>]+content="([^"]+)"/i', $c, $ogm)) {
        $parts = explode(' - ', $ogm[1]);
        if (count($parts) >= 1) $title = trim($parts[0]);
        if (count($parts) >= 2 && !$company) $company = trim($parts[1]);
        if (count($parts) >= 3 && !$location) $location = trim(str_replace(' | Dice.com', '', $parts[2]));
    }

    if (!$title) jsonOut(false, null, 'Could not extract job title');

    // Location parsing
    $city = ''; $state = ''; $country = 'USA'; $workMode = '';
    if ($location) {
        $loc = preg_replace('/Remote\s+in\s+/i', '', $location);
        if (preg_match('/Remote/i', $location)) $workMode = 'Remote';
        $parts = preg_split('/,\s*/', $loc);
        if (count($parts) >= 2) { $city = trim($parts[0]); $state = trim($parts[1]); }
        if (count($parts) >= 3 && preg_match('/^(US|USA)$/i', trim($parts[2]))) $country = 'USA';
    }

    // Posted time from og:description
    $posted = ''; $postedDate = '';
    if (preg_match('/og:description[^>]+content="([^"]+)"/i', $c, $dm)) {
        $ogDesc = $dm[1];
        if (preg_match('/(\d+)\s+(hours?|days?|minutes?)\s+ago/i', $ogDesc, $pm)) {
            $posted = $pm[0];
            $num = (int)$pm[1]; $unit = $pm[2];
            $today = new DateTime();
            if (preg_match('/hour|minute/i', $unit)) $postedDate = $today->format('Y-m-d');
            elseif (preg_match('/day/i', $unit)) {
                $today->modify("-{$num} days");
                $postedDate = $today->format('Y-m-d');
            }
        }
    }

    // Employment type & work mode
    $empType = 'Full-Time';
    $combined = $title . ' ' . ($ogDesc ?? '');
    if (preg_match('/Contract.to.Hire|C2H/i', $combined)) $empType = 'Contract-to-Hire';
    elseif (preg_match('/\bContract\b/i', $combined)) $empType = 'Contract';
    if (!$workMode) {
        if (preg_match('/\bRemote\b/i', $combined)) $workMode = 'Remote';
        elseif (preg_match('/Hybrid/i', $combined)) $workMode = 'Hybrid';
        elseif (preg_match('/Onsite|On-site/i', $combined)) $workMode = 'Onsite';
    }

    // Salary
    $salary = '';
    if (preg_match('/\$(\d{2,3},\d{3}(?:\s*[-\/]\s*\$\d{2,3},\d{3})?)/', $c, $sm)) {
        $salary = '$' . $sm[1];
    }

    // Job description
    $jdText = '';
    if (preg_match('/dangerouslySetInnerHTML.*?"__html":"((?:[^"\\\\]|\\\\.)*)"/s', $c, $dm)) {
        $raw = $dm[1];
        $raw = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function($mm) {
            return mb_convert_encoding(pack('H*', $mm[1]), 'UTF-8', 'UCS-2BE');
        }, $raw);
        $raw = str_replace(['\\n', '\\t', '\\"', '\\\\'], ["\n", "\t", '"', '\\'], $raw);
        $jdText = strip_tags($raw);
        $jdText = html_entity_decode($jdText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    if (!$jdText && preg_match('/jobDescription">(.*?)(?:<\/div>|<\/section>)/si', $c, $dm)) {
        $jdText = strip_tags($dm[1]);
        $jdText = html_entity_decode($jdText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    if ($jdText) {
        $jdText = preg_replace('/[ \t]+/', ' ', $jdText);
        $jdText = preg_replace('/(\r?\n){3,}/', "\n\n", $jdText);
        $jdText = trim($jdText);
    }

    // Build header
    $headerLines = array_filter([$company, $title, $location]);
    $metaParts = [];
    if ($posted) $metaParts[] = 'Posted ' . $posted;
    if ($empType) $metaParts[] = $empType;
    if ($workMode) $metaParts[] = $workMode;
    if ($salary) $metaParts[] = $salary;
    if ($metaParts) $headerLines[] = implode(' | ', $metaParts);
    $fullText = implode("\n", $headerLines) . "\n\n" . $jdText;
    $fullText = mb_substr($fullText, 0, 5000);

    jsonOut(true, [
        'role'           => $title,
        'company'        => $company,
        'location'       => $location,
        'city'           => $city,
        'state'          => $state,
        'country'        => $country,
        'workMode'       => $workMode,
        'empType'        => $empType,
        'salary'         => $salary,
        'postedDate'     => $postedDate,
        'posted'         => $posted,
        'jobText'        => $fullText,
        'url'            => $url,
    ]);
}

jsonOut(false, null, 'Unknown action');
