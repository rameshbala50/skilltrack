/* ──────────────────────────────────────────
   SkillTrack — Gap Analysis Module
   Groups required skills by category, table layout per category
────────────────────────────────────────── */
'use strict';

// Category display config: icon + colour theme
const GAP_CAT_CFG = {
  // ── Snowflake Architect specific categories ──
  'Snowflake Core Expertise':       { icon:'❄️',  color:'#06b6d4', bg:'#ecfeff' },
  'Cloud Platform Knowledge':       { icon:'☁️',  color:'#0369a1', bg:'#f0f9ff' },
  'Data Engineering Skills':        { icon:'⚙️',  color:'#d97706', bg:'#fffbeb' },
  'SQL & Query Optimization':       { icon:'🔍',  color:'#059669', bg:'#f0fdf4' },
  'Data Governance & Security':     { icon:'🛡️', color:'#dc2626', bg:'#fef2f2' },
  'Architecture & Design Skills':   { icon:'🏗️', color:'#7c3aed', bg:'#f5f3ff' },
  'DevOps & Automation':            { icon:'🔧',  color:'#64748b', bg:'#f8fafc' },
  'BI & Analytics Integration':     { icon:'📊',  color:'#7c3aed', bg:'#faf5ff' },
  'Monitoring & Cost Optimization':  { icon:'⚡',  color:'#d97706', bg:'#fffbeb' },
  'Soft Skills':                    { icon:'🤝',  color:'#0d9488', bg:'#f0fdfa' },
  'Bonus Skills':                   { icon:'⭐',  color:'#b45309', bg:'#fef3c7' },
  // ── Generic / legacy categories ──
  'Snowflake Platform (Core)':      { icon:'❄️',  color:'#06b6d4', bg:'#ecfeff' },
  'Data Architecture & Modeling':   { icon:'🏗️', color:'#7c3aed', bg:'#f5f3ff' },
  'Security & RBAC':                { icon:'🔐',  color:'#dc2626', bg:'#fef2f2' },
  'Data Engineering & ETL':         { icon:'⚙️',  color:'#d97706', bg:'#fffbeb' },
  'Cloud Platforms':                { icon:'☁️',  color:'#0369a1', bg:'#f0f9ff' },
  'Programming & Query Languages':  { icon:'💻',  color:'#059669', bg:'#f0fdf4' },
  'BI & Analytics':                 { icon:'📊',  color:'#7c3aed', bg:'#faf5ff' },
  'AI / ML & Cortex':               { icon:'🤖',  color:'#0d9488', bg:'#f0fdfa' },
  'DevOps & CI/CD':                 { icon:'🔧',  color:'#64748b', bg:'#f8fafc' },
  'Performance Optimization':       { icon:'⚡',  color:'#d97706', bg:'#fffbeb' },
  'Architecture & Design':          { icon:'🏗️', color:'#7c3aed', bg:'#f5f3ff' },
  'Certifications':                 { icon:'🏅',  color:'#b45309', bg:'#fef3c7' },
  'General':                        { icon:'📋',  color:'#64748b', bg:'#f8fafc' }
};
function _catCfg(cat) {
  return GAP_CAT_CFG[cat] || { icon:'📋', color:'#64748b', bg:'#f8fafc' };
}

// Proficiency rank for level comparison
const PROF_RANK = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2, 'Expert': 3 };

// Normalise requiredSkills: supports string[], {name,category}[], and {name,category,level}[]
function _normRequired(arr) {
  return (arr || []).map(s => typeof s === 'string'
    ? { name: s, category: 'General', level: 'Advanced' }
    : { level: 'Advanced', ...s });
}

// ── State ──────────────────────────────────────────────────────────
let _gapGoalId       = '';
let _gapRequiredSkills = []; // [{name,category,level}] — for gapAddSkill lookup

