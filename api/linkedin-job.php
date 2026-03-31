<?php
/**
 * LinkedIn Job Proxy — fetches a LinkedIn job page and extracts metadata + description.
 * LinkedIn public job pages embed structured data in JSON-LD and meta tags.
 */
require_once __DIR__ . '/_common.php';

if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json; charset=utf-8');

$uid = requireSession();
$body = getBody();
$url = trim($body['url'] ?? '');

if (empty($url) || !preg_match('/linkedin\.com/', $url)) {
    jsonOut(false, null, 'Please enter a valid LinkedIn job URL.');
}

// Normalize URL — strip tracking params, ensure /jobs/view/ format
$url = preg_replace('/[?#].*$/', '', $url);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    CURLOPT_HTTPHEADER     => [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: en-US,en;q=0.9',
    ],
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if (!$html || $httpCode >= 400) {
    $msg = $error ?: "Server returned HTTP $httpCode";
    jsonOut(false, null, "Could not fetch the page: $msg");
}

// ── Extract from JSON-LD (most reliable) ────────────────────────────
$role = ''; $company = ''; $location = ''; $city = ''; $state = ''; $country = '';
$postedDate = ''; $salary = ''; $empType = ''; $workMode = '';
$description = ''; $applicants = '';
$seniorityLevel = ''; $jobFunction = ''; $industries = '';

// JSON-LD structured data
if (preg_match('/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/si', $html, $m)) {
    $ld = json_decode($m[1], true);
    if ($ld) {
        $role = $ld['title'] ?? '';
        if (isset($ld['hiringOrganization']['name'])) $company = $ld['hiringOrganization']['name'];
        if (isset($ld['jobLocation'])) {
            $loc = $ld['jobLocation'];
            if (is_array($loc)) $loc = $loc[0] ?? $loc;
            if (isset($loc['address'])) {
                $addr = $loc['address'];
                $city = $addr['addressLocality'] ?? '';
                $state = $addr['addressRegion'] ?? '';
                $country = $addr['addressCountry'] ?? '';
                if (is_array($country)) $country = $country['name'] ?? '';
                $location = implode(', ', array_filter([$city, $state, $country]));
            }
        }
        if (isset($ld['datePosted'])) $postedDate = $ld['datePosted'];
        if (isset($ld['employmentType'])) {
            $et = $ld['employmentType'];
            if (is_array($et)) $et = implode(', ', $et);
            $empType = $et;
        }
        if (isset($ld['baseSalary'])) {
            $bs = $ld['baseSalary'];
            if (isset($bs['value'])) {
                $sv = $bs['value'];
                $cur = $bs['currency'] ?? 'USD';
                if (isset($sv['minValue']) && isset($sv['maxValue'])) {
                    $salary = '$' . number_format($sv['minValue']) . ' - $' . number_format($sv['maxValue']);
                    $unit = $sv['unitText'] ?? '';
                    if ($unit) $salary .= '/' . strtolower($unit);
                } elseif (isset($sv['value'])) {
                    $salary = '$' . number_format($sv['value']);
                }
            }
        }
        if (isset($ld['description'])) {
            $description = $ld['description'];
        }
        // Work mode from jobLocationType
        if (isset($ld['jobLocationType'])) {
            $jlt = strtolower($ld['jobLocationType']);
            if (strpos($jlt, 'remote') !== false) $workMode = 'Remote';
        }
    }
}

// ── Fallback: og:title / meta tags ──────────────────────────────────
if (!$role && preg_match('/og:title[^>]+content="([^"]+)"/i', $html, $m)) {
    // Format: "Role - Company | LinkedIn" or "Role at Company"
    $t = html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    $t = preg_replace('/\s*\|\s*LinkedIn.*$/', '', $t);
    if (preg_match('/^(.+?)\s+(?:at|-)\s+(.+)$/', $t, $pm)) {
        $role = trim($pm[1]);
        if (!$company) $company = trim($pm[2]);
    } else {
        $role = $t;
    }
}

