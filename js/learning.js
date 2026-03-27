/* ──────────────────────────────────────────
   SkillTrack — Learning Path Module
────────────────────────────────────────── */
'use strict';

const LP_STATUS = { 'Not Started':'lp-todo', 'In Progress':'lp-active', 'Completed':'lp-done' };

let _lpGoalId = '';

function learningRender() {
  const goals = stRead('goals');
  _lpRenderGoalCards(goals);
  if (!_lpGoalId) return;
  const paths = stRead('learning');
  const path  = paths.find(p => p.goalId === _lpGoalId);
  _renderLearningPath(_lpGoalId, path ? path.items : null);
}

function _lpRenderGoalCards(goals) {
  const el = document.getElementById('lp-goal-cards');
  if (!el) return;
  if (!goals.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--muted)">No goals yet. <a href="#" onclick="switchPanel(\'goals\',null);return false">Create a goal →</a></p>';
    return;
  }
  el.innerHTML = goals.map(g => {
    const meta   = (typeof GOAL_TYPE_META !== 'undefined' && GOAL_TYPE_META[g.type]) || { emoji:'⭐' };
    const priCls = (typeof PRIORITY_CLS   !== 'undefined' && PRIORITY_CLS[g.priority]) || 'badge-muted';
    return `<div class="goal-sel-card ${g.id === _lpGoalId ? 'active' : ''}" onclick="lpSelectGoal('${g.id}')">
      <span class="goal-sel-emoji">${meta.emoji}</span>
      <div class="goal-sel-info">
        <div class="goal-sel-name">${esc(g.name)}</div>
        <span class="badge ${priCls}" style="font-size:10px">${esc(g.priority)}</span>
      </div>
    </div>`;
  }).join('');
}

function lpSelectGoal(goalId) {
  _lpGoalId = goalId;
  const goals  = stRead('goals');
  _lpRenderGoalCards(goals); // refresh active state
  // show/hide generate button
  const actEl = document.getElementById('lp-gen-actions');
  if (actEl) actEl.style.display = '';
  const btn = document.getElementById('btn-gen-path');
  if (btn) btn.disabled = false;
  const paths = stRead('learning');
  const path  = paths.find(p => p.goalId === goalId);
  _renderLearningPath(goalId, path ? path.items : null);
}

function _renderLearningPath(goalId, items) {
  const box = document.getElementById('learning-path-content');
  if (!box) return;
  if (!items) {
    box.innerHTML = `<div class="empty-state empty-state-sm">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      <p>No learning path yet. Click <strong>Generate Path</strong> to create one with AI.</p>
    </div>`;
    return;
  }
  if (!items.length) { box.innerHTML = '<div class="empty-state empty-state-sm"><p>No topics in this path yet.</p></div>'; return; }

  const done  = items.filter(x=>x.status==='Completed').length;
  const total = items.length;
  const pct   = total ? Math.round(done/total*100) : 0;
  const totalHrs = items.reduce((s,i)=>s+(i.estimatedHours||0),0);

  box.innerHTML = `
    <div class="lp-header">
      <div class="lp-stats">
        <span class="lp-stat">${done}/${total} topics completed</span>
        <span class="lp-stat">${totalHrs}h estimated</span>
        <span class="lp-stat" style="color:var(--primary);font-weight:700">${pct}%</span>
      </div>
      <div class="progress-wrap" style="margin-top:8px"><div class="progress-bar" style="width:${pct}%"></div></div>
    </div>
    <div class="lp-list">
      ${items.map((item,idx) => _lpItemHTML(goalId, item, idx, items.length)).join('')}
    </div>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="lpAddItem('${goalId}')">+ Add Topic</button>
    </div>`;
}