// Category → Skill Group mapping (covers all built-in templates + common gap categories)
const _GAP_CAT_TO_GROUP = {
  // Cloud & Data Platforms
  'Snowflake Platform (Core)'       : 'Cloud & Data Platforms',
  'Snowflake Core Expertise'        : 'Cloud & Data Platforms',
  'Cloud Platforms'                 : 'Cloud & Data Platforms',
  'Cloud Platform Knowledge'        : 'Cloud & Data Platforms',
  'Cloud AI Platforms'              : 'Cloud & Data Platforms',
  // Data Engineering
  'Data Engineering'                : 'Data Engineering',
  'Data Engineering Skills'         : 'Data Engineering',
  'Data Engineering & ETL'          : 'Data Engineering',
  'Data Engineering for AI'         : 'Data Engineering',
  // Programming
  'Programming'                     : 'Programming',
  'Programming & Query Languages'   : 'Programming',
  'Programming & Data'              : 'Programming',
  'SQL & Query Optimization'        : 'Programming',
  // AI/ML
  'AI/ML'                           : 'AI/ML',
  'AI / ML & Cortex'                : 'AI/ML',
  'Core AI / ML'                    : 'AI/ML',
  'Core ML Algorithms'              : 'AI/ML',
  'Deep Learning'                   : 'AI/ML',
  'Deep Learning & Neural Networks' : 'AI/ML',
  'LLM & Generative AI'             : 'AI/ML',
  'ML Frameworks & Libraries'       : 'AI/ML',
  'Mathematics & Statistics'        : 'AI/ML',
  // Visualization & BI
  'BI & Analytics'                  : 'Visualization & BI',
  'BI & Analytics Integration'      : 'Visualization & BI',
  // DevOps & CI/CD
  'DevOps & CI/CD'                  : 'DevOps & CI/CD',
  'DevOps & Automation'             : 'DevOps & CI/CD',
  'MLOps & Deployment'              : 'DevOps & CI/CD',
  'MLOps & Production'              : 'DevOps & CI/CD',
  // Architecture & Design
  'Architecture & Design'           : 'Architecture & Design',
  'Architecture & Design Skills'    : 'Architecture & Design',
  'Data Architecture & Modeling'    : 'Architecture & Design',
  'Security & RBAC'                 : 'Architecture & Design',
  'Data Governance & Security'      : 'Architecture & Design',
  'Performance Optimization'        : 'Architecture & Design',
  'Monitoring & Cost Optimization'  : 'Architecture & Design',
  // Soft Skills
  'Soft Skills'                     : 'Soft Skills',
  'AI Safety & Ethics'              : 'Soft Skills',
};

function gapRender() {
  const goals = stRead('goals');
  const el    = document.getElementById('gap-goal-cards');
  if (!el) return;
  if (!goals.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--muted)">No goals yet. <a href="#" onclick="switchPanel(\'goals\',null);return false">Create a goal →</a></p>';
    return;
  }
  el.innerHTML = goals.map(g => {
    const meta = (typeof GOAL_TYPE_META !== 'undefined' && GOAL_TYPE_META[g.type]) || { emoji:'⭐' };
    const priCls = (typeof PRIORITY_CLS !== 'undefined' && PRIORITY_CLS[g.priority]) || 'badge-muted';
    return `<div class="goal-sel-card ${g.id === _gapGoalId ? 'active' : ''}" onclick="gapSelectGoal('${g.id}')">
      <span class="goal-sel-emoji">${meta.emoji}</span>
      <div class="goal-sel-info">
        <div class="goal-sel-name">${esc(g.name)}</div>
        <span class="badge ${priCls}" style="font-size:10px">${esc(g.priority)}</span>
      </div>
    </div>`;
  }).join('');
}

function gapSelectGoal(goalId) {
  _gapGoalId = goalId;
  gapRender(); // refresh active card
  runGapAnalysis();
}

