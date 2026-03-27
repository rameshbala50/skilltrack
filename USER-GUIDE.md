# SkillTrack User Guide

## Table of Contents

1. [App Overview](#app-overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Goals](#goals)
5. [My Skills](#my-skills)
6. [Required Skills](#required-skills)
7. [Gap Analysis](#gap-analysis)
8. [Learning Path](#learning-path)
9. [Timetable](#timetable)
10. [Progress](#progress)
11. [Job Posting Analyser](#job-posting-analyser)
12. [Job Tracker](#job-tracker)
13. [Admin Section](#admin-section)
14. [User Profile](#user-profile)
15. [Tips and Keyboard Shortcuts](#tips-and-keyboard-shortcuts)

---

## App Overview

SkillTrack is a career intelligence and learning tracker application. It helps you define career goals, inventory your skills, identify gaps, create AI-powered learning paths, schedule study sessions, analyse job postings, and track job applications -- all in one place.

The application has a sidebar-based navigation with panels organized into four sections:

- **Overview** -- Dashboard
- **Planning** -- Goals, My Skills, Required Skills, Gap Analysis
- **Learning** -- Learning Path, Timetable, Progress
- **Job** -- Job Posting Analyser, Job Tracker

SkillTrack works in two modes:
- **Server mode** -- Hosted with PHP backend, multi-user login, server-side AI calls, data synced to server.
- **Local mode** -- Open `dashboard.html` directly in a browser. Data stored in localStorage. AI features require you to provide your own Anthropic API key.

---

## Getting Started

### Registration

1. Navigate to the SkillTrack login page (`index.html` or `index.php`).
2. Click **Register** or **Create Account**.
3. Enter your name, email address, and a password (minimum 8 characters).
4. After registration, you are automatically logged in and redirected to the Dashboard.

### Login

1. Enter your registered email and password.
2. Click **Log In**.
3. You will be redirected to the Dashboard.

Sessions remain active for 8 hours. If your session expires, you will be redirected to the login page. Any changes made during an expired session are saved locally and will sync when you log in again.

### Forgot Password

1. On the login page, click **Forgot Password** (or the reset password link).
2. Enter the email address associated with your account.
3. Enter a new password (minimum 8 characters).
4. Click **Reset Password**. You can then log in with your new password.

Note: This is a self-service reset -- no email verification is sent. You must know the email address registered on the account.

### Local Mode Setup

If running SkillTrack locally (file:// protocol):
1. Open `dashboard.html` in your browser.
2. A default test user is seeded automatically.
3. For AI features, click **Set API Key** in the top bar and enter your Anthropic API key (starts with `sk-ant-`). The key is stored only in your browser's localStorage.

---

## Dashboard

The Dashboard is your at-a-glance overview of all SkillTrack activity.

### Stat Cards

Four stat cards are displayed at the top:

| Card | Shows | Breakdown |
|------|-------|-----------|
| **Goals** | Count of active goals (excludes "On Hold") | By goal type (Job Role, Certification, etc.) |
| **Skills** | Total count of skills in My Skills | Required skills per goal + My Skills total |
| **Gaps** | Total skills gaps across all goals | Gaps per goal |
| **Jobs** | Total tracked jobs | Jobs per linked goal |

Each card includes a hover/expand breakdown showing the contributing details.

### Goal Progress

Below the stats, you see a progress widget for your top 5 goals. Each goal shows:
- Goal name and type icon
- A progress bar based on completed learning path items
- Completion percentage

Click any goal to navigate to the Goals panel.

### Today's Sessions

Shows timetable sessions scheduled for today, with status (Completed or Planned) and duration.

### Activity Feed

A chronological feed of your last 8 actions, including:
- Goals added/updated/deleted
- Skills added/updated/deleted
- Learning paths generated
- Jobs added/analysed
- Gap analyses run
- Resume uploads
- Timetable sessions

Each entry shows a type icon, description, and relative timestamp (e.g., "2h ago", "3d ago").

---

## Goals

Goals represent your career targets. Each goal can be a **Job Role**, **Certification**, **Personal Learning**, or **Other**.

### Creating a Goal

1. Click **New Goal** in the top bar or the + button.
2. A choice modal appears with two options:
   - **Start from Scratch** -- Opens an empty goal form.
   - **Use a Template** -- Browse pre-built goal templates with pre-populated required skills.

### Goal Templates

Templates are curated starting points that come with a full set of required skills organized by category. Click **Use Template** to create a goal pre-filled with the template's name, type, description, and required skills.

### Goal Form Fields

| Field | Description |
|-------|-------------|
| **Name** | The goal name (required). E.g., "Snowflake Architect", "AWS Solutions Architect Cert" |
| **Type** | Job Role, Certification, Personal Learning, or Other |
| **Priority** | Primary, Active, or On Hold |
| **Target Date** | Optional deadline |
| **Description** | Optional detailed description |
| **Required Skills** | Skills needed for this goal (can add manually or via AI) |
| **Notes** | Free-form notes |

### Adding Required Skills in the Goal Modal

- Type skill names separated by commas and press Enter.
- Click **AI Suggest** to have AI generate 15-20 relevant skills based on the goal name and type.
- Remove skills by clicking the X on their chip.

### Priority Levels

- **Primary** -- Your main focus. Shown prominently on Dashboard.
- **Active** -- Currently working on, but not the main focus.
- **On Hold** -- Paused. Excluded from the active goal count on the Dashboard.

### Filtering Goals

Use the type and priority pill tabs above the goals grid to filter by:
- Type: All, Job Role, Certification, Personal Learning, Other
- Priority: All, Primary, Active, On Hold

---

## My Skills

The My Skills panel is your personal skill inventory. Skills are organized into groups and displayed with proficiency levels.

### Skill Groups

- Cloud & Data Platforms
- Data Engineering
- Programming
- AI/ML
- Visualization & BI
- DevOps & CI/CD
- Architecture & Design
- Soft Skills
- Custom

### Proficiency Levels

| Level | Meaning |
|-------|---------|
| **Beginner** | Foundational awareness |
| **Intermediate** | Working knowledge |
| **Advanced** | Deep competence |
| **Expert** | Mastery / can teach others |

### Adding Skills Manually

1. Click **Add Skill** in the top bar.
2. Fill in the skill name (required).
3. Select the group from the dropdown.
4. Choose the proficiency level using the button selector.
5. Optionally add notes.
6. Click **Save**.

Duplicate skill names (case-insensitive) are prevented.

### PDF Resume Upload

1. Click **Upload Resume** on the My Skills panel.
2. Select a PDF file of your resume.
3. Click **Extract** to send the PDF to AI for skill extraction.
4. AI identifies skills from your resume and assigns them to appropriate groups and proficiency levels.
5. Only new skills (not already in your list) are added.

### AI Auto-Categorization

If you have skills in the "Custom" group, click the **Auto-categorize** button on the Custom group header. The system uses a built-in keyword mapping to move skills to the correct group based on their name (e.g., "Python" goes to Programming, "AWS" goes to Cloud & Data Platforms).

### Filtering and Searching

- Use the group tabs at the top to filter by skill group (All, Cloud & Data Platforms, etc.).
- Use the search box to search by skill name or group name.

### Summary Bar

A summary bar at the top shows total skill count and pills for each proficiency level with counts.

---

## Required Skills

The Required Skills panel lets you define what skills each goal needs. These are the target skills that get compared against your actual skills in Gap Analysis.

### Selecting a Goal

Click a goal card on the left to select it. The right panel shows that goal's required skills.

### Adding Required Skills

1. Select a goal.
2. Type skill names (comma-separated) in the input field.
3. Select a **Category** from the dropdown (categories come from the goal's existing skills plus "General").
4. Select a **Required Level** (Beginner, Intermediate, Advanced, Expert).
5. Press Enter or click **Add**.

### AI Suggest

Click **AI Suggest** to have AI generate 15-20 categorized skills based on the goal's name, type, and description. New skills are appended; duplicates are skipped. A status message shows how many were added.

### Editing Skills

Click the edit icon on any skill to change its name, category, or required level in a modal.

### Removing Skills

Click the delete icon on any skill to remove it. Use **Clear All** to remove all required skills for the selected goal (with confirmation).

### Category Tabs

Filter the skill list by category using the pill tabs. Each tab shows the skill count for that category.

---

## Gap Analysis

Gap Analysis compares your skills (My Skills) against the required skills for each goal to identify gaps.

### Running an Analysis

1. Select a goal from the goal cards.
2. The analysis runs automatically, comparing each required skill against your skill inventory.

### Match Statuses

| Status | Meaning | Condition |
|--------|---------|-----------|
| **Matched** | You meet or exceed the requirement | Your proficiency rank >= required rank |
| **Partial** | Close but one level below | Your rank is exactly one level below required |
| **Weak** | Significantly below requirement | Your rank is two or more levels below required |
| **Missing** | Not in your skill profile at all | No matching skill found |

### Fuzzy Skill Matching

The system uses four matching strategies (in order):

1. **Exact match** -- Skill names match exactly (case-insensitive).
2. **Contains** -- One skill name contains the other (e.g., "Python" matches "Python Programming").
3. **Base match** -- Stripped of parenthetical qualifiers, then compared (e.g., "Python (Advanced)" matches "Python").
4. **Word overlap** -- At least 50% of significant words overlap (minimum 2 shared words).

### Results Display

The results show:
- **Summary grid** -- Counts and percentages for Matched, Partial, Weak, and Missing.
- **Visual bar** -- Color-coded stacked bar showing proportions.
- **Category tables** -- Each category shows a table with columns: Required Skill, Required Level, Your Matching Skill, Your Level, Status.

### Edit Match Override

Click the pencil icon next to any matched skill to manually change or clear the match:
- Type a skill name from My Skills to force a specific match.
- Type "clear" to force "no match" (mark as Missing).
- Type "auto" or leave blank to reset to automatic matching.

Overrides are stored per-user in localStorage and persist across sessions.

### AI Narrative

Click **AI Narrative** to generate a coaching-style narrative that:
- Highlights your strengths
- Identifies the most important gaps
- Provides encouraging next-step recommendations

### Quick Actions

- Click **+ I have this** on a missing skill to add it to My Skills.
- Click **+ Improve** on a partial/weak skill to update your proficiency.

---

## Learning Path

The Learning Path panel generates AI-powered study plans based on your gap analysis.

### Generating a Learning Path

1. Select a goal.
2. Click **Generate Learning Path**.
3. AI creates 8-12 ordered topics, from foundational to advanced, focusing on your missing and weak skills.

### Learning Path Items

Each topic includes:
- **Topic name** and description
- **Estimated hours** to complete
- **Resources** -- Links to courses, tutorials, documentation
- **Status** -- Not Started, In Progress, or Completed

### Tracking Progress

Click on a topic's status to cycle through: Not Started, In Progress, Completed. Progress is reflected on the Dashboard goal progress widget.

---

## Timetable

The Timetable lets you schedule study sessions tied to your learning path topics.

### Adding a Session

1. Click **Add Session**.
2. Select a date, topic, and planned duration.
3. Save the session.

### Session Statuses

- **Planned** -- Upcoming session
- **Completed** -- Finished session

### Dashboard Integration

Today's sessions appear on the Dashboard in the "Today's Sessions" widget.

---

## Progress

The Progress panel provides a visual overview of your completion across all goals and learning paths. It tracks how many learning items are completed vs. total for each goal.

---

## Job Posting Analyser

The Job Posting Analyser lets you evaluate job postings against your skill profile.

### Input Methods

- **Paste text** -- Copy and paste a job description directly into the text area.
- **Provide a URL** -- Enter a job posting URL and click **Fetch** to extract the description. Works with major job sites; Dice.com has special handling for its JavaScript-rendered content.

### Quick Scan

Click **Quick Scan** for a fast, client-side analysis:
- Checks which of your skills are explicitly mentioned in the job text.
- Shows matched skill count, total skills, and coverage percentage.
- No AI required; runs entirely in the browser.

### AI Analyse

Click **AI Analyse** for a comprehensive AI-powered analysis:
- If only a URL is provided (no text), the system fetches the description first.
- AI evaluates the job against your complete skill profile and returns:

| Section | Content |
|---------|---------|
| **Job Summary** | Role, company, client, posted date, salary, location, work mode, employment type, employer type, source |
| **Match Score** | 0-100 score with ring chart |
| **Match Level** | Strong Match / Moderate Match / Partial Match |
| **Overall Advice** | 2-3 sentence coaching summary |
| **Top Strengths** | Your strongest relevant skills |
| **Critical Gaps** | Most important skills you are missing |
| **Job-Specific Gaps** | Gaps specific to this posting |
| **Interview Topics** | Topics to prepare for |
| **Resume Tips** | Suggestions for tailoring your resume |
| **Learning Plan** | Ordered steps to close gaps |
| **Application Strategy** | How to approach this application |
| **Salary Insight** | Salary context if available |

### Cover Letter

After running AI Analyse, click **Cover Letter** to generate a professional 3-paragraph cover letter tailored to the job. You can copy it to clipboard or regenerate it.

### Save to Job Tracker

Click **Save to Job Tracker** to add the analysed job to your Job Tracker with all extracted metadata. The system performs a duplicate check (matching on role + company + location):
- If a duplicate is found, you can choose to **Update analysis** (overwrite AI analysis) or **Keep existing**.
- New jobs are saved with status "Job Added".

---

## Job Tracker

The Job Tracker manages all your job applications in a comprehensive table view.

### Table View

The default view is a paginated table (50 jobs per page) with these columns:
- Job ID, Role, Company, Status, Match Score, State, Source, Salary, Added Date

### Job Statuses

| Status | Description |
|--------|-------------|
| Job Added | Newly saved, not yet reviewed |
| Can Be Applied | Reviewed and worth applying to |
| Applied | Application submitted |
| Phone Screen | Phone/initial screening scheduled |
| Interview | Interview(s) in progress |
| Offer | Offer received |
| Accepted | Offer accepted |
| Rejected | Application rejected |
| Withdrawn | You withdrew the application |
| No Response | No response received |
| Not Interested | Decided not to pursue |
| Duplicate | Automatically detected as duplicate |

### Filters

The tracker provides dropdown filters for:
- **Status** -- Filter by any job status
- **Role Category** -- AI Engineer, ML Engineer, Data Scientist, Snowflake Architect, Other
- **Company** -- Filter by company name
- **State** -- Filter by state/province
- **Employment Type** -- Full-Time, Part-Time, Contract, Contract-to-Hire, etc.
- **Source** -- LinkedIn, Dice, Indeed, Glassdoor, etc.
- **Goal** -- Filter by linked goal
- **Date** -- Filter by date added
- **Job ID Prefix** -- Filter by job ID category (JOB-AIENG, JOB-MLENG, etc.)

### Search

The search box searches across all fields: job ID, role, company, client, status, location, work mode, employment type, employer type, source, salary, goal, and notes.

### Sorting

Click any column header to sort by that column. Click again to toggle ascending/descending. All columns are sortable.

### Pipeline Overview

A colored pipeline bar at the top shows counts for each active status, giving you a visual overview of your application pipeline.

### Inline Detail Pane

Click any job row to expand an inline detail pane showing:
- Full job metadata (role, company, client, location, work mode, salary, dates, etc.)
- AI analysis results (match score ring, strengths, gaps, interview topics, learning plan)
- Job description text (if saved)

### Job Analysis

Click the **Job Analysis** button on a selected job to re-run AI analysis. Options include:
- **Re-analyze all** checkbox -- When checked, analyses all jobs that have job description text, not just the selected one.
- Analysis fetches the job description from the saved URL if available, then runs the AI analysis.
- AI metadata always overwrites existing fields (role, company, location, salary, etc.).
- After analysis, the job ID is updated if the role category changed.
- Duplicate detection runs automatically after analysis.

### Fetch Job Description

In the edit modal, click **Fetch Job Desc** to retrieve the job description from the saved URL. This is useful for jobs that were saved without a description.

### Edit Modal

Click the edit icon to open the full edit modal with all metadata fields:
- Role, Company, Client, Status
- Job URL, Source, Employer Type, Employment Type
- Salary, Work Mode, Location (City, State, Country)
- Posted Date, Applied Date, Linked Goal
- Notes, Job Description text

### Duplicate Detection

When AI analysis updates a job, the system checks for duplicates by matching:
- Same company (case-insensitive)
- Same role (case-insensitive)
- Same city (case-insensitive)

Detected duplicates are automatically marked with "Duplicate" status and a note referencing the original job.

### Job ID System

Jobs are assigned structured IDs based on the role category:
- `JOB-AIENG-001` -- AI Engineer roles
- `JOB-MLENG-001` -- ML Engineer roles
- `JOB-DATASC-001` -- Data Scientist roles
- `JOB-SNFSA-001` -- Snowflake Architect roles
- `JOB-OTH-001` -- Other roles

IDs are auto-generated and updated when the role changes.

---

## Admin Section

The Admin section is visible only to users with the "admin" role. It contains five sub-panels accessible from the sidebar:

### Overview

Displays summary statistics:
- Registered user count
- Goal template count
- Total template skills count
- Quick links to manage templates and users

### Goal Templates

Manage the goal templates available to all users:

- **Template List** -- Left panel shows all templates with icon, name, type, and skill count.
- **Template Detail** -- Right panel shows the selected template's skills organized by category.
- **New Template** -- Create a template with name, type, icon, description, tags, and initial skills.
- **AI Suggest** -- Generate skill suggestions for the selected template.
- **Edit Skills** -- Add, edit, or remove individual skills with category and level controls.
- **Category filter tabs** -- Filter skills by category within a template.

### Users

Manage registered users:

- **User Table** -- Shows all users with name, email, role, and registration date.
- **User Profile Modal** -- Click a user to view/edit their profile:
  - Change name and role (admin, webuser, webreader)
  - Reset their password (admin sets a new password directly)
  - Delete the user account
- **Work as User** -- See Parameters section below.

### Test Cases

An integrated test runner with predefined test cases. Tests auto-run and report pass/fail status for core application functionality.

### Parameters

Application configuration and administrative tools:

- **Work-as-User** -- Admins can impersonate any user to view and modify their data. When active, a banner appears in the sidebar showing which user you are working as. Click the banner to stop impersonation. All data operations (read/write/sync) use the impersonated user's ID.

---

## User Profile

Click your name/avatar in the sidebar footer to open the User Profile modal.

### Change Name

1. Edit the name field.
2. Click **Save**.
3. The name updates in the sidebar and across the application.

### Change Password

1. Enter your current password.
2. Enter a new password (minimum 8 characters).
3. Confirm the new password.
4. Click **Change Password**.

---

## Tips and Keyboard Shortcuts

### General Tips

- **Sidebar toggle** -- Click the hamburger menu icon on the top bar to toggle the sidebar on mobile devices (screen width below 1024px).
- **Quick navigation** -- Click any panel name in the sidebar to switch panels. The current panel re-renders with fresh data each time.
- **Data persistence** -- In server mode, changes are saved to both localStorage (instant) and the server (async). If the server is unreachable, a red warning bar appears at the top. Changes are preserved locally.
- **Session expiry** -- Sessions last 8 hours. If expired, you see a warning banner with a link to log in again. Local changes are not lost.

### Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| **Enter** | Skill input fields | Add the typed skill(s) |
| **Comma (,)** | Skill input fields | Add the typed skill(s) (alternative to Enter) |
| **Enter** | Required Skills edit modal | Save the edit |
| **Escape** | Any open modal | Close the modal (click outside the modal content area) |

### AI Features

- AI features use the Claude API (Anthropic). In server mode, the API key is configured on the server. In local mode, you must provide your own key via the **Set API Key** button.
- AI actions include: skill suggestions, gap narrative, learning path generation, resume skill extraction, job analysis, and cover letter generation.
- The **Set API Key** button in the top bar appears only in local mode. The label shows "API Key Set" when a key is configured.

### Job Tracker Tips

- Use the search box for quick filtering across all fields.
- Combine multiple dropdown filters to narrow results (e.g., "Applied" status + "Remote" work mode).
- Click a column header to sort, click again to reverse.
- The pipeline bar at the top gives an instant visual of your application pipeline health.
- Use the Job Posting Analyser for new jobs, then save to tracker. Use the tracker's built-in analysis for re-analysing existing jobs.

### Data Tips

- Activity logs are kept locally only (not synced to server) and are limited to the last 100 entries.
- Gap analysis match overrides are stored per-user in localStorage.
- In local mode, the "demo" user ID is used if no session exists.
