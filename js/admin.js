/* ──────────────────────────────────────────
   SkillTrack — Admin Module
   Panels: admin-overview | admin-templates | admin-users
────────────────────────────────────────── */
'use strict';

const ROLES = ['admin', 'webuser', 'webreader'];
const ROLE_CFG = {
  admin     : { label: 'Admin',    color: '#dc2626', bg: '#fef2f2' },
  webuser   : { label: 'Web User', color: '#0369a1', bg: '#eff6ff' },
  webreader : { label: 'Reader',   color: '#64748b', bg: '#f8fafc' },
};

// All known skill categories (shown as datalist suggestions)
const TPL_CATS = [
  'General','Soft Skills','Certifications',
  'Snowflake Platform (Core)','Data Architecture & Modeling','Security & RBAC',
  'Data Engineering & ETL','Programming & Query Languages','Cloud Platforms',
  'BI & Analytics','AI / ML & Cortex','DevOps & CI/CD','Performance Optimization',
  'Core AI / ML','Deep Learning & Neural Networks','LLM & Generative AI',
  'ML Frameworks & Libraries','MLOps & Deployment','Cloud AI Platforms',
  'Data Engineering for AI','AI Safety & Ethics',
  'Core ML Algorithms','Mathematics & Statistics','Programming & Data',
  'Deep Learning','MLOps & Production','Data Engineering for ML',
  'Infrastructure & DevOps','Model Evaluation & Ethics',
].sort();

// ── Template storage ─────────────────────────────────────────────────
let _adminTpls         = null;  // cached array of templates
let _adminTplId        = '';    // selected template id (main panel)
let _adminTplSkills    = [];    // editable skills for selected template (main panel)
let _adminTplCatFilter = 'all';
let _adminEditSkillIdx = -1;
let _tplModalSkills    = [];    // skills staged in the New Template modal

async function adminGetTemplates(forceRefresh) {
  if (_adminTpls && !forceRefresh) return _adminTpls;
  if (IS_LOCAL) {
    const saved = JSON.parse(localStorage.getItem('st-admin-templates') || 'null');
    _adminTpls = (saved && saved.length) ? saved
               : (typeof COMMON_GOALS !== 'undefined' ? JSON.parse(JSON.stringify(COMMON_GOALS)) : []);
  } else {
    try {
      const res  = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'get_templates' }) });
      const data = await res.json();
      _adminTpls = (data.ok && data.data && data.data.templates && data.data.templates.length)
                  ? data.data.templates
                  : (typeof COMMON_GOALS !== 'undefined' ? JSON.parse(JSON.stringify(COMMON_GOALS)) : []);
    } catch { _adminTpls = typeof COMMON_GOALS !== 'undefined' ? JSON.parse(JSON.stringify(COMMON_GOALS)) : []; }
  }
  return _adminTpls;
}

async function _adminPersistTemplates() {
  if (IS_LOCAL) {
    localStorage.setItem('st-admin-templates', JSON.stringify(_adminTpls));
  } else {
    try {
      await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'save_all_templates', templates: _adminTpls }) });
    } catch(e) { console.error('Failed to save templates', e); }
  }
}

// ── Guard ────────────────────────────────────────────────────────────
function _adminGuard() {
  if (!window._isAdmin) { switchPanel('dashboard', null); return false; }
  return true;
}

// ══════════════════════════════════════════════════════════════════════
// OVERVIEW PANEL
// ══════════════════════════════════════════════════════════════════════
async function adminOverviewRender() {
  if (!_adminGuard()) return;
  const templates = await adminGetTemplates();
  const tplSkills = templates.reduce((s, t) => s + (t.requiredSkills || []).length, 0);

  const el = document.getElementById('admin-overview-content');
  if (!el) return;

  el.innerHTML = `
    <div class="admin-stat-grid">
      <div class="admin-stat-card" id="admin-user-stat">
        <div class="admin-stat-icon">👤</div>
        <div class="admin-stat-val">…</div>
        <div class="admin-stat-label">Registered Users</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">📋</div>
        <div class="admin-stat-val">${templates.length}</div>
        <div class="admin-stat-label">Goal Templates</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">⭐</div>
        <div class="admin-stat-val">${tplSkills}</div>
        <div class="admin-stat-label">Template Skills Total</div>
      </div>
    </div>

    <div class="admin-info-grid" style="margin-top:24px">
      <div class="admin-info-card">
        <div class="admin-info-title">Goal Templates</div>
        <div class="admin-info-body">
          ${templates.map(t => `
            <div class="admin-info-row">
              <span>${t.icon || '📋'} ${esc(t.name)}</span>
              <span class="badge badge-muted">${(t.requiredSkills||[]).length} skills</span>
            </div>`).join('')}
          ${!templates.length ? '<p style="color:var(--muted);font-size:13px">No templates yet.</p>' : ''}
        </div>
      </div>
      <div class="admin-info-card">
        <div class="admin-info-title">Quick Actions</div>
        <div class="admin-info-body" style="display:flex;flex-direction:column;gap:8px;padding-top:4px">
          <button class="btn btn-ghost btn-sm" onclick="switchPanel('admin-templates', document.querySelector('[data-panel=admin-templates]'))">
            📋 Manage Goal Templates →
          </button>
          <button class="btn btn-ghost btn-sm" onclick="switchPanel('admin-users', document.querySelector('[data-panel=admin-users]'))">
            👥 Manage Users →
          </button>
        </div>
      </div>
    </div>`;

  // Load user count async
  _adminLoadUserCount();
}

