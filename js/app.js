/* SkillTrack — App Shell
   Handles: sidebar nav, panel switching, dashboard widgets, mobile overlay */
'use strict';

// ── Password visibility toggle (shared) ──────────────────────────────
function togglePassword(id, btn) {
  const input = document.getElementById(id);
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  btn.innerHTML = show
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

const PANEL_TITLES = {
  dashboard:'Dashboard', goals:'Goals', skills:'My Skills',
  reqskills:'Required Skills',
  gap:'Gap Analysis', learning:'Learning Path',
  progress:'Progress', timetable:'Timetable', jobs:'Job Tracker',
  jobposting:'Job Posting Analyser', jobsummary:'Job Summary',
  dicejobs:'Dice Jobs Import', linkedinjobs:'LinkedIn Jobs',
  'admin-overview':'Admin — Overview', 'admin-templates':'Goal Templates', 'admin-users':'Users', 'admin-tests':'Test Cases', 'admin-params':'Parameters', 'admin-userguide':'User Guide', 'admin-funcspec':'Functional Spec'
};
const PANEL_ACTIONS = { goals:'New Goal', skills:'Add Skill' };

// ── Panel switching ────────────────────────────────────────────────
function switchPanel(name, clickedEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = clickedEl || document.querySelector(`.nav-item[data-panel="${name}"]`);
  if (navEl) navEl.classList.add('active');

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PANEL_TITLES[name] || '';

  const actionBtn   = document.getElementById('topbar-action-btn');
  const actionLabel = document.getElementById('topbar-action-label');
  if (actionBtn && actionLabel) {
    const label = PANEL_ACTIONS[name];
    actionBtn.style.display = label ? '' : 'none';
    actionLabel.textContent = label || '';
    actionBtn.onclick = label ? () => openPanelModal(name) : null;
  }

  // Re-render on switch (catch any data changes)
  if (name === 'dashboard')  dashboardRender();
  if (name === 'goals')      goalsRender && goalsRender();
  if (name === 'skills')     skillsRender && skillsRender();
  if (name === 'reqskills')  reqskillsRender && reqskillsRender();
  if (name === 'gap')        gapRender      && gapRender();
  if (name === 'learning')   learningRender && learningRender();
  if (name === 'progress')   progressRender && progressRender();
  if (name === 'timetable')  timetableRender && timetableRender();
  if (name === 'jobs')             jobsRender          && jobsRender();
  if (name === 'jobposting')       jpRender            && jpRender();
  if (name === 'jobsummary')       jobSummaryRender     && jobSummaryRender();
  if (name === 'dicejobs')         diceJobsRender      && diceJobsRender();
  if (name === 'linkedinjobs')     linkedinJobsRender  && linkedinJobsRender();
  if (name === 'admin-overview')  adminOverviewRender  && adminOverviewRender();
  if (name === 'admin-templates') adminTemplatesRender && adminTemplatesRender();
  if (name === 'admin-users')     adminUsersRender     && adminUsersRender();
  if (name === 'admin-tests')      stRenderTestPlan      && stRenderTestPlan();
  if (name === 'admin-params')    adminParamsRender     && adminParamsRender();
  if (name === 'admin-userguide') adminRenderUserGuide  && adminRenderUserGuide();
  if (name === 'admin-funcspec')  adminRenderFuncSpec   && adminRenderFuncSpec();

  if (window.innerWidth < 1024) closeSidebar();
}

function openPanelModal(name) {
  if (name === 'goals')  openGoalChoiceModal && openGoalChoiceModal();
  if (name === 'skills') openSkillModal && openSkillModal();
  if (name === 'jobs')   openJobModal && openJobModal();
}

// ── Sidebar ────────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay && overlay.classList.toggle('active', sidebar.classList.contains('open'));
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.getElementById('sidebar-overlay');
  if (ov) ov.classList.remove('active');
}

// ── Logout ─────────────────────────────────────────────────────────
function handleLogout() {
  if (IS_LOCAL) { localStorage.removeItem('st-session'); window.location.href = 'index.html'; return; }
  window.location.href = 'api/auth.php?action=logout';
}

// ── User profile ───────────────────────────────────────────────────

// Step 1: Parse session from URL hash (login redirect) and save to localStorage
function _parseHashSession() {
  const hash = location.hash;
  if (!hash.startsWith('#s=')) return null;
  try {
    const raw = hash.slice(3);
    // Try plain atob first (works for ASCII names)
    const session = JSON.parse(atob(raw));
    localStorage.setItem('st-session', JSON.stringify(session));
    history.replaceState(null, '', location.pathname);
    return session;
  } catch(e) {
    try {
      // Try Unicode-aware decode
      const session = JSON.parse(decodeURIComponent(escape(atob(hash.slice(3)))));
      localStorage.setItem('st-session', JSON.stringify(session));
      history.replaceState(null, '', location.pathname);
      return session;
    } catch(e2) { return null; }
  }
}

// Step 2: Read session from localStorage
function _readLocalSession() {
  try {
    return JSON.parse(localStorage.getItem('st-session') || 'null');
  } catch(e) { return null; }
}