if (!$role) {
    // Try <title> tag
    if (preg_match('/<title>([^<]+)<\/title>/i', $html, $m)) {
        $t = html_entity_decode(trim($m[1]), ENT_QUOTES, 'UTF-8');
        $t = preg_replace('/\s*\|\s*LinkedIn.*$/', '', $t);
        if (preg_match('/^(.+?)\s+(?:at|-)\s+(.+)$/', $t, $pm)) {
            $role = trim($pm[1]);
            if (!$company) $company = trim($pm[2]);
        }
    }
}

// ── Extract additional LinkedIn-specific fields ─────────────────────

// Applicants count
if (preg_match('/(\d[\d,]*\+?\s*applicants?|Over\s+\d[\d,]*\s*applicants?)/i', $html, $m)) {
    $applicants = trim($m[1]);
}

// Seniority Level
if (preg_match('/Seniority\s*level\s*<\/h3>\s*<span[^>]*>([^<]+)/si', $html, $m)) {
    $seniorityLevel = trim(strip_tags($m[1]));
}
if (!$seniorityLevel && preg_match('/seniority.?level["\s:]*([^"<,]+)/i', $html, $m)) {
    $seniorityLevel = trim($m[1]);
}

// Job function
if (preg_match('/Job\s*function\s*<\/h3>\s*<span[^>]*>([^<]+)/si', $html, $m)) {
    $jobFunction = trim(strip_tags($m[1]));
}

// Industries
if (preg_match('/Industries?\s*<\/h3>\s*<span[^>]*>([^<]+)/si', $html, $m)) {
    $industries = trim(strip_tags($m[1]));
}

// Work mode from page text if not found
if (!$workMode) {
    if (preg_match('/\b(Remote|Hybrid|On-?site)\b/i', $html, $m)) {
        $workMode = ucfirst(strtolower($m[1]));
        if (strtolower($workMode) === 'onsite') $workMode = 'Onsite';
    }
}

// Posted time (relative) — "Posted X days/weeks ago" or "Reposted X days ago"
$postedRelative = '';
if (preg_match('/((?:Posted|Reposted)\s+\d+\s+(?:hour|day|week|month)s?\s+ago)/i', $html, $m)) {
    $postedRelative = trim($m[1]);
}
// Convert relative to absolute date if no datePosted from JSON-LD
if (!$postedDate && $postedRelative) {
    if (preg_match('/(\d+)\s+(hour|day|week|month)s?\s+ago/i', $postedRelative, $pm)) {
        $num = (int)$pm[1]; $unit = strtolower($pm[2]);
        $d = new DateTime();
        if ($unit === 'hour') {} // same day
        elseif ($unit === 'day') $d->modify("-{$num} days");
        elseif ($unit === 'week') $d->modify("-" . ($num * 7) . " days");
        elseif ($unit === 'month') $d->modify("-{$num} months");
        $postedDate = $d->format('Y-m-d');
    }
}

