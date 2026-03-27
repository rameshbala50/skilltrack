/* ──────────────────────────────────────────
   SkillTrack — Required Skills Module
   Displays in the same card/grid format as My Skills
────────────────────────────────────────── */
'use strict';

// Category config: icon + color + bg (mirrors GAP_CAT_CFG)
const RS_CAT_CFG = {
  'Snowflake Core Expertise'      : { icon:'❄️',  color:'#06b6d4', bg:'#ecfeff' },
  'Cloud Platform Knowledge'      : { icon:'☁️',  color:'#0369a1', bg:'#f0f9ff' },
  'Data Engineering Skills'       : { icon:'⚙️',  color:'#d97706', bg:'#fffbeb' },
  'SQL & Query Optimization'      : { icon:'🔍',  color:'#059669', bg:'#f0fdf4' },
  'Data Governance & Security'    : { icon:'🛡️', color:'#dc2626', bg:'#fef2f2' },
  'Architecture & Design Skills'  : { icon:'🏗️', color:'#7c3aed', bg:'#f5f3ff' },
  'DevOps & Automation'           : { icon:'🔧',  color:'#64748b', bg:'#f8fafc' },
  'BI & Analytics Integration'    : { icon:'📊',  color:'#7c3aed', bg:'#faf5ff' },
  'Monitoring & Cost Optimization': { icon:'⚡',  color:'#d97706', bg:'#fffbeb' },
  'Soft Skills'                   : { icon:'🤝',  color:'#0d9488', bg:'#f0fdfa' },
  'Bonus Skills'                  : { icon:'⭐',  color:'#b45309', bg:'#fef3c7' },
  'Snowflake Platform (Core)'     : { icon:'❄️',  color:'#06b6d4', bg:'#ecfeff' },
  'Data Architecture & Modeling'  : { icon:'🏗️', color:'#7c3aed', bg:'#f5f3ff' },
  'Security & RBAC'               : { icon:'🔐',  color:'#dc2626', bg:'#fef2f2' },
  'Data Engineering & ETL'        : { icon:'⚙️',  color:'#d97706', bg:'#fffbeb' },
  'Cloud Platforms'               : { icon:'☁️',  color:'#0369a1', bg:'#f0f9ff' },
  'Programming & Query Languages' : { icon:'💻',  color:'#059669', bg:'#f0fdf4' },
  'BI & Analytics'                : { icon:'📊',  color:'#9333ea', bg:'#faf5ff' },
  'AI / ML & Cortex'              : { icon:'🤖',  color:'#0d9488', bg:'#f0fdfa' },
  'DevOps & CI/CD'                : { icon:'🔧',  color:'#64748b', bg:'#f8fafc' },
  'Performance Optimization'      : { icon:'⚡',  color:'#ea580c', bg:'#fff7ed' },
  'Certifications'                : { icon:'🏅',  color:'#b45309', bg:'#fef3c7' },
  'General'                       : { icon:'📋',  color:'#64748b', bg:'#f8fafc' }
};
function _rsCatCfg(cat) { return RS_CAT_CFG[cat] || { icon:'📋', color:'#64748b', bg:'#f8fafc' }; }

let _rsGoalId    = '';
let _rsSkills    = []; // [{name, category}]
let _rsCatFilter = 'all';

function _rsNorm(arr) {
  return (arr || []).map(s => typeof s === 'string'
    ? { name: s, category: 'General', level: 'Advanced' }
    : { level: 'Advanced', ...s });
}

// ── Panel render (called on switch) ────────────────────────────────
function reqskillsRender() {
  const goals = stRead('goals');
  _rsRenderGoalCards(goals);
  _rsShowGoal();
}

function _rsRenderGoalCards(goals) {
  const el = document.getElementById('rs-goal-cards');
  if (!el) return;
  if (!goals.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--muted)">No goals yet. <a href="#" onclick="switchPanel(\'goals\',null);return false">Create a goal →</a></p>';
    return;
  }
  el.innerHTML = goals.map(g => {
    const meta   = (typeof GOAL_TYPE_META !== 'undefined' && GOAL_TYPE_META[g.type]) || { emoji:'⭐' };
    const priCls = (typeof PRIORITY_CLS   !== 'undefined' && PRIORITY_CLS[g.priority]) || 'badge-muted';
    return `<div class="goal-sel-card ${g.id === _rsGoalId ? 'active' : ''}" onclick="rsSelectGoal('${g.id}')">
      <span class="goal-sel-emoji">${meta.emoji}</span>
      <div class="goal-sel-info">
        <div class="goal-sel-name">${esc(g.name)}</div>
        <span class="badge ${priCls}" style="font-size:10px">${esc(g.priority)}</span>
      </div>
    </div>`;
  }).join('');
}