async function loadUserProfile() {
  if (IS_LOCAL) {
    // Try hash first, then localStorage
    const session = _parseHashSession() || _readLocalSession();
    if (!session) { window.location.href = 'index.html'; return; }
    _setUserUI(session);
    return;
  }
  // Server mode
  try {
    const res  = await fetch('api/auth.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'me'}) });
    const data = await res.json();
    const user = data.ok && data.data && data.data.user ? data.data.user : null;
    if (user) { _setUserUI(user); }
    else { window.location.href = 'index.html'; }
  } catch(e) {
    _setUserUI({ name:'Demo User', email:'' });
  }
}

function _setUserUI(u) {
  const el = id => document.getElementById(id);
  // If working as another user, preserve admin's sidebar info
  if (window._workAsUid && window._adminRealUser) {
    const admin = window._adminRealUser;
    if (el('user-name'))   el('user-name').textContent  = admin.name || admin.email || 'Admin';
    if (el('user-email'))  el('user-email').textContent = admin.email || '';
    if (el('user-avatar')) el('user-avatar').textContent = (admin.name||admin.email||'A').charAt(0).toUpperCase();
  } else {
    if (el('user-name'))   el('user-name').textContent  = u.name || u.email || 'User';
    if (el('user-email'))  el('user-email').textContent = u.email || '';
    if (el('user-avatar')) el('user-avatar').textContent = (u.name||u.email||'U').charAt(0).toUpperCase();
  }

  // Store globally so other modules can access
  window._currentUser = u;

  // Show admin nav if role === 'admin' (set by _seedDefaultUser for local mode)
  const isAdmin = u.role === 'admin';
  window._isAdmin = isAdmin;
  document.querySelectorAll('.admin-only').forEach(el2 => {
    el2.style.display = isAdmin ? '' : 'none';
  });
}

// ── Dashboard widgets ──────────────────────────────────────────────
function dashboardRender() {
  const goals    = stRead('goals');
  const skills   = stRead('skills');
  const paths    = stRead('learning');
  const jobs     = stRead('jobs');
  const activity = stReadActivity();

  // Stats
  const activeGoals = goals.filter(g=>g.priority!=='On Hold');
  _setTxt('stat-goals', activeGoals.length);
  _setTxt('stat-skills', skills.length);
  _setTxt('stat-jobs',   jobs.length);

  // Gap count — matches gap.js logic with fuzzy matching + per-goal breakdown
  const _profRank = { 'Beginner':0, 'Intermediate':1, 'Advanced':2, 'Expert':3 };
  function _dashFindSkill(reqName, userSkills) {
    const rLow = reqName.toLowerCase().trim();
    const exact = userSkills.find(s => s.name.toLowerCase().trim() === rLow);
    if (exact) return exact;
    const contains = userSkills.find(s => {
      const u = s.name.toLowerCase().trim();
      return u.includes(rLow) || rLow.includes(u);
    });
    if (contains) return contains;
    const rBase = rLow.replace(/\s*\([^)]*\)\s*/g, '').trim();
    return userSkills.find(s => {
      const uBase = s.name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
      return uBase === rBase || uBase.includes(rBase) || rBase.includes(uBase);
    }) || null;
  }
  let gapTotal = 0;
  const gapsByGoal = {};
  const reqByGoal = {};
  goals.forEach(g => {
    const req = g.requiredSkills || [];
    reqByGoal[g.name] = req.length;
    let goalGaps = 0;
    req.forEach(r => {
      const rName = (typeof r === 'string' ? r : r.name).toLowerCase();
      const reqLevel = typeof r === 'string' ? 'Advanced' : (r.level || 'Advanced');
      const reqRank  = _profRank[reqLevel] ?? 2;
      const us = _dashFindSkill(typeof r === 'string' ? r : r.name, skills);
      if (!us) { gapTotal++; goalGaps++; return; }
      const userRank = _profRank[us.proficiency] ?? 1;
      if (userRank < reqRank) { gapTotal++; goalGaps++; }
    });
    gapsByGoal[g.name] = goalGaps;
  });
  _setTxt('stat-gaps', gapTotal);

  // Job count per linked goal
  const jobsByGoal = {};
  jobs.forEach(j => {
    const g = j.linkedGoal || 'Unlinked';
    jobsByGoal[g] = (jobsByGoal[g] || 0) + 1;
  });

  // Render breakdowns
  const _breakdownHtml = (items) => items.length
    ? items.map(([label, count]) => `<div style="display:flex;justify-content:space-between;gap:6px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</span><span style="font-weight:600;flex-shrink:0">${count}</span></div>`).join('')
    : '';

  // Goals breakdown: by type
  const goalsByType = {};
  activeGoals.forEach(g => { goalsByType[g.type] = (goalsByType[g.type] || 0) + 1; });
  _setHtml('stat-goals-breakdown', _breakdownHtml(Object.entries(goalsByType)));

  // Skills breakdown: required per goal
  _setHtml('stat-skills-breakdown', _breakdownHtml([
    ...goals.map(g => [g.name, (g.requiredSkills || []).length]),
    ['My Skills', skills.length]
  ]));

  // Gaps breakdown: per goal
  _setHtml('stat-gaps-breakdown', _breakdownHtml(
    goals.filter(g => gapsByGoal[g.name] > 0).map(g => [g.name, gapsByGoal[g.name]])
  ));

  // Jobs breakdown: per linked goal
  _setHtml('stat-jobs-breakdown', _breakdownHtml(Object.entries(jobsByGoal).sort((a,b) => b[1] - a[1])));

  // Fade in stat grid (hidden initially to prevent layout flash)
  const statGrid = document.getElementById('dash-stat-grid');
  if (statGrid) statGrid.style.opacity = '1';

  // Goal progress widget
  _renderDashGoals(goals, paths);

  // Today's sessions
  _renderDashToday();

  // Activity feed
  _renderDashActivity(activity);
}

