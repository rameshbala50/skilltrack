# SkillTrack Functional Specification

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Authentication Flow](#authentication-flow)
4. [Storage Layer](#storage-layer)
5. [Data Models](#data-models)
6. [AI Integration](#ai-integration)
7. [Job Analysis Flow](#job-analysis-flow)
8. [Gap Analysis](#gap-analysis)
9. [Dice Integration](#dice-integration)
10. [Admin Features](#admin-features)
11. [Deployment](#deployment)
12. [Security](#security)
13. [API Endpoints](#api-endpoints)

---

## Architecture Overview

SkillTrack is a single-page application (SPA-feel) built with vanilla JavaScript and a PHP backend. There is no framework -- all UI rendering is done via DOM manipulation and innerHTML assignment.

### Client Side

- **Vanilla JS modules** -- Each panel has its own JS file (goals.js, skills.js, jobs.js, etc.) loaded together in dashboard.html/dashboard.php.
- **Panel switching** -- `switchPanel(name)` hides all `.panel` elements and shows the target. Each switch triggers the panel's render function to refresh data.
- **No build step** -- All JS files are loaded directly via `<script>` tags. CSS is a single `styles.css` file.

### Server Side

- **PHP 7.4+** -- Stateless JSON APIs under `/api/`. Each endpoint receives a JSON POST body with an `action` field.
- **File-based storage** -- User data stored as JSON files under a data directory above the web root.
- **Session-based auth** -- PHP sessions with configurable timeout.

### Dual Mode

- **Server mode** -- `location.protocol !== 'file:'` and not localhost. Uses PHP APIs for auth, data sync, and AI.
- **Local mode** -- `file://` or `localhost`. Uses localStorage only. AI calls go directly to the Anthropic API from the browser (requires CORS header `anthropic-dangerous-direct-browser-access`).

Detection is via the `IS_LOCAL` constant in `storage.js`:
```javascript
const IS_LOCAL = location.protocol === 'file:'
  || location.hostname === 'localhost'
  || location.hostname === '127.0.0.1';
```

### Data Flow

```
User Action --> JS Module --> stWrite(module, data)
                                |
                 +--------------+--------------+
                 |                             |
          localStorage.setItem()        _serverSync(module, data)
          (always, synchronous)           (if !IS_LOCAL, async)
                                              |
                                        POST api/{module}.php
                                        { action: 'sync', data }
                                              |
                                        writeJson(uid, module, data)
```

---

## File Structure

### Frontend

| File | Description |
|------|-------------|
| `dashboard.html` | Local-mode entry point. Redirects to `dashboard.php` on server. Contains all panel HTML, modals, sidebar, inline session bootstrap script. |
| `dashboard.php` | Server-mode entry point. PHP session check, injects `_currentUser` global, includes same HTML structure. |
| `index.html` | Local-mode login/register page. |
| `index.php` | Server-mode login/register page. |
| `css/styles.css` | Single stylesheet for the entire application. |

### JavaScript Modules

| File | Description |
|------|-------------|
| `js/storage.js` | Unified storage layer: `stRead`, `stWrite`, `stUpsert`, `stDelete`, `stLog`, `stInit`, `aiCall`, `esc()`, `relTime()`, `fmtDate()`. Core dependency for all modules. |
| `js/app.js` | App shell: panel switching, sidebar toggle, dashboard rendering, user profile, logout, `_seedDefaultUser()`. |
| `js/goals.js` | Goals CRUD, goal modal, template selection, AI skill suggestions, filters. |
| `js/skills.js` | Skills CRUD, skill modal, resume upload/extraction, auto-categorization, group filtering. |
| `js/reqskills.js` | Per-goal required skills management, AI suggest, category tabs, edit modal. |
| `js/gap.js` | Gap analysis engine: fuzzy matching, status computation, category table rendering, match overrides, AI narrative. |
| `js/jobs.js` | Job Tracker: table/kanban views, filters, sorting, pagination, detail pane, edit modal, AI analysis, duplicate detection, job ID system. |
| `js/jobposting.js` | Job Posting Analyser: text/URL input, Quick Scan, AI Analyse, Cover Letter, Save to Tracker. |
| `js/learning.js` | Learning Path: AI generation, topic status tracking. |
| `js/timetable.js` | Timetable: session scheduling, date-based views. |
| `js/progress.js` | Progress tracking visualization. |
| `js/admin.js` | Admin module: overview, goal templates CRUD, user management, test cases, parameters, work-as-user. |
| `js/common-goals.js` | Built-in goal template definitions (`COMMON_GOALS` array). |

### PHP Backend

| File | Description |
|------|-------------|
| `api/config.php` | Constants: `DATA_PATH`, `SESSION_TIMEOUT`, `CLAUDE_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_API_URL`. |
| `api/_common.php` | Shared functions: `jsonOut()`, `getBody()`, `startAppSession()`, `requireSession()`, `requireAdmin()`, `userDir()`, `readJson()`, `writeJson()`, `generateUid()`, `esc()` equivalent. |
| `api/auth.php` | Authentication: register, login, logout, me, update_name, reset_password, change_password. |
| `api/ai.php` | AI proxy: suggest_skills, gap_narrative, learning_path, extract_resume, job_analysis, cover_letter, ping. |
| `api/admin.php` | Admin API: get_templates, save_all_templates, list_users, update_user, reset_user_password, delete_user. |
| `api/goals.php` | Goals data: list, sync. |
| `api/skills.php` | Skills data: list, sync. |
| `api/learning.php` | Learning path data: list, sync. |
| `api/timetable.php` | Timetable data: list, sync. |
| `api/jobs.php` | Jobs data: list, sync. |
| `api/fetch.php` | URL fetcher: extracts job description text from URLs, with special Dice.com handling. |

### Utility Scripts

| File | Description |
|------|-------------|
| `deploy.bat` | Windows batch file that calls `deploy.ps1`. |
| `deploy.ps1` | PowerShell FTP deployment script for GoDaddy hosting. |
| `deploy.env` | FTP credentials (gitignored). |
| `fetch-dice.ps1`, `fetch-all-dice.ps1` | Dice.com job fetching scripts. |
| `inject-dice-jobs.ps1` | Bulk import Dice jobs into user data. |
| `bulk-analyze.ps1` | Bulk AI analysis of job descriptions. |
| `fix-jobids.ps1` | Job ID migration/fix script. |
| `sync-dashboard.bat` | Syncs dashboard.html and dashboard.php structural changes. |

---

## Authentication Flow

### Server Mode

1. **Login** -- POST to `api/auth.php` with `{action:'login', email, password}`.
2. Server looks up email in `DATA_PATH/index.json` (maps email to uid).
3. Reads `{uid}/profile.json`, verifies password with `password_verify()` (bcrypt).
4. On success: `session_regenerate_id(true)`, sets `$_SESSION['uid']`, `$_SESSION['name']`, `$_SESSION['email']`, `$_SESSION['role']`, `$_SESSION['last_active']`.
5. Returns user object. Client redirects to `dashboard.php`.
6. `dashboard.php` calls `api/auth.php?action=me` to validate session and inject `window._currentUser`.

### Session Timeout

- Configured via `SESSION_TIMEOUT` constant (default: 8 hours / 28800 seconds).
- Checked in `startAppSession()`: if `time() - $_SESSION['last_active'] > SESSION_TIMEOUT`, session is destroyed.
- On each valid request, `$_SESSION['last_active']` is updated.

### Session Storage

- Sessions are stored in a custom directory above the web root: `dirname(DOCUMENT_ROOT) . '/skilltrack-sessions'`.
- This survives GoDaddy's periodic `/tmp` cleanup.
- Session cookies have `httponly=1` and `strict_mode=1`.

### Local Mode

1. Login page writes a session object to `localStorage` key `st-session`: `{uid, name, email, role}`.
2. `dashboard.html` reads `st-session` from localStorage or from a URL hash (`#s=<base64 JSON>`).
3. `_uid()` reads the session uid. If none, defaults to `'demo'`.
4. No server communication occurs. A default admin user is seeded by `_seedDefaultUser()`.

### Password Hashing

All passwords are hashed with `password_hash($password, PASSWORD_BCRYPT)` and verified with `password_verify()`.

---

## Storage Layer

The storage layer (`js/storage.js`) provides a unified interface for both local and server modes.

### Core Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `stRead(module)` | `stRead('goals') -> Array` | Read module data from localStorage key `st-{uid}-{module}`. Returns `[]` if empty. |
| `stWrite(module, data)` | `stWrite('goals', [...])` | Write to localStorage and trigger `_serverSync` if not local. |
| `stUpsert(module, item)` | `stUpsert('skills', {id, ...})` | Find by `item.id`, update if exists, else push. Calls `stWrite`. Returns item. |
| `stDelete(module, id)` | `stDelete('jobs', 'j_123')` | Filter out item by id, calls `stWrite`. |
| `stReadObj(module)` | `stReadObj('timetable') -> Object` | Read a single object (not array) from localStorage. Returns `{}` if empty. |
| `stWriteObj(module, obj)` | `stWriteObj('timetable', {...})` | Write a single object. Triggers sync. |
| `stLog(type, message)` | `stLog('skill_added', 'Added Python')` | Prepend to activity log (max 100 entries). **Local-only** -- not synced to server. |
| `stReadActivity()` | `stReadActivity() -> Array` | Read activity log from localStorage. |

### Key Derivation

```javascript
function _uid() {
  if (window._workAsUid) return window._workAsUid;  // Admin impersonation
  if (!IS_LOCAL && window._currentUser?.uid) return window._currentUser.uid;
  return (JSON.parse(localStorage.getItem('st-session') || '{}') || {}).uid || 'demo';
}
function _key(module) { return 'st-' + _uid() + '-' + module; }
```

### Server Sync

```javascript
async function _serverSync(module, data) {
  const body = { action: 'sync', data };
  if (window._workAsUid) body.as_uid = window._workAsUid;
  const res = await fetch('api/' + module + '.php', { method: 'POST', ... });
  // On success: reset fail count, hide warning
  // On 'Not authenticated': show session expired warning
  // On error: show sync warning bar
}
```

The sync warning bar is a fixed-position red bar at the top of the page that appears when sync fails and disappears when sync succeeds.

### stInit (Server Data Load)

On page load in server mode, `stInit()` fetches all module data from the server and populates localStorage:

```javascript
async function stInit() {
  if (IS_LOCAL) return;
  const modules = ['goals', 'skills', 'learning', 'timetable', 'jobs'];
  await Promise.all(modules.map(async mod => {
    const body = { action: 'list' };
    if (window._workAsUid) body.as_uid = window._workAsUid;
    const res = await fetch('api/' + mod + '.php', { ... });
    const d = await res.json();
    if (d.ok) localStorage.setItem(_key(mod), JSON.stringify(d.data ?? []));
    else if (d.error === 'Not authenticated') authFailed = true;
  }));
  if (authFailed) window.location.href = 'index.php';
}
```

### Work-as-User Impersonation

`window._workAsUid` is set by the admin "Work as User" feature. When set:
- `_uid()` returns the impersonated user's ID.
- All localStorage keys resolve to the impersonated user's data.
- All server API calls include `as_uid` in the request body.
- The PHP backend validates `as_uid` only if the session role is `'admin'`.

---

## Data Models

### Goal

```json
{
  "id": "g_1711234567890",
  "name": "Snowflake Architect",
  "type": "Job Role",
  "priority": "Primary",
  "targetDate": "2026-06-30",
  "description": "Become a certified Snowflake Solutions Architect",
  "requiredSkills": [
    { "name": "Snowflake Core", "category": "Snowflake Core Expertise", "level": "Expert" },
    { "name": "Python", "category": "Programming & Query Languages", "level": "Advanced" }
  ],
  "notes": "Focus on SnowPro Advanced certification",
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

**Goal types:** `Job Role`, `Certification`, `Personal Learning`, `Other`

**Priorities:** `Primary`, `Active`, `On Hold`

### Skill

```json
{
  "id": "s_1711234567890",
  "name": "Python",
  "group": "Programming",
  "proficiency": "Advanced",
  "notes": "Extracted from resume",
  "addedAt": "2026-01-15T10:30:00.000Z"
}
```

**Skill groups:** `Cloud & Data Platforms`, `Data Engineering`, `Programming`, `AI/ML`, `Visualization & BI`, `DevOps & CI/CD`, `Architecture & Design`, `Soft Skills`, `Custom`

**Proficiency levels:** `Beginner`, `Intermediate`, `Advanced`, `Expert`

### Job

```json
{
  "id": "j_1711234567890",
  "jobId": "JOB-AIENG-001",
  "company": "Acme Corp",
  "role": "AI Engineer",
  "status": "Applied",
  "notes": "Strong match, applied via LinkedIn",
  "url": "https://linkedin.com/jobs/view/123456",
  "addedAt": "2026-03-15T14:30:00.000Z",
  "addedBy": "John Doe",
  "modifiedAt": "2026-03-16T09:00:00.000Z",
  "modifiedBy": "John Doe",
  "jobText": "We are looking for an AI Engineer...",
  "aiAnalysis": {
    "jobTitle": "AI Engineer",
    "company": "Acme Corp",
    "matchScore": 78,
    "matchLevel": "Strong Match",
    "overallAdvice": "Strong candidate with relevant experience...",
    "topStrengths": ["Python", "TensorFlow", "Cloud Platforms"],
    "criticalGaps": ["Kubernetes", "MLOps"],
    "jobSpecificGaps": ["LangChain"],
    "learningPlan": ["Step 1: Learn Kubernetes basics", "Step 2: MLOps certification"],
    "resumeTips": ["Highlight AI project experience"],
    "interviewTopics": ["System design", "ML pipelines"],
    "applicationStrategy": "Apply directly and mention cloud experience",
    "salaryInsight": "$150K-$180K based on market data",
    "jobMeta": {
      "source": "LinkedIn",
      "clientName": "",
      "city": "San Francisco",
      "state": "CA",
      "country": "US",
      "employerType": "Direct Hire",
      "employmentType": "Full-Time",
      "salary": "$150,000 - $180,000",
      "workMode": "Hybrid",
      "postedDate": "2026-03-14"
    }
  },
  "source": "LinkedIn",
  "clientName": "",
  "city": "San Francisco",
  "state": "CA",
  "country": "US",
  "location": "San Francisco, CA, US",
  "employerType": "Direct Hire",
  "employmentType": "Full-Time",
  "salary": "$150,000 - $180,000",
  "workMode": "Hybrid",
  "postedDate": "2026-03-14",
  "appliedDate": "2026-03-16",
  "linkedGoal": "Snowflake Architect"
}
```

### Job Statuses

Ordered list (used for sort order and pipeline display):

1. `Job Added` -- Newly tracked
2. `Can Be Applied` -- Reviewed, worth applying
3. `Applied` -- Application submitted
4. `Phone Screen` -- Phone screening
5. `Interview` -- Interview stage
6. `Offer` -- Offer received
7. `Accepted` -- Offer accepted
8. `Rejected` -- Application rejected
9. `Withdrawn` -- Candidate withdrew
10. `No Response` -- No response received
11. `Not Interested` -- Decided not to pursue
12. `Duplicate` -- Auto-detected duplicate

Legacy migration: `Wishlist` maps to `Job Added`, `To Apply` maps to `Can Be Applied`.

### Job ID System

Job IDs follow the pattern: `JOB-{PREFIX}-{NNNN}`

**Prefix mapping** (`_roleToJobPrefix`):

| Prefix | Matches role containing |
|--------|------------------------|
| `AIENG` | "ai ", "artificial intelligence", "agentic", "ai/ml" |
| `MLENG` | "ml ", "machine learning" |
| `DATASC` | "data scien" |
| `SNFSA` | "snowflake" + ("architect" or "engineer" or "admin") |
| `OTH` | Everything else |

**ID generation** (`_generateJobId`):
1. Extract abbreviation from role title (first 2 chars of up to 3 words).
2. Find the max sequence number for that prefix across all existing jobs.
3. Return `JOB-{ABBR}-{MAX+1}` zero-padded to 3 digits.

**ID update** (`_maybeUpdateJobId`):
When role changes (e.g., via AI analysis), the prefix is recalculated. If it differs from the current prefix, a new ID is generated with the correct prefix (4-digit padding).

### Learning Path

```json
{
  "goalId": "g_1711234567890",
  "items": [
    {
      "topic": "Snowflake Fundamentals",
      "description": "Core concepts of the Snowflake data cloud",
      "estimatedHours": 10,
      "status": "Completed",
      "resources": [
        { "title": "Snowflake University", "url": "https://learn.snowflake.com" }
      ]
    }
  ]
}
```

**Item statuses:** `Not Started`, `In Progress`, `Completed`

### Activity

```json
{
  "id": "a_1711234567890",
  "type": "skill_added",
  "message": "Added skill: Python (Advanced)",
  "at": "2026-03-15T14:30:00.000Z"
}
```

**Activity types:** `goal_added`, `goal_updated`, `goal_deleted`, `skill_added`, `skill_updated`, `skill_deleted`, `lp_generated`, `lp_progress`, `job_added`, `job_updated`, `gap_analysis`, `timetable_session`, `resume_upload`, `job_analysis`

Activity is stored locally only (not synced). Maximum 100 entries; oldest are discarded.

---

## AI Integration

### Architecture

- **Server mode**: JS calls `aiCall(action, payload)` which POSTs to `api/ai.php`. The PHP server proxies to the Anthropic API using the server-side `CLAUDE_API_KEY`.
- **Local mode**: JS calls `_aiCallLocal(action, payload)` which calls the Anthropic API directly from the browser using the user's stored API key (localStorage `st-claude-key`). Uses the header `anthropic-dangerous-direct-browser-access: true` to enable browser CORS.

### Model

- Server: Configured in `config.php` as `CLAUDE_MODEL` (currently `claude-sonnet-4-6`).
- Local: Hardcoded to `claude-haiku-4-5-20251001` for cost efficiency.

### AI Actions

| Action | Payload | Response | Max Tokens |
|--------|---------|----------|------------|
| `suggest_skills` | `{goalName, goalType}` | `{ok, skills: [{name, category, level}]}` | 1500 |
| `gap_narrative` | `{goalName, matched[], partial[], weak[], missing[]}` | `{ok, narrative: "..."}` | 1024 |
| `learning_path` | `{goalName, goalType, missingSkills[], weakSkills[], existingSkills[]}` | `{ok, items: [{topic, description, estimatedHours, resources}]}` | 3000 |
| `extract_resume` | `{pdfBase64}` | `{ok, skills: [{name, group, proficiency}]}` | 3000 |
| `job_analysis` | `{candidateName, skills, jobText}` | `{ok, jobTitle, company, matchScore, matchLevel, overallAdvice, topStrengths[], criticalGaps[], jobSpecificGaps[], learningPlan[], resumeTips[], interviewTopics[], applicationStrategy, salaryInsight, jobMeta{...}}` | 2000 |
| `cover_letter` | `{candidateName, jobTitle, company, topStrengths, jobText}` | `{ok, letter: "..."}` | 1200 |
| `ping` | (none) | `{ok, key_set, key_prefix, getenv, server, env}` | N/A (admin-only diagnostics) |

### JSON Extraction

Both client and server include a `extractJson` / `_extractJsonLocal` function that:
1. Strips markdown code fences (```` ```json ... ``` ````).
2. Finds the first `[` or `{` to skip leading prose.
3. Parses the result as JSON.

### Error Handling

- If `CLAUDE_API_KEY` is not set on the server, all AI actions return `{ok: false, error: 'AI not configured...'}`.
- In local mode, if no API key is stored, the user is prompted to enter one.
- Network errors and API errors are caught and returned as `{ok: false, error: '...'}`.

---

## Job Analysis Flow

### From Job Posting Analyser

1. User pastes text or enters URL.
2. If URL only, `jpRunAnalysis()` fetches text via `api/fetch.php`.
3. AI analysis runs: sends candidate name + skills list + job text to `aiCall('job_analysis', ...)`.
4. Results render in the Job Posting panel (job summary + AI analysis sections).
5. User can generate cover letter, then save to tracker.
6. On save: duplicate check (role + company + location). If duplicate found, user chooses to update or keep existing.

### From Job Tracker (Re-analysis)

1. User selects a job and clicks **Job Analysis**.
2. If job has a URL, description is fetched via `api/fetch.php`.
3. AI analysis runs.
4. `_applyAiMeta(job, result)` **always overwrites** all metadata fields:
   - `role` from `jobTitle`, `company` from AI
   - All `jobMeta` fields: source, clientName, city, state, country, employerType, employmentType, salary, workMode, postedDate
5. `_maybeUpdateJobId(job)` recalculates the job ID prefix based on the new role.
6. `_markDuplicateIfNeeded(job)` checks for duplicates (same company + role + city, different job ID).
7. Timestamps `modifiedAt` and `modifiedBy` are updated.
8. Job is saved via `stUpsert('jobs', job)`.

### Bulk Re-analysis

When "Re-analyze all" is checked, the system iterates over all jobs with `jobText`, running the analysis pipeline for each.

---

## Gap Analysis

### Fuzzy Matching Algorithm

The `_findSimilarSkill(reqName, userSkills)` function attempts to match a required skill name against the user's skill list using four strategies in order:

1. **Exact match** -- `userSkill.name.toLowerCase() === requiredName.toLowerCase()`
2. **Contains match** -- One name contains the other. E.g., "Python" matches "Python Programming".
3. **Base match** -- Strip parenthetical qualifiers `\s*\([^)]*\)\s*` from both names, then compare with exact/contains. E.g., "Python (Advanced)" matches "Python".
4. **Word overlap** -- Split both names into significant words (length > 2), excluding delimiters `/&,-`. If at least 2 words overlap and overlap ratio >= 50%, it matches. Best-overlap match wins.

### Proficiency Rank Comparison

```javascript
const PROF_RANK = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2, 'Expert': 3 };
```

Given `reqRank` (from required skill level) and `userRank` (from user's proficiency):

| Condition | Status |
|-----------|--------|
| `userRank >= reqRank` | `matched` |
| `userRank === reqRank - 1` | `partial` |
| `userRank < reqRank - 1` | `weak` |
| No matching skill found | `missing` |

### Manual Overrides

Stored in localStorage key `st-{uid}-gap-overrides` as a JSON object:

```json
{
  "required skill name (lowercase)": "my skill name"  // explicit match
  "another required skill": ""                         // forced no-match
}
```

- Setting a value to a skill name forces that specific match.
- Setting a value to `""` forces "missing" status.
- Deleting the key resets to automatic matching.

Overrides are checked before fuzzy matching. They persist across sessions but are not synced to the server.

### Category Grouping

Required skills are grouped by their `category` field for display. Each category has an icon and color theme defined in `GAP_CAT_CFG`. A mapping table `_GAP_CAT_TO_GROUP` maps gap analysis categories to skill groups (used when adding a skill from gap analysis to My Skills).

---

## Dice Integration

### URL Fetching (api/fetch.php)

The `fetch.php` endpoint has special handling for Dice.com URLs because Dice renders job descriptions via JavaScript (React Server Components):

1. **Method 1**: Extract from `dangerouslySetInnerHTML.__html` in RSC data -- decode unicode escapes, strip tags.
2. **Method 2**: Look for `jobDescription>` div content.
3. **Method 3**: Extract from `og:title` / `og:description` meta tags as fallback.

Additional metadata is extracted from RSC data:
- `jobTitle`, `companyName`, `formattedLocation` from escaped JSON in the RSC payload.
- Fallback: parse `og:title` which follows pattern "Role - Company - Location | Dice.com".
- Posted time extracted via regex for relative date patterns.

### Bulk Import Scripts

PowerShell scripts for batch operations:

| Script | Purpose |
|--------|---------|
| `fetch-dice.ps1` | Fetch a single Dice job listing |
| `fetch-all-dice.ps1` | Fetch multiple Dice listings in batch |
| `fetch-dice-full.ps1` | Full Dice job data extraction |
| `inject-dice-jobs.ps1` | Inject fetched Dice jobs into user's jobs.json data file |
| `bulk-analyze.ps1` | Run AI analysis on all jobs with descriptions |
| `fetch-all-jobdescs.ps1` | Fetch job descriptions for all jobs with URLs |
| `fetch-ml-jobs.ps1`, `fetch-ml-jobs-v2.ps1` | Fetch ML-specific job listings |
| `fetch-ds-jobs.ps1` | Fetch Data Scientist job listings |

### CSR Workaround

Dice.com uses React Server Components (RSC), which means the job description is not in the initial HTML. The `fetch.php` handler parses the RSC payload (serialized React component data) rather than the rendered DOM, extracting the `dangerouslySetInnerHTML.__html` content which contains the actual job description HTML.

---

## Admin Features

### Access Control

- Admin role is determined at registration: emails in `ADMIN_EMAILS` array get `'admin'` role, others get `'webuser'`.
- `requireAdmin()` (PHP) checks `$_SESSION['role'] === 'admin'` and returns 403 if not.
- `_adminGuard()` (JS) checks `window._isAdmin` and redirects to dashboard if not admin.
- Admin sidebar items are hidden via `style="display:none"` and shown when `role === 'admin'`.

### User Management

- **List users**: Reads `index.json` to get all email-to-uid mappings, then reads each user's `profile.json`.
- **Edit user**: Update name and role via `api/admin.php?action=update_user`.
- **Reset password**: Admin sets a new password directly (no current password needed) via `api/admin.php?action=reset_user_password`.
- **Delete user**: Removes user from index and deletes their data directory.

### Goal Templates

- Templates are stored centrally in `skilltrack-data/admin-templates.json` (server) or `localStorage['st-admin-templates']` (local).
- Any user can read templates (for goal creation). Only admins can modify them.
- Each template has: id, name, type, icon, description, tags, requiredSkills (same format as goal required skills).

### Test Cases

The admin test panel (`admin-tests`) provides an integrated test runner with predefined test cases. Tests are rendered and auto-run via `stRenderTestPlan()`, reporting pass/fail for core functionality.

### Parameters & Work-as-User

The Parameters panel provides:

- **Work-as-User**: Admin selects a user from a dropdown. When activated:
  - `window._workAsUid` is set to the target user's uid.
  - `window._adminRealUser` stores the admin's own user info.
  - All `stRead`/`stWrite` calls use the target user's localStorage keys.
  - All server API calls include `as_uid` in the body.
  - `stInit()` is called to reload data from the server for the impersonated user.
  - A banner in the sidebar shows "WORKING AS {user}" with a click-to-stop action.
  - PHP backend: `requireSession()` checks if `as_uid` is set and caller is admin, then returns the target uid instead of the session uid.

---

## Deployment

### Deploy Scripts

| File | Description |
|------|-------------|
| `deploy.bat` | Windows batch wrapper that calls `deploy.ps1` via PowerShell. |
| `deploy.ps1` | PowerShell FTP deployment script. Reads credentials from `deploy.env`, uploads files to GoDaddy via FTP (passive mode). |
| `deploy.env` | Contains `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_REMOTE_DIR`. Gitignored. |
| `deploy.env.example` | Template for `deploy.env`. |
| `deploy.sh` | Shell script alternative for Linux/Mac deployment. |

### Cache Busting

CSS and JS files are loaded via `<script>` and `<link>` tags in `dashboard.html`/`dashboard.php`. Cache busting is handled by appending version query parameters or by the deployment script's FTP upload (files are overwritten on each deploy).

### Server Requirements

- PHP 7.4+ with `curl`, `json`, `mbstring` extensions.
- Write access to a directory above the web root for data storage.
- Write access for session storage directory.
- GoDaddy shared hosting is the primary deployment target.

### Data Directory Structure

```
/home/{user}/
  skilltrack-data/
    users/
      index.json                    # Global email-to-uid mapping
      {uid}/
        profile.json                # User profile (name, email, role, passwordHash)
        goals.json                  # User's goals
        skills.json                 # User's skills
        learning.json               # User's learning paths
        timetable.json              # User's timetable
        jobs.json                   # User's job tracker data
    admin-templates.json            # Shared goal templates
  skilltrack-sessions/              # PHP session files
```

---

## Security

### Path Traversal Guard

`userDir()` validates the uid with a strict regex before constructing the file path:

```php
if (!preg_match('/^[a-zA-Z0-9@._\-]+$/', $uid)) {
    jsonOut(false, null, 'Invalid user ID');
}
```

This prevents path traversal attacks like `../../etc/passwd` since the regex rejects `/` and `..` characters. The same regex is applied to `as_uid` in the admin impersonation flow.

### Authentication Guard

- `requireSession()` validates the PHP session exists, is not expired, and returns the uid.
- `requireAdmin()` additionally checks `$_SESSION['role'] === 'admin'`.
- All data API endpoints call `requireSession()` before processing.
- The `as_uid` parameter is only honored when the session role is `'admin'`.

### XSS Prevention

All user-supplied text rendered in HTML passes through `esc()`:

```javascript
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

### Session Security

- `session_regenerate_id(true)` on login to prevent session fixation.
- `session.cookie_httponly = 1` prevents JavaScript access to session cookie.
- `session.use_strict_mode = 1` rejects uninitialized session IDs.
- Session inactivity timeout (8 hours configurable).

### Admin-Only Operations

Operations guarded by `requireAdmin()`:
- `save_all_templates` -- Write goal templates
- `list_users` -- View all users
- `update_user` -- Modify user profile/role
- `reset_user_password` -- Reset any user's password
- `delete_user` -- Remove a user account
- `ping` (AI diagnostics) -- View API key prefix

### URL Fetch Safety

`api/fetch.php` validates:
- URL must pass `FILTER_VALIDATE_URL`.
- Only `http` and `https` schemes are allowed.
- Result is truncated to 8000 characters.
- SSL verification is disabled for compatibility with various job sites (`CURLOPT_SSL_VERIFYPEER => false`).

---

## API Endpoints

### Authentication (`api/auth.php`)

| Action | Method | Auth | Description |
|--------|--------|------|-------------|
| `register` | POST | None | Create new account. Body: `{name, email, password}` |
| `login` | POST | None | Authenticate. Body: `{email, password}`. Returns user object. |
| `logout` | POST/GET | Session | Destroy session. GET redirects to index.html. |
| `me` | POST | Session | Return current user info. |
| `update_name` | POST | Session | Change display name. Body: `{name}` |
| `reset_password` | POST | None | Self-service password reset. Body: `{email, newPassword}` |
| `change_password` | POST | Session | Change password. Body: `{currentPassword, newPassword}` |

### Data Modules (`api/{module}.php`)

Each module (goals, skills, learning, timetable, jobs) supports:

| Action | Auth | Description |
|--------|------|-------------|
| `list` | Session | Return all data for the user. Supports `as_uid` for admin impersonation. |
| `sync` | Session | Overwrite all data for the user. Body: `{action:'sync', data:[...]}`. Supports `as_uid`. |

### AI (`api/ai.php`)

| Action | Auth | Description |
|--------|------|-------------|
| `suggest_skills` | Session | Generate skill suggestions. Body: `{goalName, goalType}` |
| `gap_narrative` | Session | Generate coaching narrative. Body: `{goalName, matched[], partial[], weak[], missing[]}` |
| `learning_path` | Session | Generate learning path. Body: `{goalName, goalType, missingSkills[], weakSkills[], existingSkills[]}` |
| `extract_resume` | Session | Extract skills from PDF. Body: `{pdfBase64}` |
| `job_analysis` | Session | Analyse job posting. Body: `{candidateName, skills, jobText}` |
| `cover_letter` | Session | Generate cover letter. Body: `{candidateName, jobTitle, company, topStrengths, jobText}` |
| `ping` | Admin | API key diagnostics. Returns key status and prefix. |

### Admin (`api/admin.php`)

| Action | Auth | Description |
|--------|------|-------------|
| `get_templates` | Session | Read all goal templates. |
| `save_all_templates` | Admin | Overwrite all templates. Body: `{templates:[...]}` |
| `list_users` | Admin | List all registered users with profiles. |
| `update_user` | Admin | Update user name and role. Body: `{uid, name, role}` |
| `reset_user_password` | Admin | Set new password. Body: `{uid, newPassword}` |
| `delete_user` | Admin | Remove user account and data. Body: `{uid}` |

### URL Fetch (`api/fetch.php`)

| Method | Auth | Description |
|--------|------|-------------|
| POST | Session | Fetch and extract text from a URL. Body: `{url}`. Returns `{text, url}`. Special handling for Dice.com. |

### Response Format

All API endpoints return JSON:

```json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": "Error message" }
```

The `jsonOut()` helper enforces this format and exits immediately after responding.