async function _adminLoadUserCount() {
  try {
    let count = 0;
    if (IS_LOCAL) {
      count = JSON.parse(localStorage.getItem('st-users') || '[]').length;
    } else {
      const res  = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'list_users' }) });
      const data = await res.json();
      count = data.ok ? (data.data.users || []).length : 0;
    }
    const el = document.getElementById('admin-user-stat');
    if (el) el.querySelector('.admin-stat-val').textContent = count;
  } catch {}
}

// ══════════════════════════════════════════════════════════════════════
// TEMPLATES PANEL
// ══════════════════════════════════════════════════════════════════════
async function adminTemplatesRender() {
  if (!_adminGuard()) return;
  await adminGetTemplates(); // ensure cached
  _adminRenderTplList();
  if (_adminTplId) {
    adminSelectTpl(_adminTplId);
  }
}

function _adminRenderTplList() {
  const el = document.getElementById('atpl-list');
  if (!el || !_adminTpls) return;
  if (!_adminTpls.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:8px 0">No templates yet. Click + New Template to add one.</p>';
    return;
  }
  el.innerHTML = _adminTpls.map(t => `
    <div class="atpl-card ${t.id === _adminTplId ? 'active' : ''}" onclick="adminSelectTpl('${esc(t.id)}')">
      <span class="atpl-card-icon">${t.icon || '📋'}</span>
      <div class="atpl-card-body">
        <div class="atpl-card-name">${esc(t.name)}</div>
        <div class="atpl-card-meta">${esc(t.type)} · ${(t.requiredSkills||[]).length} skills</div>
      </div>
    </div>`).join('');
}

function adminSelectTpl(id) {
  _adminTplId  = id;
  const tpl    = (_adminTpls || []).find(t => t.id === id);
  _adminTplSkills    = tpl ? JSON.parse(JSON.stringify(tpl.requiredSkills || [])).map(s =>
    typeof s === 'string' ? { name: s, category: 'General', level: 'Advanced' } : s
  ) : [];
  _adminTplCatFilter = 'all';
  _adminRenderTplList();
  _adminShowTplContent(tpl);
}