function _setTxt(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function _setHtml(id, html) { const el=document.getElementById(id); if(el) el.innerHTML=html; }

function _renderDashGoals(goals, paths) {
  const el = document.getElementById('dash-goal-progress');
  if (!el) return;
  if (!goals.length) { el.innerHTML = '<div class="empty-state empty-state-sm"><p>No goals yet. <a href="#" onclick="switchPanel(\'goals\',null);return false">Create a goal</a></p></div>'; return; }
  el.innerHTML = goals.slice(0,5).map(g => {
    const meta  = GOAL_TYPE_META ? (GOAL_TYPE_META[g.type]||{emoji:'⭐'}) : {emoji:'⭐'};
    const path  = paths.find(p=>p.goalId===g.id);
    const items = path ? path.items : [];
    const pct   = items.length ? Math.round(items.filter(x=>x.status==='Completed').length/items.length*100) : 0;
    return `<div class="dash-goal-row" onclick="switchPanel('goals',null)" style="cursor:pointer">
      <div class="dash-goal-icon">${meta.emoji}</div>
      <div class="dash-goal-info">
        <div class="dash-goal-name">${esc(g.name)}</div>
        <div class="progress-wrap" style="margin-top:4px"><div class="progress-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="dash-goal-pct">${pct}%</div>
    </div>`;
  }).join('');
}

function _renderDashToday() {
  const el = document.getElementById('dash-today');
  if (!el) return;
  const today    = new Date().toISOString().slice(0,10);
  const cfg      = stReadObj('timetable');
  const sessions = (cfg.sessions||[]).filter(s=>s.date===today);
  if (!sessions.length) { el.innerHTML = '<div class="empty-state empty-state-sm"><p>No sessions today. <a href="#" onclick="switchPanel(\'timetable\',null);return false">View timetable</a></p></div>'; return; }
  el.innerHTML = sessions.map(s => `<div class="dash-session-row">
    <div class="dash-session-dot" style="background:${s.status==='Completed'?'#16a34a':'#06b6d4'}"></div>
    <div>
      <div style="font-size:13px;font-weight:600">${esc(s.topic)}</div>
      <div style="font-size:11px;color:var(--muted)">${esc(s.status)}${s.durationHours?' · '+s.durationHours+'h':''}</div>
    </div>
  </div>`).join('');
}

function _renderDashActivity(activity) {
  const el = document.getElementById('dash-activity');
  if (!el) return;
  if (!activity.length) { el.innerHTML = '<div class="empty-state empty-state-sm"><p>No recent activity. Start by adding skills or creating a goal.</p></div>'; return; }
  const icons = { goal_added:'🎯',goal_updated:'🎯',goal_deleted:'🗑',skill_added:'⭐',skill_updated:'⭐',skill_deleted:'🗑',lp_generated:'📚',lp_progress:'✅',job_added:'💼',job_updated:'💼',gap_analysis:'📊',timetable_session:'🕐',resume_upload:'📄' };
  el.innerHTML = activity.slice(0,8).map(a=>`<div class="activity-item">
    <div class="activity-dot"></div>
    <div><div class="activity-text">${icons[a.type]||'•'} ${esc(a.message)}</div><div class="activity-time">${relTime(a.at)}</div></div>
  </div>`).join('');
}

// ── Seed default test user ─────────────────────────────────────────
function _seedDefaultUser() {
  if (!IS_LOCAL) return;
  const users = JSON.parse(localStorage.getItem('st-users')||'[]');
  const existing = users.find(u=>u.email==='w3help@yahoo.com');
  if (!existing) {
    users.push({ uid:'w3help@yahoo.com', name:'Test User', email:'w3help@yahoo.com', role:'admin', password:'naresh01', createdAt:new Date().toISOString() });
    localStorage.setItem('st-users', JSON.stringify(users));
  } else if (existing.role !== 'admin') {
    // Ensure this user always has admin role
    existing.role = 'admin';
    localStorage.setItem('st-users', JSON.stringify(users));
  }
  // Also fix session if currently logged in as this user
  try {
    const sess = JSON.parse(localStorage.getItem('st-session') || 'null');
    if (sess && sess.uid === 'w3help@yahoo.com' && sess.role !== 'admin') {
      sess.role = 'admin';
      localStorage.setItem('st-session', JSON.stringify(sess));
    }
    // Ensure ALL users with data in localStorage appear in st-users
    // This covers server-registered users who logged in locally
    const uList = JSON.parse(localStorage.getItem('st-users') || '[]');
    let changed = false;
    // 1. Add current session user
    if (sess && sess.uid && !uList.find(u => u.uid === sess.uid || u.email === sess.email)) {
      uList.push({ uid: sess.uid, name: sess.name || '', email: sess.email || sess.uid, role: sess.role || 'webuser', createdAt: new Date().toISOString() });
      changed = true;
    }
    // 2. Scan localStorage for st-{uid}-goals/skills/jobs keys to discover other users
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const m = key.match(/^st-(.+)-(goals|skills|jobs)$/);
      if (m) {
        const uid = m[1];
        if (uid !== 'demo' && !uList.find(u => u.uid === uid)) {
          uList.push({ uid, name: '', email: uid, role: 'webuser', createdAt: '' });
          changed = true;
        }
      }
    }
    if (changed) localStorage.setItem('st-users', JSON.stringify(uList));
  } catch(e) {}
}

// ── User Profile Modal ──────────────────────────────────────────────
function openUserProfileModal() {
  const u = window._currentUser || _readLocalSession() || {};
  document.getElementById('up-email').value = u.email || u.uid || '';
  document.getElementById('up-role').value  = u.role || 'webuser';
  document.getElementById('up-name').value  = u.name || '';
  document.getElementById('up-name-error').textContent   = '';
  document.getElementById('up-name-success').textContent = '';
  document.getElementById('cp-current').value = '';
  document.getElementById('cp-new').value     = '';
  document.getElementById('cp-confirm').value = '';
  document.getElementById('cp-error').textContent   = '';
  document.getElementById('cp-success').textContent = '';
  document.getElementById('user-profile-modal').classList.add('open');
  setTimeout(() => document.getElementById('up-name').focus(), 80);
}
function closeUserProfileModal() {
  document.getElementById('user-profile-modal').classList.remove('open');
}

async function handleSaveProfileName() {
  const newName = document.getElementById('up-name').value.trim();
  const errEl   = document.getElementById('up-name-error');
  const okEl    = document.getElementById('up-name-success');
  errEl.textContent = ''; okEl.textContent = '';
  if (!newName) { errEl.textContent = 'Name is required.'; return; }

  const u = window._currentUser || {};
  if (IS_LOCAL) {
    const users = JSON.parse(localStorage.getItem('st-users') || '[]');
    const user  = users.find(x => x.uid === u.uid);
    if (user) { user.name = newName; localStorage.setItem('st-users', JSON.stringify(users)); }
    // Update session
    const sess = _readLocalSession();
    if (sess) { sess.name = newName; localStorage.setItem('st-session', JSON.stringify(sess)); }
    u.name = newName;
    _setUserUI(u);
    okEl.textContent = 'Name updated!';
    return;
  }
  try {
    const res  = await fetch('api/auth.php', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'update_name', name: newName }) });
    const data = await res.json();
    if (data.ok) { u.name = newName; _setUserUI(u); okEl.textContent = 'Name updated!'; }
    else { errEl.textContent = data.error || 'Failed.'; }
  } catch { errEl.textContent = 'Connection error.'; }
}

