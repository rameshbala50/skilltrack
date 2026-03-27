/* ──────────────────────────────────────────
   SkillTrack — Progress Module
────────────────────────────────────────── */
'use strict';

function progressRender() {
  const goals   = stRead('goals');
  const skills  = stRead('skills');
  const paths   = stRead('learning');
  const jobs    = stRead('jobs');
  const activity = stReadActivity();

  // ── Summary stats ─────────────────────────────────────────────
  const allItems    = paths.flatMap(p => p.items || []);
  const completed   = allItems.filter(x => x.status === 'Completed').length;
  const inProgress  = allItems.filter(x => x.status === 'In Progress').length;

  // Avg goal progress
  let totalPct = 0;
  goals.forEach(g => {
    const path  = paths.find(p => p.goalId === g.id);
    const items = path ? path.items : [];
    const pct   = items.length ? Math.round(items.filter(x=>x.status==='Completed').length / items.length * 100) : 0;
    totalPct += pct;
  });
  const avgPct = goals.length ? Math.round(totalPct / goals.length) : 0;

  // Hours this week (sessions in timetable)
  const timetable  = stReadObj('timetable');
  const sessions   = (timetable.sessions || []);
  const weekStart  = _weekStart();
  const weekHrs    = sessions.filter(s => s.status === 'Completed' && s.date >= weekStart).reduce((sum,s) => sum + (s.durationHours||0), 0);

  // Update stat cards
  _setText('prog-completed',  completed);
  _setText('prog-avg',        avgPct + '%');
  _setText('prog-week-hrs',   weekHrs + 'h');
  _setText('prog-in-progress', inProgress);

  // ── Goal progress list ─────────────────────────────────────────
  _renderGoalProgress(goals, paths);

  // ── Activity feed ──────────────────────────────────────────────
  _renderActivityFeed(activity);

  // ── Skills by proficiency ──────────────────────────────────────
  _renderSkillsBreakdown(skills);
}

function _setText(id, val) {
  const el = document.getElementById(id); if (el) el.textContent = val;
}

function _weekStart() {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d.toISOString().slice(0,10);
}

function _renderGoalProgress(goals, paths) {
  const el = document.getElementById('prog-goals-list');
  if (!el) return;
  if (!goals.length) { el.innerHTML = '<div class="empty-state empty-state-sm"><p>No goals yet. <a href="#" onclick="switchPanel(\'goals\',null);return false">Create a goal</a></p></div>'; return; }
  el.innerHTML = goals.map(g => {
    const path  = paths.find(p => p.goalId === g.id);
    const items = path ? path.items : [];
    const total = items.length;
    const done  = items.filter(x=>x.status==='Completed').length;
    const pct   = total ? Math.round(done/total*100) : 0;
    const active = items.filter(x=>x.status==='In Progress').length;
    return `<div class="prog-goal-row">
      <div class="prog-goal-info">
        <span class="prog-goal-name">${esc(g.name)}</span>
        <span class="prog-goal-meta">${total?`${done}/${total} topics · ${active} in progress`:'No learning path yet'}</span>
      </div>
      <div class="prog-goal-bar-wrap">
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
        <span class="prog-pct">${pct}%</span>
      </div>
    </div>`;
  }).join('');
}

function _renderActivityFeed(activity) {
  const el = document.getElementById('activity-feed');
  if (!el) return;
  if (!activity.length) { el.innerHTML = '<div class="empty-state empty-state-sm"><p>No activity recorded yet.</p></div>'; return; }
  const icons = { goal_added:'🎯', goal_updated:'🎯', goal_deleted:'🗑', skill_added:'⭐', skill_updated:'⭐', skill_deleted:'🗑', lp_generated:'📚', lp_progress:'✅', job_added:'💼', job_updated:'💼', resume_upload:'📄', gap_analysis:'📊', timetable_session:'🕐' };
  el.innerHTML = activity.slice(0,20).map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:var(--primary)"></div>
      <div>
        <div class="activity-text">${icons[a.type]||'•'} ${esc(a.message)}</div>
        <div class="activity-time">${relTime(a.at)}</div>
      </div>
    </div>`).join('');
}

function _renderSkillsBreakdown(skills) {
  const el = document.getElementById('skills-breakdown');
  if (!el) return;
  if (!skills.length) { el.innerHTML = '<div class="empty-state empty-state-sm"><p>No skills added yet.</p></div>'; return; }
  const groups = {};
  skills.forEach(s => { const g=s.group||'Custom'; (groups[g]=groups[g]||[]).push(s); });
  const total = skills.length;
  el.innerHTML = Object.entries(groups).sort((a,b)=>b[1].length-a[1].length).map(([g,ss]) => {
    const pct = Math.round(ss.length/total*100);
    return `<div class="skill-breakdown-row">
      <span class="skill-breakdown-group">${esc(g)}</span>
      <div class="skill-breakdown-bar-wrap">
        <div class="progress-wrap"><div class="progress-bar accent" style="width:${pct}%"></div></div>
      </div>
      <span class="skill-breakdown-count">${ss.length}</span>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', progressRender);