// ── Run analysis ───────────────────────────────────────────────────
function runGapAnalysis() {
  const goalId = _gapGoalId;
  if (!goalId) return;

  const goals  = stRead('goals');
  const skills = stRead('skills');
  const goal   = goals.find(g => g.id === goalId);
  if (!goal) return;

  const rawRequired = goal.requiredSkills || [];
  if (!rawRequired.length) {
    document.getElementById('gap-results').innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <h3>No required skills defined</h3>
        <p>Go to <strong>Required Skills</strong> to define what skills this goal needs, then run analysis again.</p>
        <button class="btn btn-primary" onclick="_rsJumpToGoal('${goal.id}')">Define Required Skills</button>
      </div>`;
    return;
  }

  const required = _normRequired(rawRequired);
  _gapRequiredSkills = required; // store for gapAddSkill

  // Build status map: skill name (lower) → { status, proficiency, matchedName, requiredLevel }
  // Fuzzy match: finds user skill that is similar to required skill
  function _findSimilarSkill(reqName, userSkills) {
    const rLow = reqName.toLowerCase().trim();
    // 1. Exact match
    const exact = userSkills.find(s => s.name.toLowerCase().trim() === rLow);
    if (exact) return exact;
    // 2. One contains the other (e.g. "Python" matches "Python Programming")
    const contains = userSkills.find(s => {
      const uLow = s.name.toLowerCase().trim();
      return uLow.includes(rLow) || rLow.includes(uLow);
    });
    if (contains) return contains;
    // 3. Strip parenthetical qualifiers and compare (e.g. "Python (Advanced)" → "Python")
    const rBase = rLow.replace(/\s*\([^)]*\)\s*/g, '').trim();
    const baseMatch = userSkills.find(s => {
      const uBase = s.name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
      return uBase === rBase || uBase.includes(rBase) || rBase.includes(uBase);
    });
    if (baseMatch) return baseMatch;
    // 4. Word overlap: if ≥50% of significant words match (min 2 words shared)
    const rWords = rBase.split(/[\s/&,\-]+/).filter(w => w.length > 2);
    if (rWords.length >= 2) {
      let bestMatch = null, bestOverlap = 0;
      userSkills.forEach(s => {
        const uWords = s.name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').split(/[\s/&,\-]+/).filter(w => w.length > 2);
        const shared = rWords.filter(w => uWords.some(uw => uw === w || uw.includes(w) || w.includes(uw))).length;
        const overlap = shared / Math.max(rWords.length, 1);
        if (shared >= 2 && overlap >= 0.5 && overlap > bestOverlap) {
          bestOverlap = overlap;
          bestMatch = s;
        }
      });
      if (bestMatch) return bestMatch;
    }
    return null;
  }

  const statusMap = {};
  const overrides = _getGapOverrides();
  required.forEach(({ name, level }) => {
    const key     = name.toLowerCase();
    const reqRank = PROF_RANK[level || 'Advanced'] ?? 2;
    // Check for manual override first
    let us = null;
    if (overrides.hasOwnProperty(key)) {
      const ovVal = overrides[key];
      if (ovVal === '') {
        us = null; // forced "no match"
      } else {
        us = skills.find(s => s.name.toLowerCase() === ovVal.toLowerCase()) || null;
      }
    } else {
      us = _findSimilarSkill(name, skills);
    }
    if (!us) {
      statusMap[key] = { status: 'missing', requiredLevel: level || 'Advanced' };
    } else {
      const userRank = PROF_RANK[us.proficiency] ?? 1;
      const base = { proficiency: us.proficiency, matchedName: us.name, requiredLevel: level || 'Advanced' };
      if (userRank >= reqRank)          statusMap[key] = { ...base, status: 'matched' };
      else if (userRank === reqRank - 1) statusMap[key] = { ...base, status: 'partial' };
      else                               statusMap[key] = { ...base, status: 'weak' };
    }
  });

  // Totals for stat bar
  const total   = required.length;
  const matched = Object.values(statusMap).filter(x => x.status === 'matched').length;
  const partial = Object.values(statusMap).filter(x => x.status === 'partial').length;
  const weak    = Object.values(statusMap).filter(x => x.status === 'weak').length;
  const missing = Object.values(statusMap).filter(x => x.status === 'missing').length;
  const gaps    = partial + weak + missing;

  const statEl = document.getElementById('stat-gaps');
  if (statEl) statEl.textContent = gaps;

  _renderGapResults(goal, required, statusMap, { total, matched, partial, weak, missing });
  stLog('gap_analysis', 'Ran gap analysis for: ' + goal.name);
}

// ── Render ─────────────────────────────────────────────────────────
function _renderGapResults(goal, required, statusMap, counts) {
  const { total, matched, partial, weak, missing } = counts;

  const pctM  = Math.round(matched / total * 100);
  const pctP  = Math.round(partial / total * 100);
  const pctW  = Math.round(weak    / total * 100);
  const pctMs = Math.round(missing / total * 100);

  // Group required skills by category (preserve insertion order)
  const catOrder = [];
  const catMap   = {};
  required.forEach((skill, idx) => {
    const cat = skill.category || 'General';
    if (!catMap[cat]) { catMap[cat] = []; catOrder.push(cat); }
    catMap[cat].push({ name: skill.name, idx });
  });

  const html = `
    <div class="gap-header">
      <div>
        <h2 class="gap-goal-title">${esc(goal.name)}</h2>
        <p class="gap-goal-sub">${total} required skills across ${catOrder.length} categories</p>
      </div>
      <button class="btn btn-ghost btn-sm" id="btn-gap-narrative" onclick="getGapNarrative('${goal.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        AI Narrative
      </button>
    </div>

    <div class="gap-summary-grid">
      <div class="gap-stat-card" style="border-color:#16a34a30">
        <div class="gap-stat-num" style="color:#16a34a">${matched}</div>
        <div class="gap-stat-label">Matched</div>
        <div class="gap-stat-pct" style="color:#16a34a">${pctM}%</div>
      </div>
      <div class="gap-stat-card" style="border-color:#06b6d430">
        <div class="gap-stat-num" style="color:#06b6d4">${partial}</div>
        <div class="gap-stat-label">Partial</div>
        <div class="gap-stat-pct" style="color:#06b6d4">${pctP}%</div>
      </div>
      <div class="gap-stat-card" style="border-color:#d9770630">
        <div class="gap-stat-num" style="color:#d97706">${weak}</div>
        <div class="gap-stat-label">Weak</div>
        <div class="gap-stat-pct" style="color:#d97706">${pctW}%</div>
      </div>
      <div class="gap-stat-card" style="border-color:#dc262630">
        <div class="gap-stat-num" style="color:#dc2626">${missing}</div>
        <div class="gap-stat-label">Missing</div>
        <div class="gap-stat-pct" style="color:#dc2626">${pctMs}%</div>
      </div>
    </div>

    <div class="gap-bar-wrap">
      <div class="gap-visual-bar">
        ${matched  ? `<div style="width:${pctM}%;background:#16a34a" title="Matched ${matched}"></div>`  : ''}
        ${partial  ? `<div style="width:${pctP}%;background:#06b6d4" title="Partial ${partial}"></div>`  : ''}
        ${weak     ? `<div style="width:${pctW}%;background:#d97706" title="Weak ${weak}"></div>`        : ''}
        ${missing  ? `<div style="width:${pctMs}%;background:#dc2626" title="Missing ${missing}"></div>` : ''}
      </div>
      <div class="gap-bar-legend">
        <span style="color:#16a34a">■ Matched</span>
        <span style="color:#06b6d4">■ Partial</span>
        <span style="color:#d97706">■ Weak</span>
        <span style="color:#dc2626">■ Missing</span>
      </div>
    </div>

    <div id="gap-narrative-box"></div>

    <div class="gap-categories">
      ${catOrder.map(cat => _renderCatTable(cat, catMap[cat], statusMap)).join('')}

    </div>
  `;
  document.getElementById('gap-results').innerHTML = html;
}

// ── Category table ─────────────────────────────────────────────────
function _renderCatTable(cat, skillItems, statusMap) {
  const cfg        = _catCfg(cat);
  const catTotal   = skillItems.length;
  const catCovered = skillItems.filter(({name}) => ['matched','partial'].includes(statusMap[name.toLowerCase()]?.status)).length;
  const catGaps    = catTotal - catCovered;

  const rows = skillItems.map(({name, idx}) => {
    const info = statusMap[name.toLowerCase()] || { status: 'missing' };
    return _renderSkillRow(name, info, idx);
  }).join('');

  return `
    <div class="gap-cat-block">
      <div class="gap-cat-header" style="background:${cfg.bg};border-color:${cfg.color}30">
        <div class="gap-cat-title">
          <span class="gap-cat-icon">${cfg.icon}</span>
          <span class="gap-cat-name" style="color:${cfg.color}">${esc(cat.toUpperCase())}</span>
          <span class="gap-cat-count badge badge-muted">${catTotal} skills</span>
        </div>
        <div class="gap-cat-meta">
          ${catCovered ? `<span style="color:#16a34a;font-size:12px;font-weight:600">✓ ${catCovered} covered</span>` : ''}
          ${catGaps    ? `<span style="color:#dc2626;font-size:12px;font-weight:600">✗ ${catGaps} gap${catGaps>1?'s':''}</span>` : ''}
        </div>
      </div>
      <div class="gap-cat-table">
        <div class="gap-table-head">
          <div>Required Skill</div>
          <div>Req. Level</div>
          <div>Your Matching Skill</div>
          <div>Your Level</div>
          <div>Status</div>
        </div>
        ${rows}
      </div>
    </div>`;
}

function _renderSkillRow(name, info, idx) {
  let matchCell = '';
  let userLevelCell = '';
  let statusCell = '';
  const reqName = name;

  const _lvlBadge = (lvl, color) => `<span style="font-size:10px;font-weight:600;color:${color};background:${color}15;padding:1px 5px;border-radius:3px;white-space:nowrap">${esc(lvl)}</span>`;
  const _lvlColor = (lvl) => ({ 'Expert':'#d97706','Advanced':'#0d9488','Intermediate':'#06b6d4','Beginner':'#94a3b8' }[lvl] || '#64748b');

  if (info.status === 'matched') {
    matchCell  = `<span class="gap-match-badge gap-match-yes">${esc(info.matchedName)}</span>`;
    userLevelCell = _lvlBadge(info.proficiency, _lvlColor(info.proficiency));
    statusCell = `<span class="gap-status-covered">✓ covered</span>`;
  } else if (info.status === 'partial') {
    matchCell  = `<span class="gap-match-badge gap-match-partial">${esc(info.matchedName)}</span>`;
    userLevelCell = _lvlBadge(info.proficiency, _lvlColor(info.proficiency));
    statusCell = `<span class="gap-status-partial">~ level up</span>
                  <button class="gap-add-btn" onclick="gapAddSkill(${idx})">+ Improve</button>`;
  } else if (info.status === 'weak') {
    matchCell  = `<span class="gap-match-badge gap-match-weak">${esc(info.matchedName)}</span>`;
    userLevelCell = _lvlBadge(info.proficiency, _lvlColor(info.proficiency));
    statusCell = `<span class="gap-status-gap">✗ weak</span>
                  <button class="gap-add-btn" onclick="gapAddSkill(${idx})">+ Improve</button>`;
  } else {
    matchCell  = `<span class="gap-match-none">— not in profile</span>`;
    userLevelCell = '<span style="color:#94a3b8;font-size:11px">—</span>';
    statusCell = `<span class="gap-status-gap">✗ gap</span>
                  <button class="gap-add-btn" onclick="gapAddSkill(${idx})">+ I have this</button>`;
  }

  // Edit button: change or clear the matched skill
  const editBtn = `<button class="gap-edit-btn" onclick="gapEditMatch('${esc(reqName.replace(/'/g,"\\'"))}','${esc((info.matchedName||'').replace(/'/g,"\\'"))}')" title="Change or clear matched skill">✎</button>`;

  const reqLvl = info.requiredLevel || 'Advanced';
  return `<div class="gap-table-row">
    <div class="gap-skill-name">${esc(name)}</div>
    <div>${_lvlBadge(reqLvl, _lvlColor(reqLvl))}</div>
    <div>${matchCell} ${editBtn}</div>
    <div>${userLevelCell}</div>
    <div class="gap-status-cell">${statusCell}</div>
  </div>`;
}