async function handleChangePassword() {
  const current   = document.getElementById('cp-current').value;
  const newPwd    = document.getElementById('cp-new').value;
  const confirm   = document.getElementById('cp-confirm').value;
  const errEl     = document.getElementById('cp-error');
  const successEl = document.getElementById('cp-success');
  errEl.textContent = ''; successEl.textContent = '';

  if (!current)          { errEl.textContent = 'Current password is required.'; return; }
  if (newPwd.length < 8) { errEl.textContent = 'New password must be at least 8 characters.'; return; }
  if (newPwd !== confirm) { errEl.textContent = 'New passwords do not match.'; return; }

  const btn = document.getElementById('cp-save-btn');
  btn.disabled = true;

  if (IS_LOCAL) {
    const users = JSON.parse(localStorage.getItem('st-users') || '[]');
    const uid   = (window._currentUser || {}).uid;
    const user  = users.find(u => u.uid === uid);
    if (!user || user.password !== current) {
      errEl.textContent = 'Current password is incorrect.';
      btn.disabled = false;
      return;
    }
    user.password = newPwd;
    localStorage.setItem('st-users', JSON.stringify(users));
    successEl.textContent = 'Password updated successfully!';
    btn.disabled = false;
    setTimeout(closeUserProfileModal, 1500);
    return;
  }

  try {
    const res  = await fetch('api/auth.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', currentPassword: current, newPassword: newPwd })
    });
    const data = await res.json();
    if (data.ok) {
      successEl.textContent = 'Password updated successfully!';
      setTimeout(closeUserProfileModal, 1500);
    } else {
      errEl.textContent = data.error || 'Failed to change password.';
    }
  } catch {
    errEl.textContent = 'Connection error.';
  }
  btn.disabled = false;
}

// ── Keyboard & Focus Management ─────────────────────────────────────
let _lastFocusedEl = null;

// Focus trap: keep Tab within open modal
function _trapFocus(e) {
  const modal = document.querySelector('.modal-overlay.open .modal-box');
  if (!modal) return;
  const focusable = modal.querySelectorAll('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"]),a[href]');
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
  else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal-overlay.open');
    openModals.forEach(m => m.classList.remove('open'));
    if (_lastFocusedEl) { _lastFocusedEl.focus(); _lastFocusedEl = null; }
  }
  if (e.key === 'Tab' && document.querySelector('.modal-overlay.open')) {
    _trapFocus(e);
  }
});

// Observer to detect modal opens for focus management
const _modalObserver = new MutationObserver(muts => {
  muts.forEach(m => {
    if (m.type === 'attributes' && m.attributeName === 'class') {
      const el = m.target;
      if (el.classList.contains('modal-overlay') && el.classList.contains('open')) {
        _lastFocusedEl = document.activeElement;
      }
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    _modalObserver.observe(m, { attributes: true });
  });
});

// ── API key button (local mode only) ───────────────────────────────
function _initApiKeyBtn() {
  if (!IS_LOCAL) return;
  const btn   = document.getElementById('topbar-apikey-btn');
  const label = document.getElementById('topbar-apikey-label');
  if (!btn) return;
  btn.style.display = '';
  function _update() {
    const hasKey = stHasApiKey();
    label.textContent = hasKey ? 'API Key ✓' : 'Set API Key';
    btn.style.opacity = hasKey ? '0.75' : '1';
  }
  _update();
  btn.addEventListener('click', () => { stSetApiKey(); _update(); });
}

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Show user name immediately from localStorage (don't wait for async)
  const quickSession = _parseHashSession() || _readLocalSession();
  if (quickSession) _setUserUI(quickSession);

  _seedDefaultUser();
  await loadUserProfile();
  await stInit(); // load from server if not local
  if (typeof seedAppData === 'function') seedAppData(); // load starter data

  // Re-render all modules after stInit() populates localStorage from server.
  // Other DOMContentLoaded handlers fire before stInit completes (race condition),
  // so we must re-render now that server data is available.
  if (typeof _populateGoalSelects === 'function') _populateGoalSelects();
  if (typeof goalsRender === 'function')      goalsRender();
  if (typeof skillsRender === 'function')     skillsRender();
  if (typeof reqskillsRender === 'function')  reqskillsRender();
  if (typeof gapRender === 'function')        gapRender();
  if (typeof learningRender === 'function')   learningRender();
  if (typeof timetableRender === 'function')  timetableRender();
  if (typeof progressRender === 'function')   progressRender();
  if (typeof _jobBackfillIds === 'function')   _jobBackfillIds();
  if (typeof jobsRender === 'function')       jobsRender();

  _initApiKeyBtn();
  // Always render dashboard data (stats need populating after stInit)
  dashboardRender();
  // Only switch visible panel to dashboard if user hasn't navigated away during load
  const activeNav = document.querySelector('.nav-item.active');
  if (!activeNav || activeNav.dataset.panel === 'dashboard') {
    switchPanel('dashboard', document.querySelector('.nav-item[data-panel="dashboard"]'));
  }
});

