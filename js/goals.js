/* ──────────────────────────────────────────
   SkillTrack — Goals Module
────────────────────────────────────────── */
'use strict';

const GOAL_TYPE_META = {
  'Job Role'          : { emoji: '💼', cls: 'goal-type-jobrole'  },
  'Certification'     : { emoji: '🏅', cls: 'goal-type-cert'     },
  'Personal Learning' : { emoji: '📚', cls: 'goal-type-learning' },
  'Other'             : { emoji: '⭐', cls: 'goal-type-other'    }
};
const PRIORITY_CLS = { 'Primary':'badge-primary', 'Active':'badge-green', 'On Hold':'badge-muted' };

let _goalTypeFilter     = 'all';
let _goalPriorityFilter = 'all';
let _goalModalSkills    = [];   // array of name strings (for chip display)
let _goalModalSkillsFull = [];  // array of {name,category,level} when from template

// ── Render ─────────────────────────────────────────────────────────
function goalsRender() {
  const goals    = stRead('goals');
  const list     = document.getElementById('goals-list');
  if (!list) return;

  const filtered = goals.filter(g => {
    const okType = _goalTypeFilter === 'all' || g.type === _goalTypeFilter;
    const okPri  = _goalPriorityFilter === 'all' || g.priority === _goalPriorityFilter;
    return okType && okPri;
  });

  const statEl = document.getElementById('stat-goals');
  if (statEl) statEl.textContent = goals.filter(g => g.priority !== 'On Hold').length;

  if (filtered.length === 0) {
    const isEmpty = goals.length === 0;
    list.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
      <h3>${isEmpty ? 'No goals yet' : 'No matching goals'}</h3>
      <p>${isEmpty ? 'Create your first goal to get started.' : 'Try a different filter.'}</p>
      ${isEmpty ? `<button class="btn btn-primary" onclick="openGoalChoiceModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New Goal</button>` : ''}
    </div>`;
    return;
  }
  list.innerHTML = '<div class="goals-grid">' + filtered.map(_goalCard).join('') + '</div>';
  _populateGoalSelects();
}

function _goalCard(g) {
  const meta  = GOAL_TYPE_META[g.type] || GOAL_TYPE_META['Other'];
  const skills = g.requiredSkills || [];
  const sc     = skills.length;
  return `<div class="goal-card">
    <div class="goal-card-header">
      <div class="goal-card-title-row" onclick="openGoalModal('${g.id}')">
        <div class="goal-type-icon ${meta.cls}">${meta.emoji}</div>
        <div class="goal-title-block">
          <div class="goal-name">${esc(g.name)}</div>
          <div class="goal-badges">
            <span class="badge badge-muted">${esc(g.type)}</span>
            <span class="badge ${PRIORITY_CLS[g.priority]||'badge-muted'}">${esc(g.priority)}</span>
          </div>
        </div>
      </div>
      <div class="goal-card-actions">
        <button class="icon-btn" title="Edit" onclick="openGoalModal('${g.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn icon-btn-danger" title="Delete" onclick="goalsDelete('${g.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
    ${g.description ? `<p class="goal-desc" onclick="openGoalModal('${g.id}')">${esc(g.description)}</p>` : ''}
    <div class="goal-footer" onclick="openGoalModal('${g.id}')">
      <div class="goal-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${sc} skill${sc!==1?'s':''} required</div>
      <div class="goal-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${fmtDate(g.targetDate)}</div>
    </div>
    ${sc>0?`<div class="goal-skills">${skills.slice(0,6).map(s=>`<span class="skill-chip">${esc(typeof s==='string'?s:s.name)}</span>`).join('')}${sc>6?`<span class="skill-chip skill-chip-more">+${sc-6}</span>`:''}</div>`:''}
  </div>`;
}

// ── Populate goal dropdowns used by other modules ──────────────────
function _populateGoalSelects() {
  // Goal selects in job modal (jm-goal) and session modal (sess-goal)
  // are populated inline in their respective open functions.
  // This is kept as a hook for future goal-select elements.
}

// ── Delete ─────────────────────────────────────────────────────────
function goalsDelete(id) {
  const g = stRead('goals').find(x=>x.id===id);
  if (!confirm('Delete goal "' + (g?g.name:'this goal') + '"?')) return;
  stDelete('goals', id);
  stLog('goal_deleted', 'Deleted goal: ' + (g?g.name:''));
  goalsRender();
}

// ── Modal ──────────────────────────────────────────────────────────
function openGoalModal(id, _tplData) {
  const goals = stRead('goals');
  const goal  = id ? goals.find(g=>g.id===id) : null;
  _goalModalSkillsFull = [];
  if (_tplData) {
    // Pre-fill from template — keep full {name,category,level} objects
    _goalModalSkillsFull = (_tplData.requiredSkills || []).map(s =>
      typeof s === 'string' ? { name: s, category: 'General', level: 'Advanced' } : s
    );
    _goalModalSkills = _goalModalSkillsFull.map(s => s.name);
  } else {
    _goalModalSkills = goal ? (goal.requiredSkills||[]).map(s => typeof s==='string' ? s : s.name) : [];
  }

  const titleSuffix = _tplData ? ' (from template)' : '';
  document.getElementById('goal-modal-title').textContent = goal ? 'Edit Goal' : ('New Goal' + titleSuffix);
  document.getElementById('gm-id').value          = goal ? goal.id : '';
  document.getElementById('gm-name').value        = _tplData ? _tplData.name : (goal ? goal.name : '');
  document.getElementById('gm-type').value        = _tplData ? _tplData.type : (goal ? goal.type : 'Job Role');
  document.getElementById('gm-priority').value    = goal ? goal.priority : 'Primary';
  document.getElementById('gm-target').value      = goal ? (goal.targetDate||'') : '';
  document.getElementById('gm-description').value = _tplData ? (_tplData.description||'') : (goal ? (goal.description||'') : '');
  document.getElementById('gm-notes').value       = goal ? (goal.notes||'') : '';
  document.getElementById('gm-skill-input').value = '';
  document.getElementById('gm-error').textContent = '';
  _renderGoalChips();

  document.getElementById('goal-modal').classList.add('open');
  setTimeout(() => document.getElementById('gm-name').focus(), 80);
}
function closeGoalModal() { document.getElementById('goal-modal').classList.remove('open'); }

function _renderGoalChips() {
  const c = document.getElementById('gm-skills-chips');
  if (!c) return;
  c.innerHTML = _goalModalSkills.length === 0
    ? '<span style="font-size:12px;color:var(--muted2)">No skills added yet</span>'
    : _goalModalSkills.map((s,i) => `<span class="skill-chip skill-chip-removable">${esc(s)}<button type="button" class="chip-remove" onclick="goalsRemoveSkill(${i})">×</button></span>`).join('');
}
function goalsAddSkill() {
  const input = document.getElementById('gm-skill-input');
  input.value.split(',').map(s=>s.trim()).filter(Boolean).forEach(s => {
    if (!_goalModalSkills.includes(s)) _goalModalSkills.push(s);
  });
  input.value = '';
  _renderGoalChips();
}
function goalsRemoveSkill(i) { _goalModalSkills.splice(i,1); _renderGoalChips(); }
function goalsSkillKeydown(e) { if (e.key==='Enter'||e.key===',') { e.preventDefault(); goalsAddSkill(); } }

async function goalsSuggestSkills() {
  const name = document.getElementById('gm-name').value.trim();
  const type = document.getElementById('gm-type').value;
  const errEl = document.getElementById('gm-error');
  if (!name) { errEl.textContent = 'Enter a goal name first.'; return; }
  errEl.textContent = 'Asking AI for suggestions…';
  const r = await aiCall('suggest_skills', { goalName: name, goalType: type });
  if (r.ok && Array.isArray(r.skills)) {
    r.skills.forEach(s => { const nm = typeof s==='string' ? s : s.name; if (!_goalModalSkills.includes(nm)) _goalModalSkills.push(nm); });
    _renderGoalChips();
    errEl.textContent = '';
  } else {
    errEl.textContent = r.error || 'AI suggestion failed.';
  }
}

function goalsSaveForm() {
  const name  = document.getElementById('gm-name').value.trim();
  const errEl = document.getElementById('gm-error');
  if (!name) { errEl.textContent = 'Goal name is required.'; document.getElementById('gm-name').focus(); return; }
  errEl.textContent = '';
  const goals = stRead('goals');
  const id    = document.getElementById('gm-id').value;
  const isNew = !id;
  const existing = isNew ? null : goals.find(g=>g.id===id);
  const goal = {
    id          : id || ('g_' + Date.now()),
    name,
    type        : document.getElementById('gm-type').value,
    priority    : document.getElementById('gm-priority').value,
    targetDate  : document.getElementById('gm-target').value,
    description : document.getElementById('gm-description').value.trim(),
    requiredSkills : _goalModalSkillsFull.length ? [..._goalModalSkillsFull] : [..._goalModalSkills],
    notes       : document.getElementById('gm-notes').value.trim(),
    createdAt   : existing ? existing.createdAt : new Date().toISOString()
  };
  stUpsert('goals', goal);
  stLog('goal_' + (isNew?'added':'updated'), (isNew?'Added':'Updated') + ' goal: ' + name);
  closeGoalModal();
  goalsRender();
  if (typeof dashboardRender === 'function') dashboardRender();
}

// ── Filters ────────────────────────────────────────────────────────
function _goalsInitFilters() {
  document.querySelectorAll('#goal-type-filter .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#goal-type-filter .pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); _goalTypeFilter = btn.dataset.filter; goalsRender();
    });
  });
  document.querySelectorAll('#goal-priority-filter .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#goal-priority-filter .pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); _goalPriorityFilter = btn.dataset.filter; goalsRender();
    });
  });
}

// ── Goal Choice Modal (New Goal entry point) ───────────────────────
function openGoalChoiceModal() {
  document.getElementById('gcm-step-choice').style.display    = '';
  document.getElementById('gcm-step-templates').style.display = 'none';
  document.getElementById('goal-choice-modal').classList.add('open');
}
function closeGoalChoiceModal() {
  document.getElementById('goal-choice-modal').classList.remove('open');
}
function gcmGoScratch() {
  closeGoalChoiceModal();
  openGoalModal();
}
function gcmGoTemplates() {
  document.getElementById('gcm-step-choice').style.display    = 'none';
  document.getElementById('gcm-step-templates').style.display = '';
  _gcmRenderTemplates();
}
function gcmBackToChoice() {
  document.getElementById('gcm-step-choice').style.display    = '';
  document.getElementById('gcm-step-templates').style.display = 'none';
}
async function gcmUseTemplate(tplId) {
  // Search admin templates first (includes user-created ones), then fall back to built-in
  const templates = (typeof adminGetTemplates === 'function') ? await adminGetTemplates()
                  : (typeof COMMON_GOALS !== 'undefined' ? COMMON_GOALS : []);
  const tpl = templates.find(t => t.id === tplId);
  if (!tpl) return;
  closeGoalChoiceModal();
  openGoalModal(null, tpl);
}

async function _gcmRenderTemplates() {
  const el = document.getElementById('gcm-template-list');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">Loading templates…</p>';
  const templates = (typeof adminGetTemplates === 'function') ? await adminGetTemplates(true)
                  : (typeof COMMON_GOALS !== 'undefined' ? COMMON_GOALS : []);
  if (!templates.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:14px;text-align:center;padding:32px">No templates available.</p>';
    return;
  }
  el.innerHTML = templates.map(t => {
    const catCounts = {};
    (t.requiredSkills || []).forEach(s => {
      const c = (typeof s === 'string' ? 'General' : s.category) || 'General';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    const catPills = Object.entries(catCounts).slice(0, 4).map(([c, n]) =>
      `<span class="badge badge-muted" style="font-size:10px">${esc(c)} (${n})</span>`
    ).join('');
    const more = Object.keys(catCounts).length > 4
      ? `<span class="badge badge-muted" style="font-size:10px">+${Object.keys(catCounts).length - 4} more</span>` : '';
    const totalSkills = (t.requiredSkills || []).length;
    const typeMeta = (typeof GOAL_TYPE_META !== 'undefined' && GOAL_TYPE_META[t.type]) || { emoji: '⭐' };
    return `<div class="tpl-card">
      <div class="tpl-card-icon">${t.icon || typeMeta.emoji}</div>
      <div class="tpl-card-body">
        <div class="tpl-card-name">${esc(t.name)}</div>
        <div class="tpl-card-meta">
          <span class="badge badge-muted">${esc(t.type)}</span>
          <span style="font-size:12px;color:var(--muted)">${totalSkills} required skills</span>
        </div>
        <div class="tpl-card-desc">${esc(t.description || '')}</div>
        <div class="tpl-card-cats">${catPills}${more}</div>
      </div>
      <div style="flex-shrink:0;align-self:center">
        <button class="btn btn-primary btn-sm" onclick="gcmUseTemplate('${esc(t.id)}')">Use Template</button>
      </div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => { _goalsInitFilters(); goalsRender(); });