// ── Goal selection ──────────────────────────────────────────────────
function rsSelectGoal(goalId) {
  _rsGoalId    = goalId;
  _rsCatFilter = 'all';
  const goals  = stRead('goals');
  const goal   = goals.find(g => g.id === goalId);
  _rsSkills    = _rsNorm(goal ? goal.requiredSkills : []);
  _rsRenderGoalCards(goals); // update active card highlight
  _rsShowGoal();
}

function _rsShowGoal() {
  const content = document.getElementById('rs-goal-content');
  const noGoal  = document.getElementById('rs-no-goal');
  if (!content) return;

  const tbActions = document.getElementById('rs-toolbar-actions');
  if (!_rsGoalId) {
    content.style.display = 'none';
    if (noGoal) noGoal.style.display = '';
    if (tbActions) tbActions.style.display = 'none';
    return;
  }
  const goal = stRead('goals').find(g => g.id === _rsGoalId);
  if (!goal) {
    content.style.display = 'none';
    if (noGoal) noGoal.style.display = '';
    if (tbActions) tbActions.style.display = 'none';
    return;
  }

  if (noGoal) noGoal.style.display = 'none';
  content.style.display = '';
  if (tbActions) tbActions.style.display = '';

  // Populate category dropdown based on selected goal's categories
  _rsPopulateCatDropdown();

  // Goal info card
  const infoEl = document.getElementById('rs-goal-info');
  if (infoEl) {
    const meta   = (typeof GOAL_TYPE_META !== 'undefined' && GOAL_TYPE_META[goal.type]) || { emoji: '⭐' };
    const priCls = (typeof PRIORITY_CLS  !== 'undefined' && PRIORITY_CLS[goal.priority]) || 'badge-muted';
    infoEl.innerHTML = `
      <div class="rs-goal-card">
        <div class="rs-goal-icon">${meta.emoji}</div>
        <div class="rs-goal-details">
          <div class="rs-goal-name">${esc(goal.name)}</div>
          <div class="rs-goal-meta">
            <span class="badge ${priCls}">${esc(goal.priority)}</span>
            <span class="badge badge-muted">${esc(goal.type)}</span>
            ${goal.targetDate ? `<span style="font-size:12px;color:var(--muted)">Target: ${fmtDate(goal.targetDate)}</span>` : ''}
          </div>
          ${goal.description ? `<div class="rs-goal-desc">${esc(goal.description)}</div>` : ''}
        </div>
      </div>`;
  }

  _rsRenderCatTabs();
  _rsRenderCards();
}

// ── Category filter tabs (mirrors skill-group-tabs) ─────────────────
function _rsRenderCatTabs() {
  const tabsEl = document.getElementById('rs-cat-tabs');
  if (!tabsEl) return;

  // Collect categories present in current skills
  const cats = [];
  _rsSkills.forEach(s => { const c = s.category || 'General'; if (!cats.includes(c)) cats.push(c); });

  tabsEl.innerHTML =
    `<button class="pill ${_rsCatFilter==='all'?'active':''}" data-cat="all" onclick="rsSetCatFilter('all',this)">All</button>` +
    cats.map(c =>
      `<button class="pill ${_rsCatFilter===c?'active':''}" data-cat="${esc(c)}" onclick="rsSetCatFilter('${esc(c)}',this)">${esc(c)}</button>`
    ).join('');
}

function _rsPopulateCatDropdown() {
  const sel = document.getElementById('rs-cat-select');
  if (!sel) return;
  // Get unique categories from current goal's skills, preserving order
  const cats = [];
  _rsSkills.forEach(s => {
    const c = s.category || 'General';
    if (!cats.includes(c)) cats.push(c);
  });
  // Always include General at the end if not present
  if (!cats.includes('General')) cats.push('General');
  const curVal = sel.value;
  sel.innerHTML = cats.map(c =>
    `<option value="${esc(c)}"${c === curVal ? ' selected' : ''}>${esc(c)}</option>`
  ).join('');
}