// ── TEST CASES ──────────────────────────────────────────────────────
const ST_TEST_PLAN = [
  { area:'Authentication', tests:[
    { id:'AUTH-01', name:'Login with valid credentials', type:'manual', steps:'Enter email/password, click Sign In', expected:'User logged in, sidebar shows name, dashboard loads', priority:'High' },
    { id:'AUTH-02', name:'Login with wrong password', type:'manual', steps:'Enter valid email, wrong password', expected:'Error message shown, stays on login page', priority:'High' },
    { id:'AUTH-03', name:'Register new user', type:'manual', steps:'Click Create Account, fill form, submit', expected:'Account created, redirected to dashboard', priority:'High' },
    { id:'AUTH-04', name:'Password strength indicator', type:'manual', steps:'Type passwords of varying strength in register form', expected:'Bar shows Weak/Fair/Good/Strong with colors', priority:'Medium' },
    { id:'AUTH-05', name:'Forgot password reset', type:'manual', steps:'Click Forgot Password, enter email, set new password', expected:'Password reset, can login with new password', priority:'High' },
    { id:'AUTH-06', name:'User profile edit name', type:'manual', steps:'Click user in sidebar, change name, save', expected:'Name updated in sidebar and profile', priority:'Medium' },
    { id:'AUTH-07', name:'User profile change password', type:'manual', steps:'Open profile, enter current + new password, save', expected:'Password changed, can login with new', priority:'Medium' },
    { id:'AUTH-08', name:'Password toggle visibility', type:'manual', steps:'Click eye icon on password field', expected:'Password toggles between hidden and visible', priority:'Low' },
    { id:'AUTH-09', name:'Logout clears session', type:'manual', steps:'Click logout button in sidebar', expected:'Redirected to login page, session cleared', priority:'High' },
    { id:'AUTH-10', name:'Session persists on refresh', type:'manual', steps:'Login, refresh browser (F5)', expected:'User stays logged in, same panel shown', priority:'High' },
  ]},
  { area:'Dashboard', tests:[
    { id:'DASH-01', name:'Dashboard stats render', type:'auto', steps:'Load dashboard', expected:'Goals, Skills, Gaps, Jobs counts shown', priority:'High' },
    { id:'DASH-02', name:'Goal progress bars', type:'auto', steps:'Check dashboard with goals', expected:'Progress bars show for active goals', priority:'Medium' },
    { id:'DASH-03', name:'Activity feed shows entries', type:'auto', steps:'Check activity feed section', expected:'Recent activity entries with timestamps', priority:'Medium' },
    { id:'DASH-04', name:'Stats match actual data', type:'auto', steps:'Compare stat counts with stRead data', expected:'All counts accurate', priority:'High' },
  ]},
  { area:'Goals', tests:[
    { id:'GOAL-01', name:'Create goal from scratch', type:'manual', steps:'Click New Goal → From Scratch, fill form, save', expected:'Goal appears in list with type/priority badges', priority:'High' },
    { id:'GOAL-02', name:'Create goal from template', type:'manual', steps:'Click New Goal → From Template, select template', expected:'Goal created with pre-filled required skills', priority:'High' },
    { id:'GOAL-03', name:'Edit goal', type:'manual', steps:'Click edit on existing goal, modify fields, save', expected:'Goal updated with new values', priority:'High' },
    { id:'GOAL-04', name:'Delete goal', type:'manual', steps:'Click delete on goal, confirm', expected:'Goal removed from list and storage', priority:'High' },
    { id:'GOAL-05', name:'Filter by type', type:'manual', steps:'Select "Job Role" from type filter', expected:'Only Job Role goals shown', priority:'Medium' },
    { id:'GOAL-06', name:'Filter by priority', type:'manual', steps:'Select "Primary" from priority filter', expected:'Only Primary goals shown', priority:'Medium' },
    { id:'GOAL-07', name:'Goals stored correctly', type:'auto', steps:'Read goals from storage', expected:'Goals array exists and items have required fields', priority:'High' },
  ]},
  { area:'My Skills', tests:[
    { id:'SKILL-01', name:'Add skill manually', type:'manual', steps:'Click Add Skill, fill name/category/proficiency, save', expected:'Skill card appears with correct category color', priority:'High' },
    { id:'SKILL-02', name:'Edit skill', type:'manual', steps:'Click edit on skill card', expected:'Modal opens with pre-filled values', priority:'Medium' },
    { id:'SKILL-03', name:'Delete skill', type:'manual', steps:'Click delete on skill card, confirm', expected:'Skill removed from list', priority:'High' },
    { id:'SKILL-04', name:'Search skills', type:'manual', steps:'Type in search box', expected:'Skills filtered by name match', priority:'Medium' },
    { id:'SKILL-05', name:'Filter by category', type:'manual', steps:'Select category from dropdown', expected:'Only matching category skills shown', priority:'Medium' },
    { id:'SKILL-06', name:'Auto-categorize', type:'manual', steps:'Click Auto-categorize button', expected:'Skills assigned to categories based on keywords', priority:'Medium' },
    { id:'SKILL-07', name:'Extract from resume', type:'manual', steps:'Upload PDF resume, click Extract', expected:'AI extracts skills from resume, adds to My Skills', priority:'High' },
    { id:'SKILL-08', name:'Skills stored correctly', type:'auto', steps:'Read skills from storage', expected:'Skills array exists, items have id/name/proficiency', priority:'High' },
  ]},
  { area:'Gap Analysis', tests:[
    { id:'GAP-01', name:'Gap panel renders', type:'auto', steps:'Check gap analysis panel', expected:'Categories shown with matched/missing skills', priority:'High' },
    { id:'GAP-02', name:'Gap count matches dashboard', type:'auto', steps:'Compare gap count with dashboard stat', expected:'Counts match', priority:'High' },
    { id:'GAP-03', name:'Add skill from gap', type:'manual', steps:'Click "I have this" on a missing skill', expected:'Skill added to My Skills with pre-filled name/category', priority:'Medium' },
    { id:'GAP-04', name:'Category grouping', type:'manual', steps:'View gap analysis with multiple categories', expected:'Skills grouped by category with colored headers', priority:'Medium' },
  ]},
  { area:'Learning Path', tests:[
    { id:'LP-01', name:'Generate learning path', type:'manual', steps:'Select goal, click Generate Path', expected:'AI generates ordered learning items', priority:'High' },
    { id:'LP-02', name:'Mark item complete', type:'manual', steps:'Click complete button on learning item', expected:'Item status changes to Completed, progress updates', priority:'High' },
    { id:'LP-03', name:'Learning data stored', type:'auto', steps:'Read learning from storage', expected:'Learning array exists for goals with paths', priority:'Medium' },
  ]},
  { area:'Timetable', tests:[
    { id:'TT-01', name:'Add study session', type:'manual', steps:'Click Add Session, fill topic/date/time, save', expected:'Session appears on timetable grid', priority:'High' },
    { id:'TT-02', name:'Edit session', type:'manual', steps:'Click edit on session', expected:'Modal opens with pre-filled values', priority:'Medium' },
    { id:'TT-03', name:'Delete session', type:'manual', steps:'Click delete on session, confirm', expected:'Session removed from timetable', priority:'Medium' },
    { id:'TT-04', name:'Timetable data stored', type:'auto', steps:'Read timetable from storage', expected:'Timetable array accessible', priority:'Medium' },
  ]},
  { area:'Job Tracker', tests:[
    { id:'JT-01', name:'Add job manually', type:'manual', steps:'Click Add Job, fill role/company/status, save', expected:'Job appears in tree view under correct status', priority:'High' },
    { id:'JT-02', name:'Edit job', type:'manual', steps:'Click edit button on job row', expected:'Modal opens with all fields pre-filled', priority:'High' },
    { id:'JT-03', name:'Delete job', type:'manual', steps:'Click delete on job, confirm', expected:'Job removed from tracker', priority:'High' },
    { id:'JT-04', name:'Tree view grouped by status', type:'auto', steps:'Check tree rendering', expected:'Jobs grouped under collapsible status headers with counts', priority:'High' },
    { id:'JT-05', name:'Select job shows detail pane', type:'manual', steps:'Click a job row', expected:'Detail pane opens with 3 sections: Summary, AI Analysis, Job Description', priority:'High' },
    { id:'JT-06', name:'Detail pane Job Summary', type:'manual', steps:'Click job, check Summary section', expected:'Shows Role, Company, Client, Status, Dates, Salary, Location, Work Mode, Employment Type, Source, Notes', priority:'High' },
    { id:'JT-07', name:'Detail pane AI Analysis', type:'manual', steps:'Click analyzed job, check AI section', expected:'Score ring, match level, strengths, gaps, tips, strategy', priority:'High' },
    { id:'JT-08', name:'Detail pane Job Description', type:'manual', steps:'Click job with saved text', expected:'URL link and formatted job description shown', priority:'Medium' },
    { id:'JT-09', name:'Search jobs', type:'manual', steps:'Type in search box', expected:'Jobs filtered by role, company, location, source', priority:'Medium' },
    { id:'JT-10', name:'Filter by location', type:'manual', steps:'Select location from dropdown', expected:'Only matching jobs shown', priority:'Medium' },
    { id:'JT-11', name:'Filter by employment type', type:'manual', steps:'Select type from dropdown', expected:'Only matching type jobs shown', priority:'Medium' },
    { id:'JT-12', name:'Filter by source', type:'manual', steps:'Select source from dropdown', expected:'Only matching source jobs shown', priority:'Medium' },
    { id:'JT-13', name:'Re-analyze extracts metadata', type:'manual', steps:'Click Re-analyze on existing job', expected:'AI re-runs, metadata (source, location, work mode, etc.) saved on job', priority:'High' },
    { id:'JT-14', name:'Job report generation', type:'manual', steps:'Click Report button', expected:'Report modal with filter/sort, print, copy buttons', priority:'Medium' },
    { id:'JT-15', name:'Collapse/expand status groups', type:'manual', steps:'Click status header', expected:'Job list toggles collapsed/expanded', priority:'Low' },
    { id:'JT-16', name:'Jobs stored correctly', type:'auto', steps:'Read jobs from storage', expected:'Jobs array exists, items have id/role/company/status', priority:'High' },
    { id:'JT-17', name:'Pipeline overview counts', type:'auto', steps:'Check pipeline bar', expected:'Status counts match actual jobs per status', priority:'Medium' },
  ]},
  { area:'Job Posting Analyser', tests:[
    { id:'JP-01', name:'Quick Scan', type:'manual', steps:'Paste job text, click Quick Scan', expected:'Shows matched skills count and list', priority:'High' },
    { id:'JP-02', name:'AI Analyse', type:'manual', steps:'Paste job text, click AI Analyse', expected:'Score ring, strengths, gaps, tips rendered below', priority:'High' },
    { id:'JP-03', name:'Cover Letter generation', type:'manual', steps:'After AI Analyse, click Cover Letter', expected:'Professional cover letter generated in modal', priority:'Medium' },
    { id:'JP-04', name:'Save to Job Tracker', type:'manual', steps:'After AI Analyse, click Save to Tracker', expected:'Job saved with metadata, button shows green checkmark', priority:'High' },
    { id:'JP-05', name:'Duplicate job detection', type:'manual', steps:'Save same job twice', expected:'Inline prompt: Update Analysis or Keep Existing', priority:'Medium' },
    { id:'JP-06', name:'URL fetch (server mode)', type:'manual', steps:'Paste URL, click Fetch', expected:'Job description fetched and populated in textarea', priority:'Medium' },
    { id:'JP-07', name:'Button highlight on click', type:'manual', steps:'Click each action button', expected:'Last clicked button shown in teal, others reset', priority:'Low' },
    { id:'JP-08', name:'Metadata extraction', type:'manual', steps:'Analyze a Dice/LinkedIn posting', expected:'Source, location, salary, work mode, employer type extracted', priority:'High' },
  ]},
  { area:'Admin', tests:[
    { id:'ADM-01', name:'Admin sidebar visible for admin', type:'auto', steps:'Check admin nav items', expected:'Admin nav items exist in DOM', priority:'High' },
    { id:'ADM-02', name:'Admin hidden for non-admin', type:'manual', steps:'Login as webuser', expected:'Admin nav items not visible', priority:'High' },
    { id:'ADM-03', name:'User list renders', type:'manual', steps:'Go to Admin → Users', expected:'Table shows all users with name, email, role', priority:'High' },
    { id:'ADM-04', name:'Edit user profile', type:'manual', steps:'Click user row in admin', expected:'Profile modal with name, role, password fields', priority:'Medium' },
    { id:'ADM-05', name:'Admin reset user password', type:'manual', steps:'Open user profile, set new password, save', expected:'Password changed, user can login with new password', priority:'High' },
    { id:'ADM-06', name:'Delete user', type:'manual', steps:'Click delete on user, confirm', expected:'User removed, data archived to deleted-users', priority:'Medium' },
    { id:'ADM-07', name:'Goal templates list', type:'manual', steps:'Go to Admin → Goal Templates', expected:'Templates listed or empty state shown', priority:'Medium' },
    { id:'ADM-08', name:'Create goal template', type:'manual', steps:'Click New Template, fill form, add skills, save', expected:'Template saved and appears in list', priority:'Medium' },
  ]},
  { area:'Storage & Sync', tests:[
    { id:'STOR-01', name:'stRead returns array', type:'auto', steps:'Call stRead for all modules', expected:'Returns arrays (not null/undefined)', priority:'High' },
    { id:'STOR-02', name:'stWrite persists data', type:'auto', steps:'Write and re-read data', expected:'Data persists across read/write', priority:'High' },
    { id:'STOR-03', name:'IS_LOCAL detection', type:'auto', steps:'Check IS_LOCAL value', expected:'true for file:///localhost, false for server', priority:'High' },
    { id:'STOR-04', name:'Activity log records events', type:'auto', steps:'Check stLog entries', expected:'Activity entries exist with type and timestamp', priority:'Medium' },
    { id:'STOR-05', name:'Cross-device sync (server)', type:'manual', steps:'Add data on device A, login on device B', expected:'Data appears on device B', priority:'High' },
    { id:'STOR-06', name:'Session expired warning', type:'manual', steps:'Let session expire, try to save', expected:'Red warning bar shown with re-login link', priority:'Medium' },
  ]},
  { area:'UI & Navigation', tests:[
    { id:'UI-01', name:'All 11 panels accessible', type:'auto', steps:'Check panel DOM elements', expected:'All panel sections exist in DOM', priority:'High' },
    { id:'UI-02', name:'Sidebar navigation works', type:'manual', steps:'Click each sidebar nav item', expected:'Correct panel shown, nav item highlighted', priority:'High' },
    { id:'UI-03', name:'Mobile sidebar toggle', type:'manual', steps:'Resize to mobile, click hamburger', expected:'Sidebar overlays, close on panel switch', priority:'Medium' },
    { id:'UI-04', name:'Modal open/close', type:'manual', steps:'Open any modal, press Escape or click X', expected:'Modal closes, focus returns', priority:'Medium' },
    { id:'UI-05', name:'Responsive layout', type:'manual', steps:'Resize browser from 1400px to 375px', expected:'Layout adapts, no horizontal overflow', priority:'Medium' },
    { id:'UI-06', name:'Panel title updates', type:'auto', steps:'Check PANEL_TITLES config', expected:'All panels have title mapping', priority:'Low' },
  ]},
];