// ── Add / improve skill from gap analysis ──────────────────────────
function gapAddSkill(idx) {
  const req = _gapRequiredSkills[idx];
  if (!req) return;

  const proficiency = req.level || 'Intermediate';
  const group       = _GAP_CAT_TO_GROUP[req.category] || 'Custom';

  // Single read → modify in memory → single write (avoids double read from stUpsert)
  const skills  = stRead('skills');
  const existIdx = skills.findIndex(s => s.name.toLowerCase() === req.name.toLowerCase());

  if (existIdx > -1) {
    skills[existIdx].proficiency = proficiency;
    stLog('skill_updated', 'Improved skill from gap analysis: ' + req.name + ' → ' + proficiency);
  } else {
    skills.push({ id: 's_' + Date.now(), name: req.name, group, proficiency, notes: '', addedAt: new Date().toISOString() });
    stLog('skill_added', 'Added skill from gap analysis: ' + req.name);
  }
  stWrite('skills', skills);

  runGapAnalysis(); // refresh analysis immediately
}

// ── Edit skill match — change or clear the auto-matched skill ──────
// Overrides stored in localStorage: st-{uid}-gap-overrides = { "required_skill_lower": "my_skill_name" | "" }
function _getGapOverrides() {
  try { return JSON.parse(localStorage.getItem('st-' + _uid() + '-gap-overrides') || '{}'); } catch { return {}; }
}
function _saveGapOverrides(ov) {
  localStorage.setItem('st-' + _uid() + '-gap-overrides', JSON.stringify(ov));
}