function _adminShowTplContent(tpl) {
  const noSel  = document.getElementById('atpl-no-selection');
  const content = document.getElementById('atpl-content');
  if (!tpl) {
    if (noSel) noSel.style.display = '';
    if (content) content.style.display = 'none';
    return;
  }
  if (noSel) noSel.style.display = 'none';
  if (content) content.style.display = '';

  // Header
  const hdr = document.getElementById('atpl-header');
  if (hdr) {
    const typeMeta = (typeof GOAL_TYPE_META !== 'undefined' && GOAL_TYPE_META[tpl.type]) || { emoji:'⭐' };
    const tagPills = (tpl.tags||[]).map(tag => `<span class="badge badge-muted">${esc(tag)}</span>`).join('');
    hdr.innerHTML = `
      <div class="atpl-detail-header">
        <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">
          <span style="font-size:32px;line-height:1">${tpl.icon || typeMeta.emoji}</span>
          <div style="min-width:0">
            <div style="font-size:17px;font-weight:700;color:var(--text)">${esc(tpl.name)}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <span class="badge badge-muted">${esc(tpl.type)}</span>
              ${tagPills}
              <span>${(tpl.requiredSkills||[]).length} required skills</span>
            </div>
            ${tpl.description ? `<div style="font-size:13px;color:var(--muted);margin-top:4px">${esc(tpl.description)}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-items:center">
          <span id="atpl-ai-status" style="font-size:12px;color:var(--cyan)"></span>
          <button class="btn btn-ghost btn-sm btn-ai" id="atpl-ai-btn" onclick="adminTplSuggestSkills()" title="AI suggest required skills for this template">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            AI Suggest
          </button>
          <button class="btn btn-ghost btn-sm" onclick="openTplModal('${esc(tpl.id)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Info
          </button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="adminDeleteTpl('${esc(tpl.id)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Delete
          </button>
        </div>
      </div>`;
  }

  // Populate category datalist
  const dl = document.getElementById('atpl-cat-list');
  if (dl) {
    const existing = [...new Set(_adminTplSkills.map(s => s.category || 'General').concat(TPL_CATS))].sort();
    dl.innerHTML = existing.map(c => `<option value="${esc(c)}">`).join('');
  }

  _adminRenderTplCatTabs();
  _adminRenderTplSkills();
}

function _adminRenderTplCatTabs() {
  const el = document.getElementById('atpl-cat-tabs');
  if (!el) return;
  const cats = [];
  _adminTplSkills.forEach(s => { const c = s.category || 'General'; if (!cats.includes(c)) cats.push(c); });
  el.innerHTML =
    `<button class="pill ${_adminTplCatFilter==='all'?'active':''}" onclick="adminTplSetCat('all',this)">All <span class="badge badge-muted">${_adminTplSkills.length}</span></button>` +
    cats.map(c => {
      const cnt = _adminTplSkills.filter(s => (s.category||'General') === c).length;
      return `<button class="pill ${_adminTplCatFilter===c?'active':''}" onclick="adminTplSetCat('${esc(c)}',this)">${esc(c)} <span class="badge badge-muted">${cnt}</span></button>`;
    }).join('');
}

function adminTplSetCat(cat, btn) {
  _adminTplCatFilter = cat;
  document.querySelectorAll('#atpl-cat-tabs .pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _adminRenderTplSkills();
}

function _adminRenderTplSkills() {
  const el = document.getElementById('atpl-skills-grid');
  if (!el) return;

  if (!_adminTplSkills.length) {
    el.innerHTML = `<div class="empty-state" style="margin:24px 0"><h3>No skills yet</h3><p>Add skills using the form below.</p></div>`;
    return;
  }

  // Build category map
  const catOrder = [], catMap = {};
  _adminTplSkills.forEach((s, i) => {
    const c = s.category || 'General';
    if (!catMap[c]) { catMap[c] = []; catOrder.push(c); }
    catMap[c].push({ ...s, _idx: i });
  });

  const visCats = _adminTplCatFilter === 'all' ? catOrder : catOrder.filter(c => c === _adminTplCatFilter);

  // Summary bar
  const sumPills = catOrder.map(cat => {
    const cfg = (typeof RS_CAT_CFG !== 'undefined' && RS_CAT_CFG[cat]) || { color:'#64748b', bg:'#f8fafc' };
    return `<span class="prof-summary-pill" style="background:${cfg.bg};color:${cfg.color};cursor:pointer" onclick="adminTplSetCat('${esc(cat)}',null)">${esc(cat)}: <strong>${catMap[cat].length}</strong></span>`;
  }).join('');

  let html = `<div class="skills-summary-bar">
    <span class="skills-total">${_adminTplSkills.length} skill${_adminTplSkills.length!==1?'s':''} total</span>
    <div class="prof-summary-pills">${sumPills}</div>
  </div><div class="gap-categories">`;

  visCats.forEach(cat => {
    const cfg  = (typeof RS_CAT_CFG !== 'undefined' && RS_CAT_CFG[cat]) || { icon:'📋', color:'#64748b', bg:'#f8fafc' };
    const rows = catMap[cat].map(s => {
      const pc = (typeof PROF_CONFIG !== 'undefined' && PROF_CONFIG[s.level]) || { color:'#0d9488', bg:'#f0fdfa' };
      return `<div class="gap-table-row">
        <div class="gap-skill-name">${esc(s.name)}</div>
        <div><span style="font-size:11px;font-weight:600;color:${pc.color};background:${pc.bg};padding:2px 10px;border-radius:20px;white-space:nowrap">${esc(s.level||'Advanced')}</span></div>
        <div class="gap-status-cell" style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
          <button class="icon-btn" title="Edit" onclick="adminEditTplSkill(${s._idx})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn icon-btn-danger" title="Remove" onclick="adminRemoveTplSkill(${s._idx})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');
    html += `<div class="gap-cat-block">
      <div class="gap-cat-header" style="background:${cfg.bg};border-color:${cfg.color}30">
        <div class="gap-cat-title">
          <span class="gap-cat-icon">${cfg.icon||'📋'}</span>
          <span class="gap-cat-name" style="color:${cfg.color}">${esc(cat.toUpperCase())}</span>
          <span class="gap-cat-count badge badge-muted">${catMap[cat].length} skill${catMap[cat].length!==1?'s':''}</span>
        </div>
      </div>
      <div class="gap-cat-table">
        <div class="gap-table-head"><div>Required Skill</div><div>Level</div><div></div></div>
        ${rows}
      </div>
    </div>`;
  });

  html += '</div>';
  el.innerHTML = html;
}

// ── Template skill CRUD ───────────────────────────────────────────────
function adminAddTplSkill() {
  const nameEl  = document.getElementById('atpl-skill-input');
  const catEl   = document.getElementById('atpl-skill-cat');
  const levelEl = document.getElementById('atpl-skill-level');
  if (!nameEl || !_adminTplId) return;
  const cat   = catEl ? catEl.value.trim() || 'General' : 'General';
  const level = levelEl ? levelEl.value : 'Advanced';
  let added = false;
  nameEl.value.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
    if (!_adminTplSkills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      _adminTplSkills.push({ name, category: cat, level }); added = true;
    }
  });
  nameEl.value = '';
  if (added) { _adminSaveTplSkills(); _adminRenderTplCatTabs(); _adminRenderTplSkills(); }
}

function adminAddTplSkillKeydown(e) { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); adminAddTplSkill(); } }

function adminRemoveTplSkill(idx) {
  _adminTplSkills.splice(idx, 1);
  _adminSaveTplSkills(); _adminRenderTplCatTabs(); _adminRenderTplSkills();
}

function adminEditTplSkill(idx) {
  const s = _adminTplSkills[idx];
  if (!s) return;
  _adminEditSkillIdx = idx;
  document.getElementById('atse-name').value  = s.name;
  document.getElementById('atse-cat').value   = s.category || 'General';
  document.getElementById('atse-level').value = s.level || 'Advanced';
  document.getElementById('atse-error').textContent = '';
  document.getElementById('atpl-skill-edit-modal').classList.add('open');
  setTimeout(() => document.getElementById('atse-name').focus(), 60);
}

function closeAtplSkillEditModal() {
  document.getElementById('atpl-skill-edit-modal').classList.remove('open');
  _adminEditSkillIdx = -1;
}

