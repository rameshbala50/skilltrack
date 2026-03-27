<?php
require_once __DIR__ . '/_common.php';

header('Content-Type: application/json; charset=utf-8');

$uid  = requireSession();
$body = getBody();

$action = $body['action'] ?? '';

// ── Claude API helper ─────────────────────────────────────────────────────────

/**
 * Send a prompt to the Claude API and return the response text.
 *
 * @param string $prompt     The user message to send.
 * @param int    $maxTokens  Maximum tokens in the response.
 * @return array ['ok'=>bool, 'text'=>string] or ['ok'=>false, 'error'=>string]
 */
function callClaude(string $prompt, int $maxTokens = 2048): array {
    if (!CLAUDE_API_KEY) {
        return ['ok' => false, 'error' => 'AI not configured: set ANTHROPIC_API_KEY on the server.'];
    }

    $body = json_encode([
        'model'      => CLAUDE_MODEL,
        'max_tokens' => $maxTokens,
        'system'     => 'You are a JSON-only API. Always respond with raw JSON only — no markdown fences, no explanation.',
        'messages'   => [
            ['role' => 'user', 'content' => $prompt],
        ],
    ]);

    $ch = curl_init(CLAUDE_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'x-api-key: '         . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $res  = curl_exec($ch);
    $err  = curl_error($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($err) {
        return ['ok' => false, 'error' => 'API connection failed: ' . $err];
    }

    $data = json_decode($res, true);
    if (!isset($data['content'][0]['text'])) {
        // Surface the real error from Anthropic (auth failure, overload, etc.)
        $apiErr = $data['error']['message'] ?? ('HTTP ' . $http . ': ' . substr($res, 0, 200));
        return ['ok' => false, 'error' => $apiErr];
    }

    return ['ok' => true, 'text' => $data['content'][0]['text']];
}

/**
 * Send a multi-content message (supports document blocks) to Claude.
 *
 * @param array $contentBlocks  Array of Claude content block objects.
 * @param int   $maxTokens      Maximum tokens in the response.
 * @return array ['ok'=>bool, 'text'=>string] or ['ok'=>false, 'error'=>string]
 */
function callClaudeWithContent(array $contentBlocks, int $maxTokens = 2048): array {
    if (!CLAUDE_API_KEY) {
        return ['ok' => false, 'error' => 'AI not configured: set ANTHROPIC_API_KEY on the server.'];
    }

    $body = json_encode([
        'model'      => CLAUDE_MODEL,
        'max_tokens' => $maxTokens,
        'messages'   => [
            ['role' => 'user', 'content' => $contentBlocks],
        ],
    ]);

    $ch = curl_init(CLAUDE_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'x-api-key: '         . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01',
            'content-type: application/json',
        ],
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $res  = curl_exec($ch);
    $err  = curl_error($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($err) {
        return ['ok' => false, 'error' => 'API connection failed: ' . $err];
    }

    $data = json_decode($res, true);
    if (!isset($data['content'][0]['text'])) {
        $apiErr = $data['error']['message'] ?? ('HTTP ' . $http . ': ' . substr($res, 0, 200));
        return ['ok' => false, 'error' => $apiErr];
    }

    return ['ok' => true, 'text' => $data['content'][0]['text']];
}

/**
 * Attempt to extract a JSON array or object from a Claude text response.
 * Strips any markdown code fences if present.
 *
 * @param string $text Raw text from Claude.
 * @return mixed Decoded JSON value, or null on failure.
 */
function extractJson(string $text) {
    // Strip ```json ... ``` or ``` ... ``` fences
    $stripped = preg_replace('/^```(?:json)?\s*/i', '', trim($text));
    $stripped = preg_replace('/\s*```$/', '', trim($stripped));

    // Find the first [ or { to handle any leading prose
    $start = strcspn($stripped, '[{');
    if ($start < strlen($stripped)) {
        $stripped = substr($stripped, $start);
    }

    $decoded = json_decode($stripped, true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        error_log('[SkillTrack] extractJson failed: ' . json_last_error_msg() . ' — raw: ' . substr($text, 0, 200));
    }
    return $decoded;
}

// ── Actions ───────────────────────────────────────────────────────────────────

switch ($action) {

    // ── suggest_skills ────────────────────────────────────────────────────────
    case 'suggest_skills': {
        if (!CLAUDE_API_KEY) {
            jsonOut(false, null, 'AI not configured on this server.');
        }

        $goalName = trim($body['goalName'] ?? '');
        $goalType = trim($body['goalType'] ?? '');

        if (empty($goalName)) {
            jsonOut(false, null, 'goalName is required.');
        }

        $prompt = "List 15-20 key skills required for the goal: '{$goalName}' (Type: {$goalType}). Group them into logical categories. Return ONLY a JSON array of objects: [{\"name\":\"skill name\",\"category\":\"category name\"}]. No explanation, no markdown.";

        $result = callClaude($prompt);
        if (!$result['ok']) {
            jsonOut(false, null, $result['error']);
        }

        $skills = extractJson($result['text']);
        if (!is_array($skills)) {
            jsonOut(false, null, 'AI returned an unexpected format for skill suggestions.');
        }

        // Normalise: accept both string[] and {name,category}[]
        $skills = array_values(array_map(function($s) {
            if (is_string($s)) return ['name' => $s, 'category' => 'General'];
            return ['name' => (string)($s['name'] ?? ''), 'category' => (string)($s['category'] ?? 'General')];
        }, array_filter($skills, function($s) {
            return is_string($s) || (is_array($s) && !empty($s['name']));
        })));

        jsonOut(true, ['skills' => $skills]);
        break;
    }

    // ── gap_narrative ─────────────────────────────────────────────────────────
    case 'gap_narrative': {
        if (!CLAUDE_API_KEY) {
            jsonOut(false, null, 'AI not configured on this server.');
        }

        $goalName = trim($body['goalName'] ?? '');
        $matched  = $body['matched']  ?? [];
        $partial  = $body['partial']  ?? [];
        $weak     = $body['weak']     ?? [];
        $missing  = $body['missing']  ?? [];

        if (empty($goalName)) {
            jsonOut(false, null, 'goalName is required.');
        }

        $matchedStr = implode(', ', $matched) ?: 'none';
        $partialStr = implode(', ', $partial) ?: 'none';
        $weakStr    = implode(', ', $weak)    ?: 'none';
        $missingStr = implode(', ', $missing) ?: 'none';

        $prompt = <<<PROMPT
Give a concise 2-3 paragraph career coaching narrative about this gap analysis for goal '{$goalName}'.

Matched skills: {$matchedStr}
Partial / in-progress skills: {$partialStr}
Weak skills: {$weakStr}
Missing skills: {$missingStr}

Be encouraging and specific. Highlight strengths, then clearly identify the most important gaps to close, and finish with a motivating next-step recommendation.
PROMPT;

        $result = callClaude($prompt, 1024);
        if (!$result['ok']) {
            jsonOut(false, null, $result['error']);
        }

        jsonOut(true, ['narrative' => trim($result['text'])]);
        break;
    }

    // ── learning_path ─────────────────────────────────────────────────────────
    case 'learning_path': {
        if (!CLAUDE_API_KEY) {
            jsonOut(false, null, 'AI not configured on this server.');
        }

        $goalName      = trim($body['goalName']      ?? '');
        $goalType      = trim($body['goalType']      ?? '');
        $missingSkills = $body['missingSkills']  ?? [];
        $weakSkills    = $body['weakSkills']     ?? [];
        $existingSkills = $body['existingSkills'] ?? [];

        if (empty($goalName)) {
            jsonOut(false, null, 'goalName is required.');
        }

        $missingStr  = implode(', ', $missingSkills)  ?: 'none';
        $weakStr     = implode(', ', $weakSkills)     ?: 'none';
        $existingStr = implode(', ', $existingSkills) ?: 'none';

        $prompt = <<<PROMPT
Generate a structured learning path for '{$goalName}' (Type: {$goalType}).

Context:
- Skills already strong: {$existingStr}
- Skills that need improvement: {$weakStr}
- Skills missing entirely: {$missingStr}

Return ONLY valid JSON array of objects with this exact structure:
[{"topic": "...", "description": "...", "estimatedHours": 10, "resources": [{"title": "...", "url": "..."}]}]

Order topics from foundational to advanced. Include 8-12 topics. Focus on the missing and weak skills while building on existing ones.
PROMPT;

        $result = callClaude($prompt, 3000);
        if (!$result['ok']) {
            jsonOut(false, null, $result['error']);
        }

        $items = extractJson($result['text']);
        if (!is_array($items)) {
            jsonOut(false, null, 'AI returned an unexpected format for the learning path.');
        }

        jsonOut(true, ['items' => $items]);
        break;
    }

    // ── extract_resume ────────────────────────────────────────────────────────
    case 'extract_resume': {
        if (!CLAUDE_API_KEY) {
            jsonOut(false, null, 'AI not configured on this server.');
        }

        $pdfBase64 = $body['pdfBase64'] ?? '';
        if (empty($pdfBase64)) {
            jsonOut(false, null, 'pdfBase64 is required.');
        }

        // Validate that the base64 looks like a PDF by checking the decoded header
        $pdfBytes = base64_decode(substr($pdfBase64, 0, 8));
        if (strncmp($pdfBytes, '%PDF', 4) !== 0) {
            // Accept data URIs: strip the prefix if present
            if (preg_match('/^data:application\/pdf;base64,(.+)$/s', $pdfBase64, $m)) {
                $pdfBase64 = $m[1];
            }
        }

        $contentBlocks = [
            [
                'type'   => 'document',
                'source' => [
                    'type'       => 'base64',
                    'media_type' => 'application/pdf',
                    'data'       => $pdfBase64,
                ],
            ],
            [
                'type' => 'text',
                'text' => 'Extract all technical and soft skills from this resume. Return ONLY a JSON array: [{"name": "...", "group": "...", "proficiency": "..."}] where group is one of: Cloud & Data Platforms, Data Engineering, Programming, AI/ML, Visualization & BI, DevOps & CI/CD, Architecture & Design, Soft Skills, Custom. Proficiency must be one of: Beginner, Intermediate, Advanced, Expert.',
            ],
        ];

        $result = callClaudeWithContent($contentBlocks, 3000);
        if (!$result['ok']) {
            jsonOut(false, null, $result['error']);
        }

        $skills = extractJson($result['text']);
        if (!is_array($skills)) {
            jsonOut(false, null, 'AI returned an unexpected format for resume skills.');
        }

        jsonOut(true, ['skills' => $skills]);
        break;
    }

    // ── job_analysis ─────────────────────────────────────────────────────────
    case 'job_analysis': {
        if (!CLAUDE_API_KEY) {
            jsonOut(false, null, 'AI not configured on this server.');
        }

        $candidateName = trim($body['candidateName'] ?? 'Candidate');
        $skills        = trim($body['skills']        ?? '');
        $jobText       = trim($body['jobText']       ?? '');

        if (empty($jobText)) {
            jsonOut(false, null, 'jobText is required.');
        }

        $prompt = <<<PROMPT
You are a career coach. Analyse this job posting against the candidate's skills and return ONLY a JSON object.

Candidate: {$candidateName}
Candidate skills: {$skills}

Job posting:
{$jobText}

Return ONLY valid JSON with this exact structure:
{
  "jobTitle": "...",
  "company": "...",
  "matchScore": 72,
  "matchLevel": "Moderate Match",
  "overallAdvice": "2-3 sentence coaching summary",
  "topStrengths": ["strength1", "strength2", "strength3"],
  "criticalGaps": ["gap1", "gap2"],
  "jobSpecificGaps": ["gap1", "gap2"],
  "learningPlan": ["step1", "step2", "step3", "step4"],
  "resumeTips": ["tip1", "tip2"],
  "interviewTopics": ["topic1", "topic2", "topic3"],
  "applicationStrategy": "1-2 sentence strategy",
  "salaryInsight": "salary context if mentioned, else empty string",
  "jobMeta": {
    "source": "Dice|LinkedIn|Indeed|Glassdoor|Company Website|Recruiter|Other",
    "clientName": "end client if different from company, else empty",
    "city": "city or empty",
    "state": "state/province or empty",
    "country": "country or US if not specified",
    "employerType": "Direct Hire|Recruiter|Staffing Agency|Consulting Firm|Other",
    "employmentType": "Full-Time|Part-Time|Contract|Contract-to-Hire|Internship|Freelance",
    "salary": "salary or range as stated, else empty",
    "workMode": "Remote|Hybrid|Onsite|Not Specified",
    "postedDate": "date posted as YYYY-MM-DD. Convert relative dates like 'Posted 2 days ago' or 'Updated 3 hours ago' to actual date using today's date. If not found, empty string."
  }
}

matchScore is 0-100. matchLevel is one of: Strong Match, Moderate Match, Partial Match.
Today's date is {TODAY}. Use this to convert relative posted dates (e.g. "2 days ago" = subtract 2 days from today).
For jobMeta: extract whatever is available from the job posting text. Use empty string for fields not found. Do NOT guess — only extract what is explicitly stated or clearly implied.
PROMPT;

        // Inject today's date for relative date conversion
        $prompt = str_replace('{TODAY}', date('Y-m-d'), $prompt);

        $result = callClaude($prompt, 2000);
        if (!$result['ok']) {
            jsonOut(false, null, $result['error']);
        }

        $data = extractJson($result['text']);
        if (!is_array($data)) {
            jsonOut(false, null, 'AI returned an unexpected format for job analysis.');
        }

        jsonOut(true, $data);
        break;
    }

    // ── cover_letter ─────────────────────────────────────────────────────────
    case 'cover_letter': {
        if (!CLAUDE_API_KEY) {
            jsonOut(false, null, 'AI not configured on this server.');
        }

        $candidateName = trim($body['candidateName'] ?? 'Candidate');
        $jobTitle      = trim($body['jobTitle']      ?? '');
        $company       = trim($body['company']       ?? '');
        $topStrengths  = trim($body['topStrengths']  ?? '');
        $jobText       = trim($body['jobText']       ?? '');

        $prompt = <<<PROMPT
Write a professional cover letter for {$candidateName} applying for the role of {$jobTitle} at {$company}.

Key strengths to highlight: {$topStrengths}

Job posting context:
{$jobText}

Write 3 paragraphs: (1) opening with enthusiasm and role fit, (2) key strengths and specific examples, (3) closing with call to action.
Return only the cover letter text — no subject line, no JSON, no markdown.
PROMPT;

        $result = callClaude($prompt, 1200);
        if (!$result['ok']) {
            jsonOut(false, null, $result['error']);
        }

        jsonOut(true, ['letter' => trim($result['text'])]);
        break;
    }

    // ── ping (admin-only key diagnostics) ────────────────────────────────────
    case 'ping': {
        requireAdmin();
        $keySet    = !empty(CLAUDE_API_KEY);
        $keyPrefix = $keySet ? substr(CLAUDE_API_KEY, 0, 18) . '…' : '(not set)';
        jsonOut(true, [
            'key_set'    => $keySet,
            'key_prefix' => $keyPrefix,
            'getenv'     => (bool) getenv('ANTHROPIC_API_KEY'),
            'server'     => isset($_SERVER['ANTHROPIC_API_KEY']),
            'env'        => isset($_ENV['ANTHROPIC_API_KEY']),
        ]);
        break;
    }

    // ── unknown ───────────────────────────────────────────────────────────────
    default: {
        jsonOut(false, null, 'Unknown action: ' . htmlspecialchars($action));
        break;
    }
}
