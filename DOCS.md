# SkillTrack — Application Documentation

## Overview

SkillTrack is a personal career planning and job search tool. It helps you track your skills, analyse gaps against career goals, plan learning, and manage job applications — all powered by Claude AI.

**Two operating modes:**
- **Local mode** — runs as a static HTML file (`dashboard.html`) directly in the browser. Data stored in `localStorage`. AI calls made direct to the Anthropic API from the browser.
- **Server mode** — hosted on a PHP server (GoDaddy). Data stored as JSON files on the server. AI calls proxied through PHP. Requires login.

---

## Feature Panels

### 1. Dashboard
Overview widgets: active goal count, skill count, gap count, job count, goal progress bars, today's timetable sessions, recent activity feed.

### 2. Goals
Create and manage career goals (Job Role, Skill, Certification, Project, Course, Custom). Each goal has a name, type, priority (High / Medium / Low / On Hold), target date, description, and notes. Goals link to required skills, learning paths, and timetable sessions.

### 3. My Skills
Personal skills inventory. Each skill has a name, category (group), proficiency level (Beginner / Intermediate / Advanced / Expert), and optional notes.

- **Auto-categorize** — moves Custom-group skills to the best-matched category using a keyword map.
- **Resume upload** — extract skills from a PDF resume via AI.

Skill groups: Cloud & Data Platforms, Data Engineering, Programming, AI/ML, Visualization & BI, DevOps & CI/CD, Architecture & Design, Soft Skills, Custom.

### 4. Required Skills
Define which skills a goal requires, at what level (Beginner → Expert). Can be added manually or AI-suggested from a template or goal name. Skills are grouped by category and stored on the goal object (`goal.requiredSkills`).

### 5. Gap Analysis
Compares My Skills against Required Skills for a selected goal. Shows Matched / Partial / Weak / Missing counts with a visual bar. Per-skill rows show your current level vs required level. "I have this" / "Improve" buttons add or upgrade skills directly from the gap view. AI Narrative generates a 2–3 paragraph coaching summary.

### 6. Learning Path
AI-generated ordered list of learning topics for a goal, based on missing and weak skills. Each topic has a description, estimated hours, and resource links. Topics can be marked Not Started / In Progress / Completed. Progress % is displayed on the Dashboard.

### 7. Timetable
Schedule learning sessions by goal/topic with date, duration, and notes. Sessions can be marked Planned / In Progress / Completed / Skipped. The Dashboard "Today" widget shows sessions scheduled for today.

### 8. Progress
Visual progress tracking across all learning paths — completion percentages, session counts, hours logged.

### 9. Job Posting Analyser
Paste a job description (and optional URL) to get:

- **Quick Scan** — client-side keyword match of your skills against the job text. Shows matched skill chips and coverage %.
- **AI Analyse** — full Claude analysis: match score (0–100%), match level (Strong / Moderate / Partial), overall advice, top strengths, critical gaps, job-specific gaps, learning plan, resume tips, interview topics, application strategy, salary insight.
- **Generate Cover Letter** — AI-written 3-paragraph cover letter tailored to the job and your strengths. Copy to clipboard.
- **Save to Job Tracker** — saves the job with full AI analysis to the Job Tracker. Duplicate detection: if the same company + role already exists, prompts to update analysis or keep existing.

### 10. Job Tracker
Track job applications through a pipeline. Default: compact table view. Secondary: Kanban board.

**Table columns:** Status | Company / Role | Source | AI Match % | Date | Edit / Delete

**Row click → Bottom Detail Pane** shows:
- Job header: company, role, status badge, Edit / Re-analyze / Close buttons
- Meta bar: URL, salary, location, source, applied date
- Notes
- Full AI analysis: score ring, match level, overall advice, strengths, gaps, interview topics, resume tips, strategy, salary insight
- Re-analyze button re-runs AI analysis against your current skills and refreshes both the table row and detail pane