function adminSaveTplSkillEdit() {
  const name  = document.getElementById('atse-name').value.trim();
  const errEl = document.getElementById('atse-error');
  if (!name) { errEl.textContent = 'Skill name is required.'; return; }
  if (_adminTplSkills.some((s, i) => i !== _adminEditSkillIdx && s.name.toLowerCase() === name.toLowerCase())) {
    errEl.textContent = `"${name}" already exists.`; return;
  }
  _adminTplSkills[_adminEditSkillIdx] = {
    name,
    category : document.getElementById('atse-cat').value.trim() || 'General',
    level    : document.getElementById('atse-level').value,
  };
  _adminSaveTplSkills();
  closeAtplSkillEditModal();
  _adminRenderTplCatTabs();
  _adminRenderTplSkills();
}

function _adminSaveTplSkills() {
  if (!_adminTplId || !_adminTpls) return;
  const tpl = _adminTpls.find(t => t.id === _adminTplId);
  if (tpl) tpl.requiredSkills = JSON.parse(JSON.stringify(_adminTplSkills));
  _adminPersistTemplates();
  // Update count in left list card
  _adminRenderTplList();
  // Update header count
  const hdr = document.getElementById('atpl-header');
  if (hdr) { const sp = hdr.querySelector('[data-skill-count]'); if (sp) sp.textContent = _adminTplSkills.length + ' required skills'; }
}

// ── Template metadata modal ───────────────────────────────────────────
function openTplModal(id) {
  const tpl   = id ? (_adminTpls || []).find(t => t.id === id) : null;
  const isNew = !tpl;

  document.getElementById('tpl-modal-title').textContent = isNew ? 'New Template' : 'Edit Template';
  document.getElementById('tpl-id').value          = tpl ? tpl.id    : '';
  document.getElementById('tpl-name').value        = tpl ? tpl.name  : '';
  document.getElementById('tpl-type').value        = tpl ? tpl.type  : 'Job Role';
  document.getElementById('tpl-icon').value        = tpl ? (tpl.icon || '') : '';
  document.getElementById('tpl-description').value = tpl ? (tpl.description || '') : '';
  document.getElementById('tpl-tags').value        = tpl ? (tpl.tags || []).join(', ') : '';
  document.getElementById('tpl-error').textContent = '';

  // Skills section — only for new templates
  const skillsSection = document.getElementById('tpl-skills-section');
  if (skillsSection) skillsSection.style.display = isNew ? '' : 'none';
  _tplModalSkills = [];
  document.getElementById('tpl-skill-input') && (document.getElementById('tpl-skill-input').value = '');
  _renderTplModalChips();

  document.getElementById('tpl-modal').classList.add('open');
  setTimeout(() => document.getElementById('tpl-name').focus(), 80);
}

function closeTplModal() { document.getElementById('tpl-modal').classList.remove('open'); }

// ── Template modal — skills staging ──────────────────────────────────
function _renderTplModalChips() {
  const c = document.getElementById('tpl-modal-chips');
  if (!c) return;
  c.innerHTML = _tplModalSkills.length === 0
    ? '<span style="font-size:12px;color:var(--muted2)">No skills added yet — use AI Suggest or type below</span>'
    : _tplModalSkills.map((s, i) => {
        const label = s.name + (s.level && s.level !== 'Advanced' ? ' (' + s.level + ')' : '');
        return `<span class="skill-chip skill-chip-removable" title="${esc(s.category||'General')}">${esc(label)}<button type="button" class="chip-remove" onclick="tplModalRemoveSkill(${i})">×</button></span>`;
      }).join('');
}

function tplModalAddSkill() {
  const inp = document.getElementById('tpl-skill-input');
  if (!inp) return;
  inp.value.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
    if (!_tplModalSkills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      _tplModalSkills.push({ name, category: 'General', level: 'Advanced' });
    }
  });
  inp.value = '';
  _renderTplModalChips();
}

function tplModalRemoveSkill(i) { _tplModalSkills.splice(i, 1); _renderTplModalChips(); }
function tplModalSkillKeydown(e) { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); tplModalAddSkill(); } }

async function tplSuggestSkills() {
  const name  = document.getElementById('tpl-name').value.trim();
  const type  = document.getElementById('tpl-type').value;
  const errEl = document.getElementById('tpl-error');
  if (!name) { errEl.textContent = 'Enter a template name first.'; return; }

  const btn = document.getElementById('tpl-ai-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Asking AI…'; }
  errEl.textContent = '';

  const r = await aiCall('suggest_skills', { goalName: name, goalType: type });

  if (btn) { btn.disabled = false; btn.textContent = 'AI Suggest'; }

  if (r.ok && Array.isArray(r.skills)) {
    let added = 0;
    r.skills.forEach(s => {
      const nm  = typeof s === 'string' ? s : s.name;
      const cat = typeof s === 'string' ? 'General' : (s.category || 'General');
      const lvl = typeof s === 'string' ? 'Advanced' : (s.level || 'Advanced');
      if (!_tplModalSkills.some(x => x.name.toLowerCase() === nm.toLowerCase())) {
        _tplModalSkills.push({ name: nm, category: cat, level: lvl }); added++;
      }
    });
    _renderTplModalChips();
    if (!added) errEl.textContent = 'All suggested skills already listed.';
  } else {
    errEl.textContent = r.error || 'AI suggestion failed. Check your API key.';
  }
}