function gapEditMatch(reqName, currentMatch) {
  const skills = stRead('skills');
  const overrides = _getGapOverrides();
  const key = reqName.toLowerCase();

  // Build options: all user skills + "— No match (I don't have this)" + "— Auto-match (reset)"
  const opts = ['— Auto-match (reset)', '— No match (clear)'].concat(skills.map(s => s.name)).sort((a, b) => {
    if (a.startsWith('—')) return -1;
    if (b.startsWith('—')) return 1;
    return a.localeCompare(b);
  });

  const current = overrides[key] !== undefined ? overrides[key] : (currentMatch || '');
  const choice = prompt(
    'Match for "' + reqName + '":\n\n' +
    'Current: ' + (current || '(auto-matched)') + '\n\n' +
    'Type a skill name from My Skills, or:\n' +
    '  "clear" = I don\'t have this skill\n' +
    '  "auto" = Reset to auto-match\n' +
    '  Or paste an exact skill name',
    current || ''
  );

  if (choice === null) return; // cancelled

  const trimmed = choice.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'auto') {
    // Reset to auto-match
    delete overrides[key];
  } else if (trimmed.toLowerCase() === 'clear') {
    // Force no match
    overrides[key] = '';
  } else {
    // Set explicit match
    overrides[key] = trimmed;
  }

  _saveGapOverrides(overrides);
  runGapAnalysis(); // refresh
}