**Pipeline bar** — shows count per status across all jobs.

**Filter pills** — filter by status and/or source.

**Report** — opens a modal with:
- Filter by status, sort by date added / AI score / status / company
- Summary: pipeline counts, average AI match score, job count
- Table: all jobs with match %, AI advice snippet
- Print → opens clean print window
- Copy → tab-separated data for paste into Excel / Google Sheets

**Job statuses (10):** Wishlist ⭐ · To Apply 📋 · Applied 📨 · Phone Screen 🎙️ · Interview 📅 · Offer 🎉 · Accepted ✅ · Rejected ❌ · Withdrawn 🚪 · No Response 🔇

### 11. Admin (admin role only)
- **Overview** — user count, template count, total template skills
- **Goal Templates** — create, edit, delete templates. AI-suggest required skills per template. Manage skills per template by category and level.
- **Users** — list all registered users, edit name/role, delete users and all their data.

---

## File Structure

```
skilltrack/
├── index.html              # Login / register page (local mode)
├── index.php               # Login redirect (server mode)
├── dashboard.html          # Main app — local mode entry point
├── dashboard.php           # Main app — server mode entry point (MIRROR of dashboard.html)
├── DOCS.md                 # This file
│
├── api/
│   ├── _common.php         # Shared: session, jsonOut(), readJson(), writeJson(), userDir(), getParam(), requireAdmin()
│   ├── config.php          # DATA_PATH, SESSION_TIMEOUT, CLAUDE_API_KEY, CLAUDE_MODEL
│   ├── auth.php            # register, login, logout, me — bcrypt passwords, PHP sessions
│   ├── admin.php           # get_templates, save_all_templates, list_users, update_user, delete_user
│   ├── ai.php              # suggest_skills, gap_narrative, learning_path, extract_resume, job_analysis, cover_letter, ping
│   ├── goals.php           # sync / list for goals module
│   ├── skills.php          # sync / list for skills module
│   ├── learning.php        # sync / list for learning module
│   ├── timetable.php       # sync / list for timetable module
│   └── jobs.php            # sync / list for jobs module
│
├── js/
│   ├── storage.js          # IS_LOCAL, stRead/stWrite/stUpsert/stDelete, stLog, stInit, aiCall, _aiCallLocal
│   ├── app.js              # Panel switching, sidebar, dashboard widgets, user profile, loadUserProfile()
│   ├── goals.js            # Goals panel CRUD + modal
│   ├── skills.js           # Skills panel CRUD + modal + resume upload + auto-categorize
│   ├── reqskills.js        # Required Skills panel
│   ├── gap.js              # Gap Analysis panel + AI narrative
│   ├── learning.js         # Learning Path panel + AI generation
│   ├── timetable.js        # Timetable panel + session management
│   ├── progress.js         # Progress panel
│   ├── jobposting.js       # Job Posting Analyser panel + cover letter
│   ├── jobs.js             # Job Tracker — table, detail pane, kanban, modal, report
│   ├── admin.js            # Admin panels — templates, users
│   └── common-goals.js     # Built-in goal templates (seed data)
│
├── css/
│   └── styles.css          # All styles (single file)
│
└── data/
    └── seed.js             # Sample data seeder for demo / local testing
```

---

## Data Model

### Goal
```json
{
  "id": "g_1234567890",
  "name": "Snowflake Data Architect",
  "type": "Job Role",
  "priority": "High",
  "targetDate": "2026-12-31",
  "description": "...",
  "notes": "...",
  "requiredSkills": [
    { "name": "Snowflake", "category": "Cloud & Data Platforms", "level": "Expert" }
  ],
  "addedAt": "2026-01-01T00:00:00.000Z"
}
```

### Skill
```json
{
  "id": "s_1234567890",
  "name": "Python",
  "group": "Programming",
  "proficiency": "Advanced",
  "notes": "",
  "addedAt": "2026-01-01T00:00:00.000Z"
}
```