// ── Main panel: AI Suggest for selected template ──────────────────────
async function adminTplSuggestSkills() {
  const tpl    = (_adminTpls || []).find(t => t.id === _adminTplId);
  if (!tpl) return;
  const statusEl = document.getElementById('atpl-ai-status');
  const btn      = document.getElementById('atpl-ai-btn');
  if (statusEl) statusEl.textContent = 'Asking AI for suggestions…';
  if (btn) btn.disabled = true;

  const r = await aiCall('suggest_skills', { goalName: tpl.name, goalType: tpl.type, description: tpl.description || '' });

  if (btn) btn.disabled = false;

  if (r.ok && Array.isArray(r.skills)) {
    let added = 0;
    r.skills.forEach(s => {
      const nm  = typeof s === 'string' ? s : s.name;
      const cat = typeof s === 'string' ? 'General' : (s.category || 'General');
      const lvl = typeof s === 'string' ? 'Advanced' : (s.level || 'Advanced');
      if (!_adminTplSkills.some(x => x.name.toLowerCase() === nm.toLowerCase())) {
        _adminTplSkills.push({ name: nm, category: cat, level: lvl }); added++;
      }
    });
    _adminSaveTplSkills(); _adminRenderTplCatTabs(); _adminRenderTplSkills();
    if (statusEl) statusEl.textContent = added > 0
      ? `Added ${added} skill${added > 1 ? 's' : ''}. Remove any that don't apply.`
      : 'All suggested skills already listed.';
  } else {
    if (statusEl) statusEl.textContent = r.error || 'AI suggestion failed.';
  }
}

async function saveTplModal() {
  const name  = document.getElementById('tpl-name').value.trim();
  const errEl = document.getElementById('tpl-error');
  if (!name) { errEl.textContent = 'Template name is required.'; return; }

  const id      = document.getElementById('tpl-id').value;
  const isNew   = !id;
  const newId   = isNew ? 'tpl_' + Date.now() : id;
  const tagsRaw = document.getElementById('tpl-tags').value;
  const tags    = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  await adminGetTemplates(); // ensure loaded

  if (isNew) {
    _adminTpls.push({
      id             : newId,
      name,
      type           : document.getElementById('tpl-type').value,
      icon           : document.getElementById('tpl-icon').value.trim() || '📋',
      description    : document.getElementById('tpl-description').value.trim(),
      tags,
      requiredSkills : JSON.parse(JSON.stringify(_tplModalSkills)),
    });
  } else {
    const tpl = _adminTpls.find(t => t.id === id);
    if (tpl) {
      tpl.name        = name;
      tpl.type        = document.getElementById('tpl-type').value;
      tpl.icon        = document.getElementById('tpl-icon').value.trim() || tpl.icon || '📋';
      tpl.description = document.getElementById('tpl-description').value.trim();
      tpl.tags        = tags;
    }
  }

  await _adminPersistTemplates();
  closeTplModal();
  _adminRenderTplList();
  if (isNew) adminSelectTpl(newId);
  else _adminShowTplContent(_adminTpls.find(t => t.id === id));
}

async function adminDeleteTpl(id) {
  const tpl = (_adminTpls || []).find(t => t.id === id);
  if (!confirm(`Delete template "${tpl ? tpl.name : id}"? This cannot be undone.`)) return;
  _adminTpls = (_adminTpls || []).filter(t => t.id !== id);
  await _adminPersistTemplates();
  if (_adminTplId === id) {
    _adminTplId = '';
    _adminTplSkills = [];
    _adminShowTplContent(null);
  }
  _adminRenderTplList();
}

// ══════════════════════════════════════════════════════════════════════
// USERS PANEL
// ══════════════════════════════════════════════════════════════════════
async function adminUsersRender() {
  if (!_adminGuard()) return;
  const el = document.getElementById('admin-users-content');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--muted);font-size:13px">Loading users…</p>';

  if (IS_LOCAL) {
    const users = JSON.parse(localStorage.getItem('st-users') || '[]');
    _adminShowUserTable(el, users.map(u => ({
      name: u.name, email: u.email, uid: u.uid, role: u.role || 'webuser', createdAt: u.createdAt
    })));
    return;
  }
  try {
    const res  = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'list_users' }) });
    const data = await res.json();
    if (data.ok && data.data && data.data.users) {
      _adminShowUserTable(el, data.data.users);
    } else {
      el.innerHTML = `<p style="color:var(--red);font-size:13px">${esc(data.error || 'Failed to load users.')}</p>`;
    }
  } catch { el.innerHTML = '<p style="color:var(--red);font-size:13px">Error connecting to admin API.</p>'; }
}

// stores users list for edit modal lookup
let _adminUsersCache = [];