// ── AI Narrative ───────────────────────────────────────────────────
async function getGapNarrative(goalId) {
  const btn = document.getElementById('btn-gap-narrative');
  const box = document.getElementById('gap-narrative-box');
  if (!btn || !box) return;
  btn.disabled = true;
  btn.textContent = 'Generating…';
  box.innerHTML = '<div class="ai-loading"><div class="loader"></div><span>AI is writing your narrative…</span></div>';

  const goal     = stRead('goals').find(g => g.id === goalId);
  const skills   = stRead('skills');
  const required = _normRequired(goal ? goal.requiredSkills : []);
  const result   = { matched:[], partial:[], weak:[], missing:[] };

  required.forEach(({ name }) => {
    const us = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!us) result.missing.push(name);
    else if (['Advanced','Expert'].includes(us.proficiency)) result.matched.push(name);
    else if (us.proficiency === 'Intermediate') result.partial.push(name);
    else result.weak.push(name);
  });

  const r = await aiCall('gap_narrative', { goalName: goal.name, ...result });
  if (r.ok) {
    box.innerHTML = `<div class="ai-narrative"><div class="ai-narrative-label">AI Analysis</div><p>${esc(r.narrative).replace(/\n/g,'<br>')}</p></div>`;
  } else {
    box.innerHTML = `<div class="ai-narrative ai-narrative-error">${esc(r.error)}</div>`;
  }
  btn.disabled = false;
  btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Refresh Narrative';
}

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', gapRender);