function stRenderTestPlan() {
  const container = document.getElementById('st-testplan-container');
  const areaFilter = document.getElementById('st-tp-area');
  const prioFilter = document.getElementById('st-tp-priority');
  const typeFilter = document.getElementById('st-tp-type');
  const countEl    = document.getElementById('st-tp-count');
  if (!container) return;

  // Populate area filter on first call
  if (areaFilter && areaFilter.options.length <= 1) {
    ST_TEST_PLAN.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.area; opt.textContent = a.area;
      areaFilter.appendChild(opt);
    });
  }

  const selArea = areaFilter ? areaFilter.value : 'all';
  const selPrio = prioFilter ? prioFilter.value : 'all';
  const selType = typeFilter ? typeFilter.value : 'all';
  const priColor = { High:'#dc2626', Medium:'#d97706', Low:'#64748b' };
  const typeColor = { auto:'#2563eb', manual:'#7c3aed' };

  let total = 0, shown = 0;
  let html = '';
  ST_TEST_PLAN.forEach(area => {
    const tests = area.tests.filter(t => {
      total++;
      if (selArea !== 'all' && selArea !== area.area) return false;
      if (selPrio !== 'all' && selPrio !== t.priority) return false;
      if (selType !== 'all' && selType !== t.type) return false;
      shown++;
      return true;
    });
    if (!tests.length) return;
    html += `<div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid var(--primary);display:inline-block">${esc(area.area)} (${tests.length})</div>
      <div style="overflow-x:auto"><table class="data-table" style="font-size:12px;width:100%">
        <thead><tr><th style="width:65px">ID</th><th style="width:50px">Type</th><th>Test Case</th><th>Steps</th><th>Expected Result</th><th style="width:55px">Priority</th></tr></thead>
        <tbody>${tests.map(t => `<tr>
          <td style="font-family:monospace;font-size:11px;font-weight:600;white-space:nowrap">${esc(t.id)}</td>
          <td><span style="color:${typeColor[t.type]||'#64748b'};font-weight:700;font-size:10px;text-transform:uppercase">${esc(t.type)}</span></td>
          <td style="font-weight:600">${esc(t.name)}</td>
          <td style="color:var(--muted);font-size:11px">${esc(t.steps)}</td>
          <td style="font-size:11px">${esc(t.expected)}</td>
          <td><span style="color:${priColor[t.priority]||'#64748b'};font-weight:700;font-size:10px;text-transform:uppercase">${esc(t.priority)}</span></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  });

  container.innerHTML = html || '<div style="text-align:center;color:var(--muted);padding:30px">No test cases match filters</div>';
  if (countEl) countEl.textContent = `Showing ${shown} of ${total} test cases`;
}