function _lpItemHTML(goalId, item, idx, total) {
  const done    = item.status === 'Completed';
  const active  = item.status === 'In Progress';
  const statusCls = LP_STATUS[item.status] || 'lp-todo';
  const resources = item.resources || [];
  return `<div class="lp-item ${statusCls}" id="lp-item-${item.id}">
    <div class="lp-item-left">
      <div class="lp-num">${idx+1}</div>
      <div class="lp-connector ${idx===total-1?'lp-last':''}"></div>
    </div>
    <div class="lp-item-body">
      <div class="lp-item-header">
        <div class="lp-item-title ${done?'lp-title-done':''}">${esc(item.topic)}</div>
        <div class="lp-item-actions">
          ${item.estimatedHours?`<span class="lp-hours">${item.estimatedHours}h</span>`:''}
          <select class="lp-status-sel" onchange="lpSetStatus('${goalId}','${item.id}',this.value)">
            ${['Not Started','In Progress','Completed'].map(s=>`<option value="${s}" ${item.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="icon-btn" onclick="lpMoveUp('${goalId}','${item.id}')" ${idx===0?'disabled':''} title="Move up">↑</button>
          <button class="icon-btn" onclick="lpMoveDown('${goalId}','${item.id}')" ${idx===total-1?'disabled':''} title="Move down">↓</button>
          <button class="icon-btn icon-btn-danger" onclick="lpDeleteItem('${goalId}','${item.id}')" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
      ${item.description ? `<p class="lp-desc">${esc(item.description)}</p>` : ''}
      ${resources.length ? `<div class="lp-resources">${resources.map(r=>`<a href="${esc(r.url||'#')}" target="_blank" class="lp-resource-link">${esc(r.title||r.url)}</a>`).join('')}</div>` : ''}
    </div>
  </div>`;
}

// ── Status change ──────────────────────────────────────────────────
function lpSetStatus(goalId, itemId, status) {
  const paths = stRead('learning');
  const path  = paths.find(p=>p.goalId===goalId);
  if (!path) return;
  const item  = path.items.find(x=>x.id===itemId);
  if (!item) return;
  item.status = status;
  stWrite('learning', paths);
  stLog('lp_progress', `Marked "${item.topic}" as ${status}`);
  learningRender();
  if (typeof progressRender === 'function') progressRender();
}

function lpMoveUp(goalId, itemId) { _lpMove(goalId, itemId, -1); }
function lpMoveDown(goalId, itemId) { _lpMove(goalId, itemId, 1); }
function _lpMove(goalId, itemId, dir) {
  const paths = stRead('learning');
  const path  = paths.find(p=>p.goalId===goalId);
  if (!path) return;
  const idx = path.items.findIndex(x=>x.id===itemId);
  const ni  = idx + dir;
  if (ni < 0 || ni >= path.items.length) return;
  [path.items[idx], path.items[ni]] = [path.items[ni], path.items[idx]];
  stWrite('learning', paths);
  learningRender();
}

function lpDeleteItem(goalId, itemId) {
  const paths = stRead('learning');
  const path  = paths.find(p=>p.goalId===goalId);
  if (!path) return;
  path.items = path.items.filter(x=>x.id!==itemId);
  stWrite('learning', paths);
  learningRender();
}

function lpAddItem(goalId) {
  const topic = prompt('Topic name:');
  if (!topic) return;
  const hrs   = prompt('Estimated hours (optional):');
  const paths = stRead('learning');
  let path    = paths.find(p=>p.goalId===goalId);
  const item  = { id:'lp_'+Date.now(), topic:topic.trim(), description:'', estimatedHours:parseInt(hrs)||0, status:'Not Started', resources:[], order:0 };
  if (path) { path.items.push(item); }
  else { paths.push({ goalId, items:[item], generatedAt:new Date().toISOString() }); }
  stWrite('learning', paths);
  learningRender();
}

// ── Generate with AI ───────────────────────────────────────────────
async function generateLearningPath() {
  const goalId = _lpGoalId;
  if (!goalId) return;
  const goals  = stRead('goals');
  const skills = stRead('skills');
  const goal   = goals.find(g=>g.id===goalId);
  if (!goal) return;

  const btn = document.getElementById('btn-gen-path');
  const box = document.getElementById('learning-path-content');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  if (box) box.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:48px 24px;color:var(--muted)">
      <div class="loader"></div>
      <div style="font-size:14px;font-weight:600;color:var(--fg)">Building your learning path…</div>
      <div style="font-size:12px;text-align:center;max-width:320px">AI is analysing your goal <strong>${esc(goal.name)}</strong> and skill gaps to create a step-by-step roadmap.</div>
    </div>`;

  const userSkillNames = skills.map(s=>s.name);
  const required  = (goal.requiredSkills || []).map(r => typeof r==='string' ? r : r.name);
  const missing   = required.filter(r => !skills.find(s=>s.name.toLowerCase()===r.toLowerCase()));
  const weak      = required.filter(r => skills.find(s=>s.name.toLowerCase()===r.toLowerCase() && ['Beginner','Intermediate'].includes(s.proficiency)));

  const r = await aiCall('learning_path', { goalName:goal.name, goalType:goal.type, missingSkills:missing, weakSkills:weak, existingSkills:userSkillNames });

  const regenHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Regenerate Path';
  if (btn) { btn.disabled = false; btn.innerHTML = regenHTML; }

  if (r.ok && Array.isArray(r.items)) {
    const items = r.items.map((item,i) => ({ id:'lp_'+Date.now()+'_'+i, topic:item.topic||'', description:item.description||'', estimatedHours:item.estimatedHours||0, status:'Not Started', resources:item.resources||[], order:i }));
    const paths = stRead('learning');
    const idx   = paths.findIndex(p=>p.goalId===goalId);
    const entry = { goalId, items, generatedAt:new Date().toISOString() };
    if (idx > -1) paths[idx] = entry; else paths.push(entry);
    stWrite('learning', paths);
    stLog('lp_generated', 'Generated learning path for: ' + goal.name);
    learningRender(); // only re-render on success so the path shows
  } else {
    if (box) box.innerHTML = `<div class="ai-narrative ai-narrative-error"><strong>Generation failed:</strong> ${esc(r.error || 'Unknown error. Check your API key.')}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', learningRender);
