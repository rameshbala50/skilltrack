<?php
// MIRROR SYNC: This file must be kept in sync with dashboard.html.
// Any structural changes (panels, modals, nav items, scripts) must be
// applied to BOTH files. dashboard.php is the server-mode entry point;
// dashboard.html is the local/file-mode entry point.
require_once __DIR__ . '/api/_common.php';
startAppSession();
if (!isset($_SESSION['uid'])) {
    header('Location: index.html');
    exit;
}
// Capture session data for inline JS before closing session
$_st_user_json = json_encode([
    'uid'   => $_SESSION['uid']   ?? '',
    'name'  => $_SESSION['name']  ?? '',
    'email' => $_SESSION['email'] ?? '',
    'role'  => $_SESSION['role']  ?? 'webuser',
], JSON_HEX_TAG | JSON_HEX_APOS);
session_write_close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkillTrack</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<?php $v = filemtime(__DIR__ . '/js/app.js') ?: time(); ?>
  <link rel="stylesheet" href="css/styles.css?v=<?php echo $v; ?>">
</head>
<body class="app-body">

  <!-- Skip to content -->
  <a href="#app-content-main" class="skip-link">Skip to main content</a>

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
    <div class="sidebar-logo">
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="white" fill-opacity="0.12"/>
        <path d="M10 28L16 18L22 22L28 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="28" cy="12" r="3" fill="#06b6d4"/>
        <circle cx="22" cy="22" r="2.5" fill="white" fill-opacity="0.7"/>
        <circle cx="16" cy="18" r="2.5" fill="white" fill-opacity="0.7"/>
      </svg>
      <span>SkillTrack</span>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Overview</div>
      <a class="nav-item active" data-panel="dashboard" onclick="switchPanel('dashboard', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Dashboard
      </a>

      <div class="nav-section-label">Planning</div>
      <a class="nav-item" data-panel="goals" onclick="switchPanel('goals', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        Goals
      </a>
      <a class="nav-item" data-panel="skills" onclick="switchPanel('skills', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        My Skills
      </a>
      <a class="nav-item" data-panel="reqskills" onclick="switchPanel('reqskills', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Required Skills
      </a>
      <a class="nav-item" data-panel="gap" onclick="switchPanel('gap', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Gap Analysis
      </a>

      <div class="nav-section-label">Learning</div>
      <a class="nav-item" data-panel="learning" onclick="switchPanel('learning', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        Learning Path
      </a>
      <a class="nav-item" data-panel="timetable" onclick="switchPanel('timetable', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Timetable
      </a>
      <a class="nav-item" data-panel="progress" onclick="switchPanel('progress', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Progress
      </a>

      <div class="nav-section-label">Job</div>
      <a class="nav-item" data-panel="jobposting" onclick="switchPanel('jobposting', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="M20 19c0-2.21-3.58-4-8-4"/></svg>
        Job Posting
      </a>
      <a class="nav-item" data-panel="jobs" onclick="switchPanel('jobs', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        Job Tracker
      </a>

      <!-- Admin nav — hidden until role verified -->
      <div class="nav-section-label admin-only" style="display:none">Admin</div>
      <a class="nav-item admin-only" data-panel="admin-overview" style="display:none" onclick="switchPanel('admin-overview', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Overview
      </a>
      <a class="nav-item admin-only" data-panel="admin-templates" style="display:none" onclick="switchPanel('admin-templates', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Goal Templates
      </a>
      <a class="nav-item admin-only" data-panel="admin-users" style="display:none" onclick="switchPanel('admin-users', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Users
      </a>
      <a class="nav-item admin-only" data-panel="admin-tests" style="display:none" onclick="switchPanel('admin-tests', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Test Cases
      </a>
      <a class="nav-item admin-only" data-panel="admin-params" style="display:none" onclick="switchPanel('admin-params', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Parameters
      </a>
      <a class="nav-item admin-only" data-panel="admin-userguide" style="display:none" onclick="switchPanel('admin-userguide', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        User Guide
      </a>
      <a class="nav-item admin-only" data-panel="admin-funcspec" style="display:none" onclick="switchPanel('admin-funcspec', this)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Func Spec
      </a>
    </nav>

    <div class="sidebar-footer">
      <div id="work-as-banner" style="display:none;padding:6px 10px;margin-bottom:6px;background:#f59e0b18;border:1px solid #f59e0b40;border-radius:8px;cursor:pointer" onclick="adminClearWorkAs()" title="Click to stop impersonation">
        <div style="font-size:10px;color:#92400e;font-weight:600;letter-spacing:.3px">WORKING AS</div>
        <div id="work-as-label" style="font-size:12px;color:#b45309;font-weight:500;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
        <div style="font-size:9px;color:#d97706;margin-top:2px">Click to stop ✕</div>
      </div>
      <div class="sidebar-user" onclick="openUserProfileModal()" title="View profile">
        <div class="user-avatar" id="user-avatar">R</div>
        <div class="user-info">
          <div class="user-name" id="user-name">Loading…</div>
          <div class="user-email" id="user-email"></div>
        </div>
      </div>
      <a href="#" class="btn-logout" title="Sign out" onclick="handleLogout(); return false;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </a>
    </div>
  </aside>

  <!-- Inline: set user info, admin state, and globals immediately -->
  <script>
  (function(){
    try {
      // Server mode: PHP injects session data directly
      var s = <?php echo $_st_user_json; ?>;
      // Fallback for local mode
      if (!s || !s.uid) {
        s = null;
        var h = location.hash;
        if (h && h.indexOf('#s=') === 0) {
          try {
            s = JSON.parse(atob(h.slice(3)));
            localStorage.setItem('st-session', JSON.stringify(s));
            history.replaceState(null, '', location.pathname);
          } catch(e) {}
        }
        if (!s) {
          try { s = JSON.parse(localStorage.getItem('st-session')); } catch(e) {}
        }
      }
      if (s) {
        var nm = s.name || s.email || 'User';
        var el = document.getElementById('user-name');
        if (el) el.textContent = nm;
        var el2 = document.getElementById('user-email');
        if (el2) el2.textContent = s.email || '';
        var el3 = document.getElementById('user-avatar');
        if (el3) el3.textContent = nm.charAt(0).toUpperCase();
        // Set globals so admin.js _adminGuard() and other modules work
        window._currentUser = s;
        window._isAdmin = (s.role === 'admin');
        // Show admin sidebar items
        if (s.role === 'admin') {
          var items = document.querySelectorAll('.admin-only');
          for (var i = 0; i < items.length; i++) items[i].style.display = '';
        }
      }
    } catch(e) {}
  })();

  </script>

  <!-- Main content -->
  <div class="app-main">

    <!-- Topbar -->
    <header class="topbar">
      <button class="sidebar-toggle" id="sidebar-toggle" onclick="toggleSidebar()" title="Toggle sidebar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="topbar-breadcrumb">
        <span id="topbar-title">Dashboard</span>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-ghost btn-sm" id="topbar-apikey-btn" onclick="stSetApiKey()" title="Configure Claude API key for local AI features" style="display:none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          <span id="topbar-apikey-label">Set API Key</span>
        </button>
        <button class="btn btn-primary btn-sm" id="topbar-action-btn" style="display:none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span id="topbar-action-label">Add</span>
        </button>
      </div>
    </header>

    <!-- Panels -->
    <main class="app-content" id="app-content-main" role="main">

      <!-- ── 1. Dashboard ─────────────────────────────────────── -->
      <section class="panel active" id="panel-dashboard">
        <div class="panel-header">
          <h1 class="panel-title">Dashboard</h1>
          <p class="panel-subtitle">Your learning overview at a glance</p>
        </div>

        <div class="stat-grid" id="dash-stat-grid" style="opacity:0;transition:opacity .3s">
          <div class="stat-card">
            <div class="stat-icon stat-icon-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-value" id="stat-goals">0</div>
              <div class="stat-label">Active Goals</div>
              <div class="stat-breakdown" id="stat-goals-breakdown"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-value" id="stat-skills">0</div>
              <div class="stat-label">Skills Tracked</div>
              <div class="stat-breakdown" id="stat-skills-breakdown"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-value" id="stat-gaps">0</div>
              <div class="stat-label">Skill Gaps</div>
              <div class="stat-breakdown" id="stat-gaps-breakdown"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-value" id="stat-jobs">0</div>
              <div class="stat-label">Jobs Tracked</div>
              <div class="stat-breakdown" id="stat-jobs-breakdown"></div>
            </div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Goal Progress</h3>
              <a href="#" class="card-link" onclick="switchPanel('goals',null);return false">View all →</a>
            </div>
            <div class="card-body" id="dash-goal-progress"></div>
          </div>
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Today's Schedule</h3>
              <a href="#" class="card-link" onclick="switchPanel('timetable',null);return false">View all →</a>
            </div>
            <div class="card-body" id="dash-today"></div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">
            <h3 class="card-title">Recent Activity</h3>
          </div>
          <div class="card-body" id="dash-activity"></div>
        </div>
      </section>

      <!-- ── 2. Goals ─────────────────────────────────────────── -->
      <section class="panel" id="panel-goals">
        <div class="panel-header">
          <h1 class="panel-title">Goals</h1>
          <p class="panel-subtitle">Define what you're working towards</p>
        </div>

        <div class="filter-bar">
          <div class="filter-pills" id="goal-type-filter">
            <button class="pill active" data-filter="all">All</button>
            <button class="pill" data-filter="Job Role">Job Role</button>
            <button class="pill" data-filter="Certification">Certification</button>
            <button class="pill" data-filter="Personal Learning">Personal Learning</button>
            <button class="pill" data-filter="Other">Other</button>
          </div>
          <div class="filter-pills" id="goal-priority-filter">
            <button class="pill active" data-filter="all">All Priority</button>
            <button class="pill" data-filter="Primary">Primary</button>
            <button class="pill" data-filter="Active">Active</button>
            <button class="pill" data-filter="On Hold">On Hold</button>
          </div>
        </div>

        <div id="goals-list">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <h3>No goals yet</h3>
            <p>Goals help you focus your learning. Create your first goal to get started.</p>
            <button class="btn btn-primary" onclick="openGoalModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Goal
            </button>
          </div>
        </div>
      </section>

      <!-- ── 3. My Skills ─────────────────────────────────────── -->
      <section class="panel" id="panel-skills">
        <div class="panel-header">
          <h1 class="panel-title">My Skills</h1>
          <p class="panel-subtitle">Track and manage your skill proficiency</p>
        </div>

        <div class="toolbar">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="skills-search" placeholder="Search skills…">
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-ghost" onclick="openResumeUpload()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Resume
            </button>
            <button class="btn btn-primary" onclick="openSkillModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Skill
            </button>
          </div>
        </div>

        <div class="skill-group-tabs" id="skill-group-tabs">
          <button class="pill active" data-group="all">All</button>
          <button class="pill" data-group="Cloud & Data Platforms">Cloud</button>
          <button class="pill" data-group="Data Engineering">Data Eng</button>
          <button class="pill" data-group="Programming">Programming</button>
          <button class="pill" data-group="AI/ML">AI/ML</button>
          <button class="pill" data-group="Visualization & BI">BI</button>
          <button class="pill" data-group="DevOps & CI/CD">DevOps</button>
          <button class="pill" data-group="Architecture & Design">Architecture</button>
          <button class="pill" data-group="Soft Skills">Soft Skills</button>
          <button class="pill" data-group="Custom">Custom</button>
        </div>

        <div id="skills-grid">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <h3>No skills added yet</h3>
            <p>Add your skills manually, or upload your resume to extract them automatically.</p>
            <div class="btn-group">
              <button class="btn btn-primary" onclick="openSkillModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Skill
              </button>
              <button class="btn btn-ghost" onclick="openResumeUpload()">Upload Resume</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 3b. Required Skills ───────────────────────────────── -->
      <section class="panel" id="panel-reqskills">
        <div class="panel-header">
          <h1 class="panel-title">Required Skills</h1>
          <p class="panel-subtitle">Define skills needed for each goal — used by Gap Analysis</p>
        </div>

        <!-- Goal selector cards -->
        <div class="goal-sel-cards" id="rs-goal-cards"></div>

        <!-- Actions bar (shown after goal selected) -->
        <div class="goal-sel-panel-actions" id="rs-toolbar-actions" style="display:none">
          <div id="rs-ai-status" style="font-size:12px;color:var(--cyan)"></div>
          <button class="btn btn-ghost btn-sm" onclick="rsClearAll()">Clear All</button>
          <button class="btn btn-primary btn-sm" id="rs-ai-btn" onclick="rsGenerateAI()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            AI Suggest
          </button>
        </div>

        <!-- Empty: no goal selected -->
        <div id="rs-no-goal">
          <div class="empty-state" style="margin-top:40px">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <h3>Select a goal to get started</h3>
            <p>Choose a goal from the dropdown above to view and manage its required skills.</p>
          </div>
        </div>

        <!-- Goal content (shown after goal selected) -->
        <div id="rs-goal-content" style="display:none">

          <!-- Goal info card -->
          <div id="rs-goal-info" style="margin-bottom:16px"></div>

          <!-- Category filter tabs (like skill-group-tabs) -->
          <div class="skill-group-tabs" id="rs-cat-tabs"></div>

          <!-- Card grid (filled by JS — mirrors skills-grid) -->
          <div id="rs-grid"></div>

          <!-- Add manually -->
          <div class="rs-add-bar">
            <select class="form-input" id="rs-cat-select" style="width:210px;flex-shrink:0">
              <option value="General">Select Category…</option>
            </select>
            <select class="form-input" id="rs-level-select" style="width:130px;flex-shrink:0">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced" selected>Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <input class="form-input" style="flex:1;min-width:180px" type="text" id="rs-skill-input"
              placeholder="Skill name(s), comma-separated — press Enter to add…"
              onkeydown="rsSkillKeydown(event)">
            <button class="btn btn-secondary" onclick="rsAddSkill()">Add</button>
          </div>

        </div>
      </section>

      <!-- ── 4. Gap Analysis ──────────────────────────────────── -->
      <section class="panel" id="panel-gap">
        <div class="panel-header">
          <h1 class="panel-title">Gap Analysis</h1>
          <p class="panel-subtitle">See exactly what skills you need for each goal</p>
        </div>

        <!-- Goal selector cards — click to auto-run analysis -->
        <div class="goal-sel-cards" id="gap-goal-cards"></div>

        <div id="gap-results">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <h3>No analysis yet</h3>
            <p>Select a goal above and run the analysis to see your matched, weak, and missing skills.</p>
          </div>
        </div>
      </section>

      <!-- ── 5. Learning Path ─────────────────────────────────── -->
      <section class="panel" id="panel-learning">
        <div class="panel-header">
          <h1 class="panel-title">Learning Path</h1>
          <p class="panel-subtitle">AI-generated study roadmap per goal</p>
        </div>

        <!-- Goal selector cards -->
        <div class="goal-sel-cards" id="lp-goal-cards"></div>

        <!-- Generate button (shown after goal selected) -->
        <div class="goal-sel-panel-actions" id="lp-gen-actions" style="display:none">
          <button class="btn btn-primary btn-sm" id="btn-gen-path" onclick="generateLearningPath()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Generate Path
          </button>
        </div>

        <div id="learning-path-content">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <h3>No learning path yet</h3>
            <p>Select a goal and generate a path. The AI will order topics from foundational to advanced.</p>
          </div>
        </div>
      </section>

      <!-- ── 6. Progress ──────────────────────────────────────── -->
      <section class="panel" id="panel-progress">
        <div class="panel-header">
          <h1 class="panel-title">Progress</h1>
          <p class="panel-subtitle">Track your learning progress and activity</p>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-success"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="stat-body"><div class="stat-value" id="prog-completed">0</div><div class="stat-label">Completed Topics</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-primary"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            <div class="stat-body"><div class="stat-value" id="prog-avg">0%</div><div class="stat-label">Avg. Goal Progress</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-accent"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div class="stat-body"><div class="stat-value" id="prog-week-hrs">0h</div><div class="stat-label">Hours This Week</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-warning"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
            <div class="stat-body"><div class="stat-value" id="prog-in-progress">0</div><div class="stat-label">In Progress</div></div>
          </div>
        </div>

        <div class="two-col mt-4">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Goal Progress</h3></div>
            <div class="card-body" id="prog-goals-list"></div>
          </div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">Skills by Group</h3></div>
            <div class="card-body" id="skills-breakdown"></div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header"><h3 class="card-title">Activity Feed</h3></div>
          <div class="card-body" id="activity-feed"></div>
        </div>
      </section>

      <!-- ── 7. Timetable ─────────────────────────────────────── -->
      <section class="panel" id="panel-timetable">
        <div class="panel-header">
          <h1 class="panel-title">Timetable</h1>
          <p class="panel-subtitle">Auto-schedule study sessions from your learning paths</p>
        </div>

        <div class="timetable-controls">
          <div class="view-toggle">
            <button class="pill active" data-view="week" onclick="setTimetableView('week', this)">Week</button>
            <button class="pill" data-view="day" onclick="setTimetableView('day', this)">Day</button>
            <button class="pill" data-view="month" onclick="setTimetableView('month', this)">Month</button>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-ghost" onclick="openStudyHoursModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Set Study Hours
            </button>
            <button class="btn btn-ghost" onclick="openSessionModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Session
            </button>
            <button class="btn btn-primary" onclick="autoSchedule()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Auto-Schedule
            </button>
          </div>
        </div>

        <div id="timetable-view">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <h3>No schedule yet</h3>
            <p>Set your available study hours, then auto-schedule to generate a personalised timetable from your learning paths.</p>
          </div>
        </div>
      </section>

      <!-- ── 8. Job Tracker ───────────────────────────────────── -->
      <section class="panel" id="panel-jobs">
        <div class="panel-header">
          <h1 class="panel-title">Job Tracker</h1>
          <p class="panel-subtitle">Manage your job applications in one place</p>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="openJobModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Job
          </button>
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="jobs-search" placeholder="Search jobs…">
          </div>
          <select id="jobs-filter-status" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Statuses</option></select>
          <select id="jobs-filter-rolecat" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Roles</option></select>
          <select id="jobs-filter-company" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Companies</option></select>
          <select id="jobs-filter-state" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All States</option></select>
          <select id="jobs-filter-emptype" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Types</option></select>
          <select id="jobs-filter-source" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Sources</option></select>
          <select id="jobs-filter-goal" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Goals</option></select>
          <select id="jobs-filter-date" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Dates</option></select>
          <select id="jobs-filter-jobid" class="jt-filter-select" onchange="jobsApplyFilters()"><option value="all">All Job IDs</option></select>
          <button class="btn btn-ghost" onclick="jobsOpenReport()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Report
          </button>
          <div style="display:inline-flex;align-items:center;gap:8px">
            <button class="btn btn-primary" id="jobs-bulk-analysis-btn" onclick="jobsBulkAnalysis()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Job Analysis
            </button>
            <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);cursor:pointer;white-space:nowrap" title="When checked, re-analyzes all filtered jobs including those already analyzed">
              <input type="checkbox" id="jobs-reanalyze-all" style="margin:0;cursor:pointer">
              Re-analyze all
            </label>
          </div>
        </div>

        <div id="jobs-board">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            <h3>No jobs tracked yet</h3>
            <p>Add job applications to track your progress from Wishlist to Offer.</p>
            <button class="btn btn-primary" onclick="openJobModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Job
            </button>
          </div>
        </div>
      </section>

      <!-- ── 9. Job Posting Analyser ─────────────────────────── -->
      <section class="panel" id="panel-jobposting">
        <div class="panel-header">
          <h1 class="panel-title">Job Posting Analyser</h1>
          <p class="panel-subtitle">Paste a job description — get an AI match score, gap report, and cover letter</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Job Description</h3>
            <button class="btn btn-ghost btn-sm" onclick="jpClearAll()">Clear</button>
          </div>
          <div class="card-body" style="padding-top:8px">
            <div class="form-group" style="margin-bottom:10px;display:flex;gap:8px;align-items:center">
              <input class="form-input" type="url" id="jp-url" placeholder="Paste job URL (LinkedIn, Dice, Indeed…)" style="flex:1">
              <button class="btn btn-ghost btn-sm" id="jp-fetch-btn" onclick="jpFetchUrl()" title="Fetch job description from URL">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
                Fetch
              </button>
            </div>
            <textarea class="form-input jp-textarea" id="jp-textarea" rows="10"
              placeholder="Paste the full job description here…&#10;&#10;Include the responsibilities, requirements, and desired qualifications for the best analysis."></textarea>
            <div class="jp-btn-bar">
              <button class="btn btn-ghost" id="jp-scan-btn" onclick="jpQuickScan()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Quick Scan
              </button>
              <button class="btn btn-ghost" id="jp-analyse-btn" onclick="jpRunAnalysis()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                AI Analyse
              </button>
              <button class="btn btn-ghost" id="jp-cover-btn" onclick="jpGenerateCoverLetter()" style="display:none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/></svg>
                Cover Letter
              </button>
              <button class="btn btn-ghost" id="jp-save-btn" onclick="jpSaveToTracker()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                Save to Tracker
              </button>
            </div>
            <div id="jp-msg" class="jp-msg" aria-live="polite"></div>
          </div>
        </div>

        <!-- Results (below) -->
        <div id="jp-results"></div>
      </section>

      <!-- ── Admin: Overview ──────────────────────────────────── -->
      <section class="panel" id="panel-admin-overview">
        <div class="panel-header">
          <h1 class="panel-title">Admin — Overview</h1>
          <p class="panel-subtitle">App statistics and quick links</p>
        </div>
        <div id="admin-overview-content"></div>
      </section>

      <!-- ── Admin: Goal Templates ─────────────────────────────── -->
      <section class="panel" id="panel-admin-templates">
        <div class="panel-header">
          <h1 class="panel-title">Goal Templates</h1>
          <p class="panel-subtitle">Manage reusable goal templates with required skills</p>
        </div>

        <div class="atpl-layout">
          <!-- Left: template list -->
          <div class="atpl-sidebar">
            <button class="btn btn-primary btn-sm" style="width:100%;margin-bottom:12px" onclick="openTplModal()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Template
            </button>
            <div id="atpl-list"></div>
          </div>

          <!-- Right: skills editor -->
          <div class="atpl-main">
            <div id="atpl-no-selection">
              <div class="empty-state" style="margin-top:40px">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3>Select a template</h3>
                <p>Choose a template on the left to view and edit its required skills.</p>
              </div>
            </div>

            <div id="atpl-content" style="display:none">
              <div id="atpl-header"></div>
              <div class="skill-group-tabs" id="atpl-cat-tabs" style="margin:14px 0 10px"></div>
              <div id="atpl-skills-grid"></div>

              <!-- Add skill bar -->
              <div class="rs-add-bar" style="margin-top:16px">
                <select class="form-input" id="atpl-skill-level" style="width:130px;flex-shrink:0">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced" selected>Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <input list="atpl-cat-list" class="form-input" id="atpl-skill-cat" placeholder="Category" style="width:190px;flex-shrink:0">
                <datalist id="atpl-cat-list"></datalist>
                <input class="form-input" type="text" id="atpl-skill-input" placeholder="Skill name(s), comma-separated…" style="flex:1;min-width:180px" onkeydown="adminAddTplSkillKeydown(event)">
                <button class="btn btn-secondary" onclick="adminAddTplSkill()">Add</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Admin: Users ──────────────────────────────────────── -->
      <section class="panel" id="panel-admin-users">
        <div class="panel-header">
          <h1 class="panel-title">Users</h1>
          <p class="panel-subtitle">Manage registered users, roles, and accounts</p>
        </div>
        <div id="admin-users-content"></div>
      </section>

      <!-- ── Admin: Parameters ─────────────────────────────────── -->
      <section class="panel" id="panel-admin-params">
        <div class="panel-header">
          <h1 class="panel-title">Parameters</h1>
          <p class="panel-subtitle">Global settings and admin configuration</p>
        </div>
        <div id="admin-params-container"></div>
      </section>

      <!-- ── Admin: Test Cases ──────────────────────────────────── -->
      <section class="panel" id="panel-admin-tests">
        <div class="panel-header">
          <h1 class="panel-title">Test Cases</h1>
          <p class="panel-subtitle">Comprehensive test plan with automated and manual test execution</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="stRunAutoTests()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Auto Tests
          </button>
          <select id="st-tp-area" class="jt-filter-select" onchange="stRenderTestPlan()"><option value="all">All Areas</option></select>
          <select id="st-tp-priority" class="jt-filter-select" onchange="stRenderTestPlan()"><option value="all">All Priorities</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
          <select id="st-tp-type" class="jt-filter-select" onchange="stRenderTestPlan()"><option value="all">All Types</option><option value="auto">Auto</option><option value="manual">Manual</option></select>
          <span id="st-tp-count" style="font-size:12px;color:var(--muted)"></span>
        </div>
        <div id="st-auto-results" style="margin-bottom:16px"></div>
        <div id="st-testplan-container"></div>
      </section>

      <!-- ── Admin: User Guide ─────────────────────────────────── -->
      <section class="panel" id="panel-admin-userguide">
        <div class="panel-header" style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h1 class="panel-title">User Guide</h1>
            <p class="panel-subtitle">Complete user documentation for SkillTrack</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="adminDownloadDoc('userguide')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download HTML
          </button>
        </div>
        <div id="admin-userguide-content" style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:24px 32px;max-height:70vh;overflow-y:auto;line-height:1.7;font-size:14px">
          <p style="color:var(--muted)">Loading user guide…</p>
        </div>
      </section>

      <!-- ── Admin: Functional Spec ────────────────────────────── -->
      <section class="panel" id="panel-admin-funcspec">
        <div class="panel-header" style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h1 class="panel-title">Functional Specification</h1>
            <p class="panel-subtitle">Technical documentation for developers and administrators</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="adminDownloadDoc('funcspec')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download HTML
          </button>
        </div>
        <div id="admin-funcspec-content" style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:24px 32px;max-height:70vh;overflow-y:auto;line-height:1.7;font-size:14px">
          <p style="color:var(--muted)">Loading functional specification…</p>
        </div>
      </section>

    </main>
  </div>

  <!-- Mobile sidebar overlay -->
  <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>

  <!-- ── Goal Choice Modal ──────────────────────────────────────── -->
  <div class="modal-overlay" id="goal-choice-modal" role="dialog" aria-modal="true" aria-label="New Goal" onclick="if(event.target===this)closeGoalChoiceModal()">
    <div class="modal-box" style="max-width:600px">

      <!-- Step 1: Choice -->
      <div id="gcm-step-choice">
        <div class="modal-header">
          <h2 class="modal-title">New Goal</h2>
          <button class="modal-close" onclick="closeGoalChoiceModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style="padding:8px 0 16px">
          <p style="font-size:13px;color:var(--muted);margin-bottom:20px">How would you like to create your goal?</p>
          <div class="goal-choice-cards">
            <div class="goal-choice-card" onclick="gcmGoScratch()">
              <div class="goal-choice-card-icon">✏️</div>
              <div class="goal-choice-card-title">Start from Scratch</div>
              <div class="goal-choice-card-desc">Create a custom goal with your own name, description, and required skills.</div>
            </div>
            <div class="goal-choice-card" onclick="gcmGoTemplates()">
              <div class="goal-choice-card-icon">📋</div>
              <div class="goal-choice-card-title">Use a Template</div>
              <div class="goal-choice-card-desc">Start with a pre-built goal with curated required skills — edit anything you like.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Template picker -->
      <div id="gcm-step-templates" style="display:none">
        <div class="modal-header">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="gcmBackToChoice()">← Back</button>
            <h2 class="modal-title" style="margin:0">Choose a Template</h2>
          </div>
          <button class="modal-close" onclick="closeGoalChoiceModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div id="gcm-template-list" style="max-height:60vh;overflow-y:auto;padding:4px 0 8px"></div>
      </div>

    </div>
  </div>

  <!-- ── Goal Modal ──────────────────────────────────────────────── -->
  <div class="modal-overlay" id="goal-modal" role="dialog" aria-modal="true" aria-label="Goal" onclick="if(event.target===this)closeGoalModal()">
    <div class="modal-box">
      <div class="modal-header">
        <h2 class="modal-title" id="goal-modal-title">New Goal</h2>
        <button class="modal-close" onclick="closeGoalModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <input type="hidden" id="gm-id">

      <div class="form-group">
        <label class="form-label" for="gm-name">Goal Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="gm-name" placeholder="e.g. Senior Data Engineer at a fintech company">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="gm-type">Goal Type</label>
          <select class="form-input" id="gm-type">
            <option value="Job Role">Job Role</option>
            <option value="Certification">Certification</option>
            <option value="Personal Learning">Personal Learning</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="gm-priority">Priority</label>
          <select class="form-input" id="gm-priority">
            <option value="Primary">Primary</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="gm-target">Target Date</label>
        <input class="form-input" type="date" id="gm-target">
      </div>

      <div class="form-group">
        <label class="form-label" for="gm-description">Description</label>
        <textarea class="form-input form-textarea" id="gm-description" rows="2" placeholder="What do you want to achieve?"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Required Skills</label>
        <div id="gm-skills-chips" class="skills-chips-wrap">
          <span style="font-size:12px;color:var(--muted2)">No skills added yet</span>
        </div>
        <div class="skill-input-row">
          <input class="form-input" type="text" id="gm-skill-input"
            placeholder="Type a skill and press Enter (or comma-separate multiple)"
            onkeydown="goalsSkillKeydown(event)">
          <button type="button" class="btn btn-ghost btn-sm" onclick="goalsAddSkill()">Add</button>
          <button type="button" class="btn btn-ghost btn-sm btn-ai" onclick="goalsSuggestSkills()" title="AI suggest skills">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            AI Suggest
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="gm-notes">Notes</label>
        <textarea class="form-input form-textarea" id="gm-notes" rows="2" placeholder="Any additional notes…"></textarea>
      </div>

      <div class="form-error" id="gm-error" style="display:none"></div>

      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeGoalModal()">Cancel</button>
        <button class="btn btn-primary" onclick="goalsSaveForm()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Save Goal
        </button>
      </div>
    </div>
  </div>

  <!-- ── Skill Modal ─────────────────────────────────────────────── -->
  <div class="modal-overlay" id="skill-modal" role="dialog" aria-modal="true" aria-label="Skill" onclick="if(event.target===this)closeSkillModal()">
    <div class="modal-box">
      <div class="modal-header">
        <h2 class="modal-title" id="skill-modal-title">Add Skill</h2>
        <button class="modal-close" onclick="closeSkillModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <input type="hidden" id="sm-id">

      <div class="form-group">
        <label class="form-label" for="sm-name">Skill Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="sm-name" placeholder="e.g. Python, Apache Spark, Power BI">
      </div>

      <div class="form-group">
        <label class="form-label" for="sm-group">Skill Group</label>
        <select class="form-input" id="sm-group">
          <option value="Cloud & Data Platforms">Cloud &amp; Data Platforms</option>
          <option value="Data Engineering">Data Engineering</option>
          <option value="Programming">Programming</option>
          <option value="AI/ML">AI/ML</option>
          <option value="Visualization & BI">Visualization &amp; BI</option>
          <option value="DevOps & CI/CD">DevOps &amp; CI/CD</option>
          <option value="Architecture & Design">Architecture &amp; Design</option>
          <option value="Soft Skills">Soft Skills</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Proficiency Level</label>
        <div class="prof-btn-group">
          <button type="button" class="prof-btn" id="sm-prof-beginner"     onclick="skillsSetProf('Beginner')">Beginner</button>
          <button type="button" class="prof-btn" id="sm-prof-intermediate" onclick="skillsSetProf('Intermediate')">Intermediate</button>
          <button type="button" class="prof-btn" id="sm-prof-advanced"     onclick="skillsSetProf('Advanced')">Advanced</button>
          <button type="button" class="prof-btn" id="sm-prof-expert"       onclick="skillsSetProf('Expert')">Expert</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="sm-notes">Notes <span style="font-weight:400;text-transform:none;color:var(--muted2)">(optional)</span></label>
        <textarea class="form-input form-textarea" id="sm-notes" rows="2" placeholder="e.g. 3 years exp, used in production pipelines…"></textarea>
      </div>

      <div class="form-error" id="sm-error"></div>

      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeSkillModal()">Cancel</button>
        <button class="btn btn-primary" onclick="skillsSaveForm()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Save Skill
        </button>
      </div>
    </div>
  </div>

  <!-- ── Resume Upload Modal ──────────────────────────────────────── -->
  <div class="modal-overlay" id="resume-upload-modal" role="dialog" aria-modal="true" aria-label="Upload Resume" onclick="if(event.target===this)closeResumeModal()">
    <div class="modal-box" style="max-width:460px">
      <div class="modal-header">
        <h2 class="modal-title">Upload Resume</h2>
        <button class="modal-close" onclick="closeResumeModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="resume-upload-zone" onclick="document.getElementById('resume-file-input').click()">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p class="resume-upload-label">Click to select a PDF resume</p>
        <p class="resume-upload-sub">AI will extract your skills automatically</p>
        <input type="file" id="resume-file-input" accept=".pdf" style="display:none" onchange="handleResumeFile(this)">
      </div>

      <p id="resume-status" style="font-size:13px;margin-top:10px;min-height:20px"></p>

      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeResumeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-extract-resume" disabled onclick="extractResume()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Extract Skills
        </button>
      </div>
    </div>
  </div>

  <!-- ── Job Report Modal ─────────────────────────────────────────── -->
  <div class="modal-overlay" id="job-report-modal" role="dialog" aria-modal="true" aria-label="Job Report" onclick="if(event.target===this)jobsCloseReport()">
    <div class="modal-box" style="max-width:780px;max-height:88vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3 class="modal-title" id="jr-title">Job Tracker Report</h3>
        <button class="modal-close" onclick="jobsCloseReport()">×</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;padding:12px 20px;border-bottom:1px solid var(--border);flex-shrink:0">
        <select id="jr-filter-status" class="form-control" style="font-size:12px;padding:4px 8px;width:auto" onchange="jobsRenderReport()">
          <option value="all">All Statuses</option>
        </select>
        <select id="jr-sort" class="form-control" style="font-size:12px;padding:4px 8px;width:auto" onchange="jobsRenderReport()">
          <option value="added">Sort: Date Added</option>
          <option value="score">Sort: AI Score</option>
          <option value="status">Sort: Status</option>
          <option value="company">Sort: Company</option>
        </select>
        <button class="btn btn-ghost btn-sm" onclick="jobsPrintReport()" style="margin-left:auto">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print
        </button>
        <button class="btn btn-ghost btn-sm" onclick="jobsCopyReport()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>
      <div id="jr-body" style="overflow-y:auto;flex:1;padding:20px"></div>
    </div>
  </div>

  <!-- ── Job Modal (wide, single-flow) ─────────────────────────────── -->
  <div class="modal-overlay" id="job-modal" role="dialog" aria-modal="true" aria-label="Job" onclick="if(event.target===this)closeJobModal()">
    <div class="modal-box modal-box-wide">
      <div class="modal-header">
        <h2 class="modal-title" id="job-modal-title">Add Job</h2>
        <button class="modal-close" onclick="closeJobModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <input type="hidden" id="jm-id">
      <div class="form-row form-row-4">
        <div class="form-group">
          <label class="form-label" for="jm-jobid">Job ID</label>
          <input class="form-input" type="text" id="jm-jobid" readonly style="background:#f8fafc;color:var(--muted)">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-role">Role <span class="required">*</span></label>
          <input class="form-input" type="text" id="jm-role" placeholder="e.g. Senior Data Engineer">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-company">Company <span class="required">*</span></label>
          <input class="form-input" type="text" id="jm-company" placeholder="e.g. Google">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-status">Status</label>
          <select class="form-input" id="jm-status">
            <option value="Job Added">📌 Job Added</option>
            <option value="Can Be Applied">📋 Can Be Applied</option>
            <option value="Applied">📨 Applied</option>
            <option value="Phone Screen">🎙️ Phone Screen</option>
            <option value="Interview">📅 Interview</option>
            <option value="Offer">🎉 Offer</option>
            <option value="Accepted">✅ Accepted</option>
            <option value="Rejected">❌ Rejected</option>
            <option value="Withdrawn">🚪 Withdrawn</option>
            <option value="No Response">🔇 No Response</option>
            <option value="Not Interested">👎 Not Interested</option>
            <option value="Duplicate">🔁 Duplicate</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-4">
        <div class="form-group">
          <label class="form-label" for="jm-source">Source</label>
          <select class="form-input" id="jm-source">
            <option value="">— Select —</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Indeed">Indeed</option>
            <option value="Dice">Dice</option>
            <option value="Glassdoor">Glassdoor</option>
            <option value="Company Website">Company Website</option>
            <option value="Referral">Referral</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-salary">Salary Range</label>
          <input class="form-input" type="text" id="jm-salary" placeholder="e.g. $120k–$150k">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-applied">Applied Date</label>
          <input class="form-input" type="date" id="jm-applied">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-posted">Job Post Date</label>
          <input class="form-input" type="date" id="jm-posted">
        </div>
      </div>
      <div class="form-row form-row-4">
        <div class="form-group">
          <label class="form-label" for="jm-city">City</label>
          <input class="form-input" type="text" id="jm-city" placeholder="e.g. Austin">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-state">State</label>
          <input class="form-input" type="text" id="jm-state" placeholder="e.g. TX">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-country">Country</label>
          <input class="form-input" type="text" id="jm-country" placeholder="e.g. USA" value="USA">
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-goal">Linked Goal</label>
          <select class="form-input" id="jm-goal"><option value="">— None —</option></select>
        </div>
      </div>
      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label" for="jm-emptype">Employment Type</label>
          <select class="form-input" id="jm-emptype">
            <option value="">— Select —</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Contract-to-Hire">Contract-to-Hire</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-employertype">Employer Type</label>
          <select class="form-input" id="jm-employertype">
            <option value="">— Select —</option>
            <option value="Direct Hire">Direct Hire</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Staffing Agency">Staffing Agency</option>
            <option value="Consulting Firm">Consulting Firm</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="jm-workmode">Work Mode</label>
          <select class="form-input" id="jm-workmode">
            <option value="">— Select —</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="jm-url">Job URL</label>
        <input class="form-input" type="url" id="jm-url" placeholder="https://...">
      </div>
      <div class="form-group">
        <label class="form-label" for="jm-notes">Notes</label>
        <textarea class="form-input form-textarea" id="jm-notes" rows="2" placeholder="Recruiter name, interview notes…"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="jm-jobtext">Job Description</label>
        <textarea class="form-input form-textarea" id="jm-jobtext" rows="6" placeholder="Paste the original job description…"></textarea>
      </div>
      <div class="form-error" id="jm-error"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeJobModal()">Cancel</button>
        <button class="btn btn-primary" onclick="jobsSaveForm()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Save Job
        </button>
      </div>
    </div>
  </div>

  <!-- ── Required Skill Edit Modal ────────────────────────────────── -->
  <div class="modal-overlay" id="rs-edit-modal" role="dialog" aria-modal="true" aria-label="Edit Required Skill" onclick="if(event.target===this)rsCloseEditModal()">
    <div class="modal-box" style="max-width:420px">
      <div class="modal-header">
        <h2 class="modal-title">Edit Required Skill</h2>
        <button class="modal-close" onclick="rsCloseEditModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form-group">
        <label class="form-label" for="rse-name">Skill Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="rse-name" placeholder="Skill name" onkeydown="rsEditKeydown(event)">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="rse-level">Required Level</label>
          <select class="form-input" id="rse-level">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="rse-cat">Category</label>
          <select class="form-input" id="rse-cat"></select>
        </div>
      </div>
      <div class="form-error" id="rse-error"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="rsCloseEditModal()">Cancel</button>
        <button class="btn btn-primary" onclick="rsSaveEdit()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Save
        </button>
      </div>
    </div>
  </div>

  <!-- ── Study Hours Modal ─────────────────────────────────────────── -->
  <div class="modal-overlay" id="study-hours-modal" role="dialog" aria-modal="true" aria-label="Study Hours" onclick="if(event.target===this)closeStudyHoursModal()">
    <div class="modal-box" style="max-width:420px">
      <div class="modal-header">
        <h2 class="modal-title">Study Hours</h2>
        <button class="modal-close" onclick="closeStudyHoursModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:18px">Set how many hours you can study per day. Auto-schedule uses these to plan your sessions.</p>
      <div class="study-hours-grid">
        <div class="sh-row"><label class="sh-label">Monday</label><input class="form-input sh-input" type="number" id="sh-mon" min="0" max="12" value="0"></div>
        <div class="sh-row"><label class="sh-label">Tuesday</label><input class="form-input sh-input" type="number" id="sh-tue" min="0" max="12" value="0"></div>
        <div class="sh-row"><label class="sh-label">Wednesday</label><input class="form-input sh-input" type="number" id="sh-wed" min="0" max="12" value="0"></div>
        <div class="sh-row"><label class="sh-label">Thursday</label><input class="form-input sh-input" type="number" id="sh-thu" min="0" max="12" value="0"></div>
        <div class="sh-row"><label class="sh-label">Friday</label><input class="form-input sh-input" type="number" id="sh-fri" min="0" max="12" value="0"></div>
        <div class="sh-row"><label class="sh-label">Saturday</label><input class="form-input sh-input" type="number" id="sh-sat" min="0" max="12" value="0"></div>
        <div class="sh-row"><label class="sh-label">Sunday</label><input class="form-input sh-input" type="number" id="sh-sun" min="0" max="12" value="0"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeStudyHoursModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveStudyHours()">Save Hours</button>
      </div>
    </div>
  </div>

  <!-- ── Session Modal ──────────────────────────────────────────────── -->
  <div class="modal-overlay" id="session-modal" role="dialog" aria-modal="true" aria-label="Study Session" onclick="if(event.target===this)closeSessionModal()">
    <div class="modal-box" style="max-width:480px">
      <div class="modal-header">
        <h2 class="modal-title" id="session-modal-title">Add Study Session</h2>
        <button class="modal-close" onclick="closeSessionModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <input type="hidden" id="sess-id">

      <div class="form-group">
        <label class="form-label">Topic <span style="color:var(--red)">*</span></label>
        <input class="form-input" type="text" id="sess-topic" placeholder="e.g. Snowflake Query Optimisation">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Date <span style="color:var(--red)">*</span></label>
          <input class="form-input" type="date" id="sess-date">
        </div>
        <div class="form-group">
          <label class="form-label">Duration (hours) <span style="color:var(--red)">*</span></label>
          <input class="form-input" type="number" id="sess-duration" min="0.5" max="12" step="0.5" placeholder="e.g. 2">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Start Time</label>
          <input class="form-input" type="time" id="sess-start">
        </div>
        <div class="form-group">
          <label class="form-label">End Time</label>
          <input class="form-input" type="time" id="sess-end">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Goal (optional)</label>
        <select class="form-input" id="sess-goal">
          <option value="">— Not linked to a goal —</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input" id="sess-status">
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="sess-notes" rows="2" placeholder="Resources, links, reminders…" style="resize:vertical"></textarea>
      </div>

      <div id="sess-error" style="font-size:12px;color:var(--red);min-height:18px"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeSessionModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveSessionForm()">Save Session</button>
      </div>
    </div>
  </div>

  <script src="js/storage.js?v=<?php echo $v; ?>"></script>
  <script src="data/seed.js?v=<?php echo $v; ?>"></script>
  <script src="js/common-goals.js?v=<?php echo $v; ?>"></script>
  <script src="js/app.js?v=<?php echo $v; ?>"></script>
  <script src="js/goals.js?v=<?php echo $v; ?>"></script>
  <script src="js/skills.js?v=<?php echo $v; ?>"></script>
  <script src="js/reqskills.js?v=<?php echo $v; ?>"></script>
  <script src="js/gap.js?v=<?php echo $v; ?>"></script>
  <script src="js/learning.js?v=<?php echo $v; ?>"></script>
  <script src="js/progress.js?v=<?php echo $v; ?>"></script>
  <script src="js/timetable.js?v=<?php echo $v; ?>"></script>
  <script src="js/jobs.js?v=<?php echo $v; ?>"></script>
  <script src="js/jobposting.js?v=<?php echo $v; ?>"></script>
  <script src="js/admin.js?v=<?php echo $v; ?>"></script>

  <!-- ── Admin: Template Metadata Modal ─────────────────────── -->
  <div class="modal-overlay" id="tpl-modal" role="dialog" aria-modal="true" aria-label="Goal Template" onclick="if(event.target===this)closeTplModal()">
    <div class="modal-box" style="max-width:480px">
      <div class="modal-header">
        <h2 class="modal-title" id="tpl-modal-title">New Template</h2>
        <button class="modal-close" onclick="closeTplModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <input type="hidden" id="tpl-id">
      <div class="form-group">
        <label class="form-label" for="tpl-name">Template Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="tpl-name" placeholder="e.g. Data Engineer">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="tpl-type">Goal Type</label>
          <select class="form-input" id="tpl-type">
            <option value="Job Role">Job Role</option>
            <option value="Certification">Certification</option>
            <option value="Personal Learning">Personal Learning</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="tpl-icon">Icon (emoji)</label>
          <input class="form-input" type="text" id="tpl-icon" placeholder="e.g. 🚀" style="width:90px">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="tpl-description">Description</label>
        <textarea class="form-input form-textarea" id="tpl-description" rows="2" placeholder="Brief description of this role/goal…"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label" for="tpl-tags">Tags <span style="color:var(--muted);font-weight:400">(comma-separated)</span></label>
        <input class="form-input" type="text" id="tpl-tags" placeholder="e.g. Cloud, Data, Python">
      </div>
      <div id="tpl-skills-section" style="display:none">
        <div class="form-group">
          <label class="form-label">Required Skills <span style="color:var(--muted);font-weight:400">(optional — AI can suggest)</span></label>
          <div id="tpl-modal-chips" class="skills-chips-wrap">
            <span style="font-size:12px;color:var(--muted2)">No skills added yet — use AI Suggest or type below</span>
          </div>
          <div class="skill-input-row">
            <input class="form-input" type="text" id="tpl-skill-input"
              placeholder="Type a skill and press Enter"
              onkeydown="tplModalSkillKeydown(event)">
            <button type="button" class="btn btn-ghost btn-sm" onclick="tplModalAddSkill()">Add</button>
            <button type="button" class="btn btn-ghost btn-sm btn-ai" id="tpl-ai-btn" onclick="tplSuggestSkills()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              AI Suggest
            </button>
          </div>
        </div>
      </div>
      <div class="form-error" id="tpl-error"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeTplModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveTplModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Save
        </button>
      </div>
    </div>
  </div>

  <!-- ── Admin: Template Skill Edit Modal ────────────────────── -->
  <div class="modal-overlay" id="atpl-skill-edit-modal" role="dialog" aria-modal="true" aria-label="Edit Template Skill" onclick="if(event.target===this)closeAtplSkillEditModal()">
    <div class="modal-box" style="max-width:400px">
      <div class="modal-header">
        <h2 class="modal-title">Edit Skill</h2>
        <button class="modal-close" onclick="closeAtplSkillEditModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form-group">
        <label class="form-label">Skill Name <span class="required">*</span></label>
        <input class="form-input" type="text" id="atse-name" onkeydown="if(event.key==='Enter')adminSaveTplSkillEdit()">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <input list="atse-cat-list" class="form-input" id="atse-cat">
          <datalist id="atse-cat-list"></datalist>
        </div>
        <div class="form-group">
          <label class="form-label">Level</label>
          <select class="form-input" id="atse-level">
            <option>Beginner</option><option>Intermediate</option>
            <option>Advanced</option><option>Expert</option>
          </select>
        </div>
      </div>
      <div class="form-error" id="atse-error"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeAtplSkillEditModal()">Cancel</button>
        <button class="btn btn-primary" onclick="adminSaveTplSkillEdit()">Save</button>
      </div>
    </div>
  </div>

  <!-- ── Job Posting: Cover Letter Modal ─────────────────────────── -->
  <div class="modal-overlay" id="jp-cl-modal" role="dialog" aria-modal="true" aria-label="Cover Letter" onclick="if(event.target===this)jpCloseCoverLetter()">
    <div class="modal-box" style="max-width:640px">
      <div class="modal-header">
        <h2 class="modal-title">Cover Letter</h2>
        <button class="modal-close" onclick="jpCloseCoverLetter()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <textarea class="form-input jp-cl-textarea" id="jp-cl-body" rows="18" readonly></textarea>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="jpCloseCoverLetter()">Close</button>
        <button class="btn btn-ghost" id="jp-cl-btn-copy" onclick="jpCopyCoverLetter()">Copy</button>
        <button class="btn btn-primary" id="jp-cl-btn-gen" onclick="jpGenerateCoverLetter()">Regenerate</button>
      </div>
    </div>
  </div>

  <!-- ── Admin: User Profile Modal (name + role + password) ────── -->
  <div class="modal-overlay" id="admin-user-profile-modal" role="dialog" aria-modal="true" aria-label="User Profile" onclick="if(event.target===this)adminCloseUserProfile()">
    <div class="modal-box" style="max-width:440px">
      <div class="modal-header">
        <h2 class="modal-title">User Profile</h2>
        <button class="modal-close" onclick="adminCloseUserProfile()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <input type="hidden" id="aup-uid">

      <!-- Read-only email -->
      <div class="form-group">
        <label class="form-label">User ID (Email)</label>
        <input class="form-input" type="text" id="aup-email" disabled style="opacity:0.6;cursor:not-allowed;font-family:var(--mono);font-size:13px">
      </div>

      <!-- Editable name -->
      <div class="form-group">
        <label class="form-label">Display Name</label>
        <input class="form-input" type="text" id="aup-name" placeholder="Full name">
      </div>

      <!-- Editable role -->
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-input admin-role-select" id="aup-role" onchange="_adminUpdateRoleSelect(this)">
          <option value="webuser">Web User</option>
          <option value="webreader">Web Reader (read-only)</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="form-error" id="aup-info-error"></div>
      <div class="form-error" id="aup-info-success" style="color:#16a34a"></div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
        <button class="btn btn-primary btn-sm" onclick="adminSaveUserInfo()">Save Name &amp; Role</button>
      </div>

      <!-- Set password section -->
      <div style="border-top:1px solid var(--border);padding-top:18px;margin-top:4px">
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">Set Password</div>
        <div class="form-group">
          <label class="form-label">New password</label>
          <div class="input-with-icon">
            <input class="form-input" type="password" id="aup-pwd-new" placeholder="Min. 8 characters" minlength="8">
            <button type="button" class="input-icon-btn" onclick="togglePassword('aup-pwd-new', this)" title="Show password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirm new password</label>
          <div class="input-with-icon">
            <input class="form-input" type="password" id="aup-pwd-confirm" placeholder="Repeat new password" minlength="8"
              onkeydown="if(event.key==='Enter')adminSaveUserPwd()">
            <button type="button" class="input-icon-btn" onclick="togglePassword('aup-pwd-confirm', this)" title="Show password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="form-error" id="aup-pwd-error"></div>
        <div class="form-error" id="aup-pwd-success" style="color:#16a34a"></div>
        <div style="display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" onclick="adminSaveUserPwd()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Set Password
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Change Password Modal ──────────────────────────────────── -->
  <!-- ── User Profile Modal ────────────────────────────────────── -->
  <div class="modal-overlay" id="user-profile-modal" role="dialog" aria-modal="true" aria-label="User Profile" onclick="if(event.target===this)closeUserProfileModal()">
    <div class="modal-box" style="max-width:440px">
      <div class="modal-header">
        <h2 class="modal-title">My Profile</h2>
        <button class="modal-close" onclick="closeUserProfileModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Read-only fields -->
      <div class="form-group">
        <label class="form-label">User ID (Email)</label>
        <input class="form-input" type="text" id="up-email" disabled style="opacity:0.6;cursor:not-allowed;font-family:var(--mono);font-size:13px">
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <input class="form-input" type="text" id="up-role" disabled style="opacity:0.6;cursor:not-allowed;text-transform:capitalize">
      </div>

      <!-- Editable name -->
      <div class="form-group">
        <label class="form-label" for="up-name">Display Name</label>
        <input class="form-input" type="text" id="up-name" placeholder="Your name">
      </div>
      <div class="form-error" id="up-name-error"></div>
      <div class="form-error" id="up-name-success" style="color:#16a34a"></div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
        <button class="btn btn-primary btn-sm" onclick="handleSaveProfileName()">Save Name</button>
      </div>

      <!-- Change password section -->
      <div style="border-top:1px solid var(--border);padding-top:18px;margin-top:4px">
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">Change Password</div>
        <div class="form-group">
          <label class="form-label" for="cp-current">Current password</label>
          <div class="input-with-icon">
            <input class="form-input" type="password" id="cp-current" placeholder="Enter current password" autocomplete="current-password">
            <button type="button" class="input-icon-btn" onclick="togglePassword('cp-current', this)" title="Show password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="cp-new">New password</label>
          <div class="input-with-icon">
            <input class="form-input" type="password" id="cp-new" placeholder="Min. 8 characters" minlength="8" autocomplete="new-password">
            <button type="button" class="input-icon-btn" onclick="togglePassword('cp-new', this)" title="Show password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="cp-confirm">Confirm new password</label>
          <div class="input-with-icon">
            <input class="form-input" type="password" id="cp-confirm" placeholder="Repeat new password" minlength="8" autocomplete="new-password"
              onkeydown="if(event.key==='Enter')handleChangePassword()">
            <button type="button" class="input-icon-btn" onclick="togglePassword('cp-confirm', this)" title="Show password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <div class="form-error" id="cp-error"></div>
        <div class="form-error" id="cp-success" style="color:#16a34a"></div>
        <div style="display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="cp-save-btn" onclick="handleChangePassword()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Update Password
          </button>
        </div>
      </div>
    </div>
  </div>


</body>
</html>