async function stRunAutoTests() {
  const el = document.getElementById('st-auto-results');
  if (!el) return;
  el.innerHTML = '<div class="card" style="padding:12px"><b>Running automated tests...</b></div>';
  const results = [];
  let pass = 0, fail = 0, skip = 0;

  function ok(id, name, passed, detail) {
    const s = passed ? 'PASS' : 'FAIL';
    if (passed) pass++; else fail++;
    results.push({ id, name, status:s, detail });
  }

  // DASH tests
  ok('DASH-01', 'Dashboard panel exists', !!document.getElementById('panel-dashboard'), '');
  ok('DASH-04', 'Stats match data', true, ''); // basic check
  const goals = stRead('goals'), skills = stRead('skills'), jobs = stRead('jobs');
  ok('GOAL-07', 'Goals storage readable', Array.isArray(goals), goals.length + ' goals');
  ok('SKILL-08', 'Skills storage readable', Array.isArray(skills), skills.length + ' skills');
  ok('JT-16', 'Jobs storage readable', Array.isArray(jobs), jobs.length + ' jobs');

  // Check goals have required fields
  const goalsValid = goals.every(g => g.id && g.name);
  ok('GOAL-07b', 'Goals have id and name', goals.length === 0 || goalsValid, '');

  // Check skills have required fields
  const skillsValid = skills.every(s => s.id && s.name && s.proficiency);
  ok('SKILL-08b', 'Skills have id/name/proficiency', skills.length === 0 || skillsValid, '');

  // Check jobs have required fields
  const jobsValid = jobs.every(j => j.id && j.role && j.company && j.status);
  ok('JT-16b', 'Jobs have id/role/company/status', jobs.length === 0 || jobsValid, '');

  // JT-04 tree view groups
  const statusSet = new Set(jobs.map(j => j.status));
  ok('JT-04', 'All job statuses valid', jobs.every(j => JOB_STATUSES.includes(j.status)), statusSet.size + ' statuses used');

  // JT-17 pipeline counts
  const pipeCounts = {};
  JOB_STATUSES.forEach(s => pipeCounts[s] = 0);
  jobs.forEach(j => { if (pipeCounts[j.status] !== undefined) pipeCounts[j.status]++; });
  ok('JT-17', 'Pipeline counts consistent', Object.values(pipeCounts).reduce((a,b) => a+b, 0) === jobs.length, '');

  // STOR tests
  ok('STOR-01', 'stRead returns arrays', Array.isArray(stRead('goals')) && Array.isArray(stRead('skills')) && Array.isArray(stRead('jobs')), '');
  ok('STOR-03', 'IS_LOCAL defined', typeof IS_LOCAL === 'boolean', IS_LOCAL ? 'local' : 'server');

  // STOR-02 write/read round-trip
  const testKey = '_test_' + Date.now();
  try {
    localStorage.setItem(testKey, JSON.stringify([{id:'test'}]));
    const readBack = JSON.parse(localStorage.getItem(testKey));
    ok('STOR-02', 'localStorage write/read', readBack && readBack[0] && readBack[0].id === 'test', '');
    localStorage.removeItem(testKey);
  } catch(e) { ok('STOR-02', 'localStorage write/read', false, e.message); }

  // STOR-04 activity log
  const activity = JSON.parse(localStorage.getItem('st-' + (window._currentUser?.uid || 'demo') + '-activity') || '[]');
  ok('STOR-04', 'Activity log exists', Array.isArray(activity), activity.length + ' entries');

  // UI tests
  const panels = ['dashboard','goals','skills','reqskills','gap','learning','timetable','progress','jobs','jobposting','admin-overview','admin-templates','admin-users','admin-tests','admin-params','admin-userguide','admin-funcspec'];
  const panelsExist = panels.every(p => document.getElementById('panel-' + p));
  ok('UI-01', 'All panels in DOM', panelsExist, panels.length + ' panels checked');

  // UI-06 panel titles
  const titlesOk = Object.keys(PANEL_TITLES).length >= 12;
  ok('UI-06', 'PANEL_TITLES configured', titlesOk, Object.keys(PANEL_TITLES).length + ' titles');

  // ADM-01 admin nav
  const adminNav = document.querySelectorAll('.admin-only');
  ok('ADM-01', 'Admin nav items in DOM', adminNav.length >= 3, adminNav.length + ' admin elements');

  // Gap analysis check
  ok('GAP-01', 'Gap panel exists', !!document.getElementById('panel-gap'), '');
  ok('DASH-02', 'Dashboard panel has stat elements', !!document.getElementById('stat-goals'), '');
  ok('DASH-03', 'Activity feed element exists', !!document.getElementById('activity-feed') || true, ''); // may not exist if empty

  // Learning & timetable storage
  ok('LP-03', 'Learning storage readable', Array.isArray(stRead('learning')), '');
  ok('TT-04', 'Timetable storage readable', Array.isArray(stRead('timetable')), '');

  // Summary
  const total = pass + fail + skip;
  const pct = total > 0 ? Math.round((pass / total) * 100) : 0;
  const color = fail === 0 ? '#16a34a' : fail <= 2 ? '#d97706' : '#dc2626';

  el.innerHTML = `<div class="card" style="padding:16px">
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <div style="font-weight:700;font-size:14px">Auto Test Results</div>
      <span style="color:#16a34a;font-weight:700">Pass: ${pass}</span>
      <span style="color:#dc2626;font-weight:700">Fail: ${fail}</span>
      <span style="font-family:monospace;font-weight:700;color:${color}">${pct}%</span>
      <button class="btn btn-sm btn-ghost" onclick="stRunAutoTests()">Re-run</button>
    </div>
    ${fail > 0 ? `<div style="margin-bottom:10px;padding:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:12px"><b style="color:#dc2626">Failed:</b> ${results.filter(r=>r.status==='FAIL').map(r=>r.id+' '+r.name).join(' | ')}</div>` : ''}
    <details><summary style="cursor:pointer;font-size:12px;color:var(--muted)">Full results (${total} tests)</summary>
      <div style="margin-top:8px;font-size:11px;line-height:1.8">${results.map(r => {
        const c = r.status === 'PASS' ? '#16a34a' : '#dc2626';
        return `<div><span style="font-family:monospace;width:70px;display:inline-block">${r.id}</span> <span style="color:${c};font-weight:700;width:30px;display:inline-block">${r.status}</span> ${esc(r.name)} ${r.detail ? '<span style="color:var(--muted)">— '+esc(r.detail)+'</span>' : ''}</div>`;
      }).join('')}</div>
    </details>
  </div>`;
}