### Job
```json
{
  "id": "j_1234567890",
  "company": "Acme Corp",
  "role": "Data Engineer",
  "url": "https://...",
  "status": "Applied",
  "salary": "$120k–$140k",
  "location": "Remote",
  "appliedDate": "2026-03-15",
  "notes": "Referral from John",
  "source": "LinkedIn",
  "linkedGoalId": "g_...",
  "addedAt": "2026-03-10T00:00:00.000Z",
  "jobText": "...raw job description (first 3000 chars)...",
  "aiAnalysis": {
    "jobTitle": "Data Engineer",
    "company": "Acme Corp",
    "matchScore": 72,
    "matchLevel": "Moderate Match",
    "overallAdvice": "...",
    "topStrengths": ["Python", "SQL", "dbt"],
    "criticalGaps": ["Kafka"],
    "jobSpecificGaps": ["Spark"],
    "learningPlan": ["Step 1...", "Step 2..."],
    "resumeTips": ["Highlight...", "Quantify..."],
    "interviewTopics": ["System design", "Data modeling"],
    "applicationStrategy": "...",
    "salaryInsight": "..."
  }
}
```

### Learning Path item
```json
{
  "goalId": "g_...",
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "items": [
    {
      "topic": "SQL Fundamentals",
      "description": "...",
      "estimatedHours": 10,
      "status": "Completed",
      "resources": [{ "title": "...", "url": "..." }]
    }
  ]
}
```

### Activity log entry
```json
{ "id": "a_1234567890", "type": "skill_added", "message": "Added skill: Python (Advanced)", "at": "2026-03-19T10:00:00.000Z" }
```
Activity is stored in `localStorage` only (not synced to server) as a lightweight per-device audit trail.

---

## Storage Layer (`js/storage.js`)

| Function | Description |
|---|---|
| `stRead(module)` | Read array from localStorage |
| `stWrite(module, data)` | Write array to localStorage + server sync |
| `stUpsert(module, item)` | Insert or update item by `id` |
| `stDelete(module, id)` | Remove item by `id` |
| `stReadObj(module)` | Read single object (e.g. timetable config) |
| `stWriteObj(module, obj)` | Write single object |
| `stLog(type, message)` | Append to local activity log |
| `stInit()` | On server mode: load all modules from PHP into localStorage |
| `aiCall(action, payload)` | Unified AI call — routes to PHP proxy (server) or direct Claude API (local) |

**Server sync** is fire-and-forget via `fetch('api/<module>.php', { action:'sync', data })`.

**Modules:** `goals`, `skills`, `learning`, `timetable`, `jobs`

---

## AI Integration

### Server mode
All AI requests go through `api/ai.php`. The PHP proxy calls the Anthropic Claude API using the server-stored API key. Response is wrapped in `{ ok: true, data: { ... } }` by `jsonOut()`. The JS `aiCall()` function unwraps this envelope automatically.

### Local mode
`aiCall()` routes to `_aiCallLocal()` which calls `https://api.anthropic.com/v1/messages` directly from the browser using a key stored in `localStorage` (set via the "Set API Key" button in the topbar). Requires the `anthropic-dangerous-direct-browser-access: true` header.

**Model used:** `claude-haiku-4-5-20251001` (local), `claude-sonnet-4-6` (server).

### AI actions

| Action | Input | Output |
|---|---|---|
| `suggest_skills` | goalName, goalType | `skills[]` with name, category, level |
| `gap_narrative` | goalName, matched/partial/weak/missing arrays | `narrative` text |
| `learning_path` | goalName, goalType, missing/weak/existing skills | `items[]` with topic, hours, resources |
| `extract_resume` | pdfBase64 | `skills[]` with name, group, proficiency |
| `job_analysis` | candidateName, skills, jobText | full analysis object (matchScore, gaps, etc.) |
| `cover_letter` | candidateName, jobTitle, company, topStrengths, jobText | `letter` text |
| `ping` | — (admin only) | API key diagnostic info |