function _adminShowUserTable(el, users) {
  _adminUsersCache = users;
  if (!users.length) {
    el.innerHTML = '<div class="empty-state"><h3>No users yet</h3><p>No registrations found.</p></div>';
    return;
  }
  const rows = users.map(u => {
    const role = u.role || 'webuser';
    const rcfg = ROLE_CFG[role] || ROLE_CFG.webuser;
    return `<tr class="admin-user-tr" style="cursor:pointer" onclick="adminOpenUserProfile('${esc(u.uid)}')">
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="admin-user-avatar">${(u.name||u.email||'?').charAt(0).toUpperCase()}</div>
          <div>
            <div class="admin-user-name">${esc(u.name||'—')}</div>
            <div class="admin-user-email">${esc(u.email||u.uid||'—')}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="admin-role-badge" style="border-color:${rcfg.color};color:${rcfg.color};background:${rcfg.bg}">${rcfg.label}</span>
      </td>
      <td class="admin-user-date">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
      <td style="white-space:nowrap" onclick="event.stopPropagation()">
        <button class="icon-btn icon-btn-danger" title="Delete user" onclick="adminDeleteUser('${esc(u.uid)}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div style="font-size:13px;color:var(--muted);margin-bottom:14px">
      ${users.length} registered user${users.length!==1?'s':''}
    </div>
    <div class="admin-user-table-wrap">
      <table class="admin-user-table">
        <thead><tr class="admin-user-head">
          <th>User</th><th>Role</th><th>Registered</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Admin: User Profile Modal (combined name + role + password) ──────
function adminOpenUserProfile(uid) {
  const u = _adminUsersCache.find(x => x.uid === uid);
  if (!u) return;
  document.getElementById('aup-uid').value     = u.uid;
  document.getElementById('aup-email').value   = u.email || u.uid || '';
  document.getElementById('aup-name').value    = u.name || '';
  const roleEl = document.getElementById('aup-role');
  roleEl.value = u.role || 'webuser';
  _adminUpdateRoleSelect(roleEl);
  document.getElementById('aup-info-error').textContent   = '';
  document.getElementById('aup-info-success').textContent = '';
  document.getElementById('aup-pwd-new').value     = '';
  document.getElementById('aup-pwd-confirm').value = '';
  document.getElementById('aup-pwd-error').textContent   = '';
  document.getElementById('aup-pwd-success').textContent = '';
  document.getElementById('admin-user-profile-modal').classList.add('open');
  setTimeout(() => document.getElementById('aup-name').focus(), 80);
}

function adminCloseUserProfile() {
  document.getElementById('admin-user-profile-modal').classList.remove('open');
}

function _adminUpdateRoleSelect(sel) {
  const rcfg = ROLE_CFG[sel.value] || ROLE_CFG.webuser;
  sel.style.borderColor = rcfg.color;
  sel.style.color       = rcfg.color;
  sel.style.background  = rcfg.bg;
}

async function adminSaveUserInfo() {
  const uid   = document.getElementById('aup-uid').value;
  const name  = document.getElementById('aup-name').value.trim();
  const role  = document.getElementById('aup-role').value;
  const errEl = document.getElementById('aup-info-error');
  const okEl  = document.getElementById('aup-info-success');
  errEl.textContent = ''; okEl.textContent = '';
  if (!name) { errEl.textContent = 'Name is required.'; return; }

  if (IS_LOCAL) {
    const users = JSON.parse(localStorage.getItem('st-users') || '[]');
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) { users[idx].name = name; users[idx].role = role; }
    localStorage.setItem('st-users', JSON.stringify(users));
    okEl.textContent = 'Saved!';
    adminUsersRender();
    return;
  }

  try {
    const res  = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'update_user', uid, name, role }) });
    const data = await res.json();
    if (data.ok) { okEl.textContent = 'Saved!'; adminUsersRender(); }
    else { errEl.textContent = data.error || 'Save failed.'; }
  } catch { errEl.textContent = 'Connection error.'; }
}

async function adminSaveUserPwd() {
  const uid     = document.getElementById('aup-uid').value;
  const newPwd  = document.getElementById('aup-pwd-new').value;
  const confirm = document.getElementById('aup-pwd-confirm').value;
  const errEl   = document.getElementById('aup-pwd-error');
  const okEl    = document.getElementById('aup-pwd-success');
  errEl.textContent = ''; okEl.textContent = '';

  if (newPwd.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }
  if (newPwd !== confirm) { errEl.textContent = 'Passwords do not match.'; return; }

  if (IS_LOCAL) {
    const users = JSON.parse(localStorage.getItem('st-users') || '[]');
    const user  = users.find(u => u.uid === uid);
    if (!user) { errEl.textContent = 'User not found (uid: ' + uid + '). Users: ' + users.map(u=>u.uid).join(', '); return; }
    user.password = newPwd.trim();
    localStorage.setItem('st-users', JSON.stringify(users));
    // Verify save
    const verify = JSON.parse(localStorage.getItem('st-users') || '[]').find(u => u.uid === uid);
    document.getElementById('aup-pwd-new').value     = '';
    document.getElementById('aup-pwd-confirm').value = '';
    okEl.textContent = verify && verify.password === newPwd.trim()
      ? 'Password updated! New password is active.'
      : 'Warning: save may have failed.';
    return;
  }

  try {
    const res  = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'reset_user_password', uid, newPassword: newPwd }) });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('aup-pwd-new').value     = '';
      document.getElementById('aup-pwd-confirm').value = '';
      okEl.textContent = 'Password reset!';
    } else { errEl.textContent = data.error || 'Reset failed.'; }
  } catch { errEl.textContent = 'Connection error.'; }
}

async function adminDeleteUser(uid) {
  const u = _adminUsersCache.find(x => x.uid === uid);
  if (!u) return;
  const label = u.name || u.email || u.uid;
  if (!confirm(`Delete user "${label}"?\n\nThe user data will be moved to a deleted-users archive.`)) return;
  if (IS_LOCAL) {
    // Archive user data to st-deleted-users
    const deleted = JSON.parse(localStorage.getItem('st-deleted-users') || '[]');
    const archive = { ...u, deletedAt: new Date().toISOString(), data: {} };
    // Collect all user data from localStorage
    const prefix = 'st-' + u.uid + '-';
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(prefix)) {
        try { archive.data[k.replace(prefix, '')] = JSON.parse(localStorage.getItem(k)); } catch(e) { archive.data[k.replace(prefix, '')] = localStorage.getItem(k); }
        localStorage.removeItem(k);
      }
    });
    deleted.push(archive);
    localStorage.setItem('st-deleted-users', JSON.stringify(deleted));
    // Remove from users list
    const users = JSON.parse(localStorage.getItem('st-users') || '[]').filter(x => x.uid !== u.uid);
    localStorage.setItem('st-users', JSON.stringify(users));
    adminUsersRender();
    return;
  }
  try {
    const res  = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete_user', uid: u.uid }) });
    const data = await res.json();
    if (data.ok) {
      adminUsersRender();
    } else { alert('Delete failed: ' + (data.error || 'Unknown error')); }
  } catch { alert('Error deleting user.'); }
}

// ══════════════════════════════════════════════════════════════════════
// PARAMETERS PANEL
// ══════════════════════════════════════════════════════════════════════
async function adminParamsRender() {
  if (!_adminGuard()) return;
  const el = document.getElementById('admin-params-container');
  if (!el) return;

  // Load users for the dropdown
  let users = [];
  if (IS_LOCAL) {
    users = JSON.parse(localStorage.getItem('st-users') || '[]');
  } else {
    try {
      const res = await fetch('api/admin.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'list_users' }) });
      const data = await res.json();
      if (data.ok && data.data && data.data.users) users = data.data.users;
    } catch {}
  }

  const currentWorkAs = window._workAsUid || '';
  const curUser = window._currentUser || {};

  el.innerHTML = `
    <div style="max-width:700px">
      <h3 style="font-size:15px;font-weight:700;color:var(--text);margin:0 0 16px">User Impersonation</h3>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:20px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <label style="font-size:13px;font-weight:600;color:var(--text);min-width:120px">Work as User:</label>
          <select id="param-work-as" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--card-bg)" onchange="adminSetWorkAsUser(this.value)">
            <option value="">— Self (${esc(curUser.name || curUser.email || '')}) —</option>
            ${users.filter(u => u.uid !== curUser.uid && u.email !== curUser.email).map(u =>
              `<option value="${esc(u.uid)}"${u.uid === currentWorkAs ? ' selected' : ''}>${esc(u.name || '—')} (${esc(u.email || u.uid)})</option>`
            ).join('')}
          </select>
        </div>
        ${currentWorkAs ? `
          <div style="margin-top:12px;padding:10px 14px;background:#f59e0b15;border:1px solid #f59e0b30;border-radius:8px;font-size:12px;color:#92400e">
            <strong>Active:</strong> You are currently working as <strong>${esc(currentWorkAs)}</strong>.
            All data operations (read/write) target this user's data.
            <a href="#" onclick="adminClearWorkAs(); return false;" style="margin-left:8px;color:#b45309;text-decoration:underline">Stop impersonation</a>
          </div>` : `
          <div style="margin-top:12px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--muted)">
            Select a user to view and manage their data (goals, skills, jobs, etc.) as if you were logged in as that user.
          </div>`}
      </div>

      <h3 style="font-size:15px;font-weight:700;color:var(--text);margin:24px 0 16px">Global Parameters</h3>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:20px">
        <p style="font-size:13px;color:var(--muted)">No additional parameters configured. Parameters will appear here as they are added.</p>
      </div>
    </div>`;
}

async function adminSetWorkAsUser(uid) {
  if (!uid) {
    adminClearWorkAs();
    return;
  }
  window._workAsUid = uid;
  // Find user name from cache
  const u = _adminUsersCache.find(x => x.uid === uid);
  const displayName = u ? (u.name || u.email || uid) : uid;
  // Update sidebar banner
  const banner = document.getElementById('work-as-banner');
  const label = document.getElementById('work-as-label');
  if (banner) banner.style.display = '';
  if (label) label.textContent = displayName;
  // Save admin's own info before switching
  window._adminRealUser = window._adminRealUser || {
    name: window._currentUser?.name || '',
    email: window._currentUser?.email || window._currentUser?.uid || '',
    uid: window._currentUser?.uid || ''
  };
  // Reload all data for the target user
  await stInit();
  // Re-render all panels
  if (typeof dashboardRender === 'function') dashboardRender();
  if (typeof goalsRender === 'function') goalsRender();
  if (typeof skillsRender === 'function') skillsRender();
  if (typeof jobsRender === 'function') jobsRender();
  // Force restore admin sidebar after all async renders settle
  _restoreAdminSidebar();
  setTimeout(_restoreAdminSidebar, 200);
  setTimeout(_restoreAdminSidebar, 500);
  stLog('admin_work_as', 'Started working as: ' + uid);
}

function _restoreAdminSidebar() {
  const admin = window._adminRealUser;
  if (!admin) return;
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) nameEl.textContent = admin.name || admin.email;
  if (emailEl) emailEl.textContent = admin.email;
  if (avatarEl) avatarEl.textContent = (admin.name || admin.email || '?').charAt(0).toUpperCase();
}

function adminClearWorkAs() {
  window._workAsUid = null;
  // Hide banner
  const banner = document.getElementById('work-as-banner');
  if (banner) banner.style.display = 'none';
  // Reload own data
  stInit().then(() => {
    if (typeof dashboardRender === 'function') dashboardRender();
    if (typeof goalsRender === 'function') goalsRender();
    if (typeof skillsRender === 'function') skillsRender();
    if (typeof jobsRender === 'function') jobsRender();
    // Restore admin sidebar after re-renders
    _restoreAdminSidebar();
  });
  // Re-render params if on that panel
  const paramsSel = document.getElementById('param-work-as');
  if (paramsSel) paramsSel.value = '';
  stLog('admin_work_as', 'Stopped impersonation');
}

// ══════════════════════════════════════════════════════════════════════
// DOCUMENTATION PANELS — User Guide & Functional Spec
// ══════════════════════════════════════════════════════════════════════
let _docCache = {};

// Simple markdown to HTML (handles headers, lists, bold, code, tables, links)
function _mdToHtml(md) {
  let html = esc(md);
  // Code blocks first (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#f1f5f9;padding:12px;border-radius:6px;overflow-x:auto;font-size:12px;line-height:1.5"><code>$2</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;font-weight:700;margin:18px 0 8px;color:var(--text)">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:22px 0 10px;color:var(--text);border-bottom:1px solid var(--border);padding-bottom:6px">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:28px 0 12px;color:var(--primary)">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:800;margin:0 0 16px;color:var(--text)">$1</h1>');
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Tables (simple)
  html = html.replace(/^\|(.+)\|$/gm, (m, row) => {
    const cells = row.split('|').map(c => c.trim());
    if (cells.every(c => /^[-:]+$/.test(c))) return ''; // separator row
    const tag = cells.length ? 'td' : 'td';
    return '<tr>' + cells.map(c => `<${tag} style="padding:4px 10px;border:1px solid #e2e8f0;font-size:12px">${c}</${tag}>`).join('') + '</tr>';
  });
  html = html.replace(/((<tr>.*<\/tr>\s*)+)/g, '<table style="border-collapse:collapse;margin:8px 0;width:100%">$1</table>');
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin:2px 0;font-size:13px">$1</li>');
  html = html.replace(/((<li.*<\/li>\s*)+)/g, '<ul style="padding-left:20px;margin:6px 0">$1</ul>');
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;font-size:13px">$1</li>');
  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p style="margin:8px 0;font-size:13px;color:var(--text2)">');
  html = '<p style="margin:8px 0;font-size:13px;color:var(--text2)">' + html + '</p>';
  // Clean empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  return html;
}

async function _loadDoc(name) {
  if (_docCache[name]) return _docCache[name];
  const file = name === 'userguide' ? 'USER-GUIDE.md' : 'FUNCTIONAL-SPEC.md';
  try {
    const res = await fetch(file + '?v=' + Date.now());
    if (res.ok) {
      const md = await res.text();
      _docCache[name] = md;
      return md;
    }
  } catch {}
  return null;
}

async function adminRenderUserGuide() {
  const el = document.getElementById('admin-userguide-content');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--muted)">Loading user guide…</p>';
  const md = await _loadDoc('userguide');
  if (md) {
    el.innerHTML = _mdToHtml(md);
  } else {
    el.innerHTML = '<p style="color:#dc2626">User Guide file not found. Deploy USER-GUIDE.md to the server.</p>';
  }
}

async function adminRenderFuncSpec() {
  const el = document.getElementById('admin-funcspec-content');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--muted)">Loading functional specification…</p>';
  const md = await _loadDoc('funcspec');
  if (md) {
    el.innerHTML = _mdToHtml(md);
  } else {
    el.innerHTML = '<p style="color:#dc2626">Functional Spec file not found. Deploy FUNCTIONAL-SPEC.md to the server.</p>';
  }
}

function adminDownloadDoc(type) {
  const el = document.getElementById(type === 'userguide' ? 'admin-userguide-content' : 'admin-funcspec-content');
  if (!el) return;
  const title = type === 'userguide' ? 'SkillTrack User Guide' : 'SkillTrack Functional Specification';
  const htmlDoc = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1e293b; line-height: 1.7; }
  h1 { font-size: 24px; border-bottom: 2px solid #0d9488; padding-bottom: 8px; color: #0d9488; }
  h2 { font-size: 20px; color: #0d9488; margin-top: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  h3 { font-size: 16px; margin-top: 24px; }
  h4 { font-size: 14px; margin-top: 18px; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 13px; }
  pre { background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
  table { border-collapse: collapse; margin: 10px 0; width: 100%; }
  td, th { padding: 6px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
  ul, ol { padding-left: 24px; }
  li { margin: 3px 0; font-size: 13px; }
  strong { color: #0f172a; }
  @media print { body { max-width: 100%; padding: 20px; } }
</style></head><body>${el.innerHTML}</body></html>`;
  const blob = new Blob([htmlDoc], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (type === 'userguide' ? 'SkillTrack-User-Guide' : 'SkillTrack-Functional-Spec') + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
}