// ── Clean up description ────────────────────────────────────────────
if ($description) {
    // Decode HTML entities FIRST (JSON-LD often has &lt;br&gt; etc.)
    $description = html_entity_decode($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Second pass — sometimes double-encoded
    $description = html_entity_decode($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    // Convert block tags to newlines for readability
    $description = preg_replace('#<(br|hr)\s*/?\s*>#i', "\n", $description);
    $description = preg_replace('#</(p|div|tr|h[1-6])>#i', "\n\n", $description);
    $description = preg_replace('#</(li)>#i', "\n", $description);
    $description = preg_replace('#<li[^>]*>#i', "- ", $description);
    $description = preg_replace('#<(strong|b)[^>]*>#i', '', $description);
    $description = preg_replace('#</(strong|b)>#i', '', $description);
    $description = preg_replace('#<(ul|ol)[^>]*>#i', "\n", $description);
    $description = preg_replace('#</(ul|ol)>#i', "\n", $description);
    // Strip all remaining tags
    $description = strip_tags($description);
    // Normalize whitespace
    $description = preg_replace('/[ \t]+/', ' ', $description);
    $description = preg_replace('/(\r?\n)[ \t]+/', "\n", $description);
    $description = preg_replace('/(\r?\n){3,}/', "\n\n", $description);
    $description = trim($description);
}

// Fallback: extract from page if JSON-LD didn't have it
if (empty($description) || strlen($description) < 50) {
    // LinkedIn description__text class
    if (preg_match('/<div[^>]*class="[^"]*description__text[^"]*"[^>]*>(.*?)<\/div>/si', $html, $m)) {
        $desc = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $desc = html_entity_decode($desc, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $desc = preg_replace('#<(br|hr)\s*/?\s*>#i', "\n", $desc);
        $desc = preg_replace('#</(p|div|tr|h[1-6])>#i', "\n\n", $desc);
        $desc = preg_replace('#</(li)>#i', "\n", $desc);
        $desc = preg_replace('#<li[^>]*>#i', "- ", $desc);
        $desc = strip_tags($desc);
        $desc = preg_replace('/[ \t]+/', ' ', $desc);
        $desc = preg_replace('/(\r?\n)[ \t]+/', "\n", $desc);
        $desc = preg_replace('/(\r?\n){3,}/', "\n\n", $desc);
        if (strlen(trim($desc)) > strlen($description)) {
            $description = trim($desc);
        }
    }
    // show-more-less-html__markup
    if ((empty($description) || strlen($description) < 50) &&
        preg_match('/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>(.*?)<\/div>/si', $html, $m)) {
        $desc = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $desc = html_entity_decode($desc, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $desc = preg_replace('#<(br|hr)\s*/?\s*>#i', "\n", $desc);
        $desc = preg_replace('#</(p|div|tr|h[1-6])>#i', "\n\n", $desc);
        $desc = preg_replace('#</(li)>#i', "\n", $desc);
        $desc = preg_replace('#<li[^>]*>#i', "- ", $desc);
        $desc = strip_tags($desc);
        $desc = preg_replace('/[ \t]+/', ' ', $desc);
        $desc = preg_replace('/(\r?\n)[ \t]+/', "\n", $desc);
        $desc = preg_replace('/(\r?\n){3,}/', "\n\n", $desc);
        if (strlen(trim($desc)) > strlen($description)) {
            $description = trim($desc);
        }
    }
}

// ── Build full text with header ─────────────────────────────────────
$headerLines = array_filter([$company, $role, $location]);
$metaParts = [];
if ($postedRelative) $metaParts[] = $postedRelative;
elseif ($postedDate) $metaParts[] = 'Posted ' . $postedDate;
if ($applicants) $metaParts[] = $applicants;
if ($empType) $metaParts[] = $empType;
if ($workMode) $metaParts[] = $workMode;
if ($salary) $metaParts[] = $salary;
if ($metaParts) $headerLines[] = implode(' | ', $metaParts);

$extraMeta = [];
if ($seniorityLevel) $extraMeta[] = 'Seniority: ' . $seniorityLevel;
if ($jobFunction) $extraMeta[] = 'Function: ' . $jobFunction;
if ($industries) $extraMeta[] = 'Industries: ' . $industries;
if ($extraMeta) $headerLines[] = implode(' | ', $extraMeta);

$headerLines[] = '';
$fullText = implode("\n", $headerLines) . "\n" . $description;
$fullText = mb_substr($fullText, 0, 6000);

// Normalize employment type
if ($empType) {
    $etl = strtolower($empType);
    if (strpos($etl, 'full') !== false) $empType = 'Full-Time';
    elseif (strpos($etl, 'part') !== false) $empType = 'Part-Time';
    elseif (strpos($etl, 'contract') !== false) $empType = 'Contract';
    elseif (strpos($etl, 'intern') !== false) $empType = 'Internship';
}

jsonOut(true, [
    'role'            => $role,
    'company'         => $company,
    'location'        => $location,
    'city'            => $city,
    'state'           => $state,
    'country'         => $country ?: 'USA',
    'workMode'        => $workMode,
    'empType'         => $empType ?: 'Full-Time',
    'salary'          => $salary,
    'postedDate'      => $postedDate,
    'postedRelative'  => $postedRelative,
    'applicants'      => $applicants,
    'seniorityLevel'  => $seniorityLevel,
    'jobFunction'     => $jobFunction,
    'industries'      => $industries,
    'jobText'         => $fullText,
    'description'     => $description,
    'url'             => $url,
]);