---

## Authentication

### Server mode
- **Register/Login:** `api/auth.php`. Passwords hashed with bcrypt (`password_hash`).
- **Sessions:** PHP sessions stored above web root at `../skilltrack-sessions/`. 8-hour inactivity timeout.
- **Admin role:** Emails listed in `ADMIN_EMAILS` constant in `api/auth.php` are automatically assigned `role: 'admin'` on registration. All others get `role: 'webuser'`.
- **Session data:** `uid`, `email`, `name`, `role`, `last_active`.

### Local mode
- User entered on the login page is stored in `localStorage` as `st-session`.
- Default admin user auto-seeded: `w3help@yahoo.com` / `naresh01`.
- Admin status derived from `user.role === 'admin'` (role is set at registration/seed time).

### Roles

| Role | Access |
|---|---|
| `admin` | All panels including Admin section |
| `webuser` | All panels except Admin |
| `webreader` | Read-only (enforced at UI level) |

---

## Setup & Deployment

### Local mode (no server needed)
1. Open `dashboard.html` in a browser.
2. Click **Set API Key** in the topbar and enter your Anthropic API key.
3. Register a user on `index.html` or use the seeded demo user.

### Server mode (GoDaddy / PHP hosting)
1. Upload all files to the server web root (e.g. `public_html/skilltrack/`).
2. Edit `api/config.php`:
   - Set `DATA_PATH` to a directory **above** web root for security.
   - Set `CLAUDE_API_KEY` to your Anthropic API key.
   - Adjust `SESSION_TIMEOUT` if needed.
3. Update `ADMIN_EMAILS` in `api/auth.php` with your email address.
4. Ensure the `DATA_PATH` directory is writable by PHP (`chmod 755`).
5. Access the app at `https://yourdomain.com/skilltrack/`.

**Data directory structure (server):**
```
skilltrack-data/
├── admin-templates.json      # Goal templates (shared across all users)
└── users/
    ├── index.json            # Email → uid registry
    └── <email>/              # One folder per user (uid = email)
        ├── goals.json
        ├── skills.json
        ├── learning.json
        ├── timetable.json
        └── jobs.json
```

> **Security note:** `api/config.php` contains the Claude API key. Ensure this file is not publicly accessible and is excluded from version control (`.gitignore`).

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Mirror `dashboard.html` / `dashboard.php` | Single codebase for both local and server mode; PHP adds session check + PHP header |
| File-based JSON storage (no database) | GoDaddy shared hosting; simpler ops; data volume is low |
| localStorage + fire-and-forget sync | Instant UI, no loading spinners for reads; server is source of truth on page load via `stInit()` |
| Activity log is local-only | Lightweight audit trail per device; not critical data; avoids an extra API endpoint |
| UID = email address | Deterministic; avoids lookup table for uid→path mapping; sanitized with regex in `userDir()` |
| Single `styles.css` | Small app; easier to maintain than split files or a build step |
| `_scoreColor(n)` helper in `jobs.js` | Shared by `jobs.js` and `jobposting.js` (loaded after); eliminates 3-way duplication |

---

## Development Notes

- **Mirror sync:** Any structural change to `dashboard.html` must be manually applied to `dashboard.php` and vice versa. Both files have a comment at the top as a reminder.
- **Adding a new module:** Create `api/<module>.php` (sync + list actions), add to `stInit` modules array in `storage.js`, add `_aiCallLocal` handler if AI actions needed, add panel HTML in both dashboard files.
- **Adding a new AI action:** Add a `case` in `api/ai.php` and a matching handler in `_aiCallLocal()` in `storage.js`.
- **Admin emails:** Defined once in `api/auth.php` (`ADMIN_EMAILS`). The JS side derives admin status from the `role` field returned by the `me` endpoint — there is no client-side ADMIN_EMAILS list.