function rsSetCatFilter(cat, btn) {
  _rsCatFilter = cat;
  document.querySelectorAll('#rs-cat-tabs .pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _rsRenderCards();
}

// ── Render: gap-style category blocks ──────────────────────────────
function _rsRenderCards() {
  const el    = document.getElementById('rs-grid');
  const count = document.getElementById('rs-count');
  if (!el) return;
  if (count) count.textContent = _rsSkills.length;

  if (!_rsSkills.length) {
    el.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <h3>No required skills yet</h3>
      <p>Use <strong>AI Suggest</strong> or add manually below.</p>
    </div>`;
    return;
  }

  // Build category map (preserve insertion order)
  const catOrder = [];
  const catMap   = {};
  _rsSkills.forEach((s, i) => {
    const cat = s.category || 'General';
    if (!catMap[cat]) { catMap[cat] = []; catOrder.push(cat); }
    catMap[cat].push({ ...s, _idx: i });
  });

  const visibleCats   = _rsCatFilter === 'all' ? catOrder : catOrder.filter(c => c === _rsCatFilter);
  const visibleSkills = visibleCats.reduce((a, c) => a + catMap[c].length, 0);

  // Summary bar
  const summaryPills = catOrder.map(cat => {
    const cfg = _rsCatCfg(cat);
    return `<span class="prof-summary-pill" style="background:${cfg.bg};color:${cfg.color};cursor:pointer" onclick="rsSetCatFilter('${esc(cat)}',null)">${esc(cat)}: <strong>${catMap[cat].length}</strong></span>`;
  }).join('');

  let html = `<div class="skills-summary-bar">
    <span class="skills-total">${visibleSkills} skill${visibleSkills!==1?'s':''}${_rsCatFilter!=='all'?' in '+esc(_rsCatFilter):' total'}</span>
    <div class="prof-summary-pills">${summaryPills}</div>
  </div>`;

  html += `<div class="gap-categories">` +
    visibleCats.map(cat => _rsCatBlock(cat, catMap[cat])).join('') +
    `</div>`;

  el.innerHTML = html;
}

function _rsCatBlock(cat, skills) {
  const cfg  = _rsCatCfg(cat);
  const rows = skills.map(s => {
    const lvl = s.level || 'Advanced';
    const pc  = (typeof PROF_CONFIG !== 'undefined' && PROF_CONFIG[lvl]) || { color:'#0d9488', bg:'#f0fdfa' };
    return `<div class="gap-table-row">
      <div class="gap-skill-name">${esc(s.name)}</div>
      <div><span style="font-size:11px;font-weight:600;color:${pc.color};background:${pc.bg};padding:2px 10px;border-radius:20px;white-space:nowrap">${esc(lvl)}</span></div>
      <div class="gap-status-cell" style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
        <button class="icon-btn" title="Edit" onclick="rsEditSkill(${s._idx})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn icon-btn-danger" title="Remove" onclick="rsRemoveSkill(${s._idx})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  return `<div class="gap-cat-block">
    <div class="gap-cat-header" style="background:${cfg.bg};border-color:${cfg.color}30">
      <div class="gap-cat-title">
        <span class="gap-cat-icon">${cfg.icon}</span>
        <span class="gap-cat-name" style="color:${cfg.color}">${esc(cat.toUpperCase())}</span>
        <span class="gap-cat-count badge badge-muted">${skills.length} skill${skills.length!==1?'s':''}</span>
      </div>
    </div>
    <div class="gap-cat-table">
      <div class="gap-table-head"><div>Required Skill</div><div>Required Level</div><div></div></div>
      ${rows}
    </div>
  </div>`;
}

// ── Add / Remove ────────────────────────────────────────────────────
function rsAddSkill() {
  const input  = document.getElementById('rs-skill-input');
  const catSel = document.getElementById('rs-cat-select');
  const lvlSel = document.getElementById('rs-level-select');
  if (!input || !_rsGoalId) return;
  const cat   = catSel ? catSel.value  : 'General';
  const level = lvlSel ? lvlSel.value  : 'Advanced';
  const vals  = input.value.split(',').map(s => s.trim()).filter(Boolean);
  let added   = false;
  vals.forEach(name => {
    if (!_rsSkills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      _rsSkills.push({ name, category: cat, level }); added = true;
    }
  });
  input.value = '';
  if (added) { _rsSave(); _rsRenderCatTabs(); _rsRenderCards(); }
}

function rsRemoveSkill(i) {
  _rsSkills.splice(i, 1);
  _rsSave();
  _rsRenderCatTabs();
  _rsRenderCards();
}

// ── Edit modal ───────────────────────────────────────────────────────
let _rsEditIdx = -1;

function rsEditSkill(i) {
  const s = _rsSkills[i];
  if (!s) return;
  _rsEditIdx = i;

  document.getElementById('rse-name').value  = s.name;
  document.getElementById('rse-level').value = s.level || 'Advanced';

  // Populate category select with all known categories (from current skills + standard list)
  const catSel = document.getElementById('rse-cat');
  const srcCat = document.getElementById('rs-cat-select');
  catSel.innerHTML = srcCat ? srcCat.innerHTML : '';
  catSel.value = s.category || 'General';

  document.getElementById('rs-edit-modal').classList.add('open');
  setTimeout(() => document.getElementById('rse-name').focus(), 60);
}

function rsCloseEditModal() {
  document.getElementById('rs-edit-modal').classList.remove('open');
  _rsEditIdx = -1;
}

function rsSaveEdit() {
  const name  = document.getElementById('rse-name').value.trim();
  const errEl = document.getElementById('rse-error');
  if (!name) { errEl.textContent = 'Skill name is required.'; return; }

  const cat   = document.getElementById('rse-cat').value;
  const level = document.getElementById('rse-level').value;

  // Check for duplicate (ignore self)
  if (_rsSkills.some((s, i) => i !== _rsEditIdx && s.name.toLowerCase() === name.toLowerCase())) {
    errEl.textContent = `"${name}" already exists in this goal.`; return;
  }
  errEl.textContent = '';

  _rsSkills[_rsEditIdx] = { name, category: cat, level };
  _rsSave();
  rsCloseEditModal();
  _rsRenderCatTabs();
  _rsRenderCards();
}

function rsEditKeydown(e) { if (e.key === 'Enter') rsSaveEdit(); }

function rsSkillKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); rsAddSkill(); }
}

function rsClearAll() {
  if (!_rsSkills.length) return;
  if (!confirm('Clear all required skills for this goal?')) return;
  _rsSkills = []; _rsCatFilter = 'all';
  _rsSave(); _rsRenderCatTabs(); _rsRenderCards();
}

// ── Auto-save ───────────────────────────────────────────────────────
function _rsSave() {
  if (!_rsGoalId) return;
  const goals = stRead('goals');
  const goal  = goals.find(g => g.id === _rsGoalId);
  if (!goal) return;
  goal.requiredSkills = _rsSkills.map(({ name, category, level }) => ({ name, category, level }));
  stUpsert('goals', goal);
  stLog('goal_updated', 'Updated required skills for: ' + goal.name);
  if (typeof dashboardRender === 'function') dashboardRender();
}

// ── AI Suggest ──────────────────────────────────────────────────────
async function rsGenerateAI() {
  const statusEl = document.getElementById('rs-ai-status');
  const btn      = document.getElementById('rs-ai-btn');
  const goal     = stRead('goals').find(g => g.id === _rsGoalId);
  if (!goal) return;

  if (statusEl) statusEl.textContent = 'Asking AI for skill suggestions…';
  if (btn) btn.disabled = true;

  const r = await aiCall('suggest_skills', { goalName: goal.name, goalType: goal.type, description: goal.description || '' });

  if (btn) btn.disabled = false;

  if (r.ok && Array.isArray(r.skills)) {
    let added = 0;
    r.skills.forEach(s => {
      const name  = typeof s === 'string' ? s : s.name;
      const cat   = typeof s === 'string' ? 'General' : (s.category || 'General');
      const level = typeof s === 'string' ? 'Advanced' : (s.level || 'Advanced');
      if (!_rsSkills.some(x => x.name.toLowerCase() === name.toLowerCase())) {
        _rsSkills.push({ name, category: cat, level }); added++;
      }
    });
    _rsSave(); _rsRenderCatTabs(); _rsRenderCards();
    if (statusEl) statusEl.textContent = added > 0
      ? `Added ${added} skill${added > 1 ? 's' : ''}. Remove any that don't apply.`
      : 'All suggested skills already listed.';
  } else {
    if (statusEl) statusEl.textContent = r.error || 'AI suggestion failed.';
  }
}

// ── Jump from Gap Analysis ──────────────────────────────────────────
function _rsJumpToGoal(goalId) {
  switchPanel('reqskills', null);
  setTimeout(() => rsSelectGoal(goalId), 50);
}

// ── Init ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', reqskillsRender);
