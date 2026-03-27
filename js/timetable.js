/* ──────────────────────────────────────────
   SkillTrack — Timetable Module
────────────────────────────────────────── */
'use strict';

const DAYS     = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
let _ttView = 'week';

// ── Study hours helpers ────────────────────────────────────────────
function ttGetConfig()  { return stReadObj('timetable'); }
function ttSaveConfig(cfg) { stWriteObj('timetable', cfg); }

function ttGetSessions() {
  const cfg = ttGetConfig(); return cfg.sessions || [];
}
function ttSaveSessions(sessions) {
  const cfg = ttGetConfig(); cfg.sessions = sessions; ttSaveConfig(cfg);
}

// ── Render ─────────────────────────────────────────────────────────
function timetableRender() {
  const view = document.getElementById('timetable-view');
  if (!view) return;
  if (_ttView === 'week') _renderWeek(view);
  else if (_ttView === 'day') _renderDay(view);
  else _renderMonth(view);
}

function setTimetableView(v, btn) {
  _ttView = v;
  document.querySelectorAll('.timetable-controls .pill').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  timetableRender();
}

// ── Week view ──────────────────────────────────────────────────────
function _renderWeek(container) {
  const today     = new Date();
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay()+6)%7)); // Monday
  const dates     = DAYS.map((_,i) => { const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });
  const sessions  = ttGetSessions();
  const config    = ttGetConfig();
  const studyHrs  = config.studyHours || {};

  const todayStr = today.toISOString().slice(0,10);
  const html = `
    <div class="tt-week-grid">
      <div class="tt-week-header">
        ${dates.map((d,i) => {
          const ds = d.toISOString().slice(0,10);
          const isToday = ds === todayStr;
          const hrs = studyHrs[DAYS[i]] || 0;
          return `<div class="tt-day-col-header ${isToday?'tt-today':''}">
            <div class="tt-day-name">${DAYS[i]}</div>
            <div class="tt-day-date">${d.getDate()}</div>
            ${hrs ? `<div class="tt-day-hrs">${hrs}h available</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="tt-week-body">
        ${dates.map((d,i) => {
          const ds = d.toISOString().slice(0,10);
          const daySessions = sessions.filter(s => s.date === ds);
          const isToday = ds === todayStr;
          return `<div class="tt-day-col ${isToday?'tt-today-col':''}">
            ${daySessions.length === 0
              ? `<div class="tt-empty-day"><span>No sessions</span></div>`
              : daySessions.map(s => _ttSessionCard(s)).join('')}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  container.innerHTML = html;
}

function _renderDay(container) {
  const today    = new Date().toISOString().slice(0,10);
  const sessions = ttGetSessions().filter(s => s.date === today);
  container.innerHTML = `
    <div class="tt-day-view">
      <h3 class="tt-day-title">Today — ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</h3>
      ${sessions.length === 0
        ? '<div class="empty-state empty-state-sm"><p>No sessions scheduled for today.</p></div>'
        : sessions.map(s => _ttSessionCard(s, true)).join('')}
    </div>`;
}

function _renderMonth(container) {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  const first = new Date(y, m, 1);
  const last  = new Date(y, m+1, 0);
  const sessions = ttGetSessions();
  const byDate = {};
  sessions.forEach(s => { (byDate[s.date]=byDate[s.date]||[]).push(s); });

  let cells = '';
  const startDay = (first.getDay()+6)%7; // Monday = 0
  for (let i=0; i<startDay; i++) cells += '<div class="tt-month-cell tt-month-empty"></div>';
  for (let d=1; d<=last.getDate(); d++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ss = byDate[ds] || [];
    const isToday = ds === today.toISOString().slice(0,10);
    cells += `<div class="tt-month-cell ${isToday?'tt-month-today':''}">
      <div class="tt-month-num">${d}</div>
      ${ss.slice(0,2).map(s=>`<div class="tt-month-dot" style="background:${_ttStatusColor(s.status)}" title="${esc(s.topic)}"></div>`).join('')}
      ${ss.length>2?`<div class="tt-month-more">+${ss.length-2}</div>`:''}
    </div>`;
  }
  container.innerHTML = `
    <div class="tt-month-view">
      <div class="tt-month-title">${today.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</div>
      <div class="tt-month-day-headers">${DAYS.map(d=>`<div>${d}</div>`).join('')}</div>
      <div class="tt-month-grid">${cells}</div>
    </div>`;
}

function _ttSessionCard(s, large=false) {
  const color = _ttStatusColor(s.status);
  const goals = stRead('goals');
  const goal  = s.goalId ? goals.find(g=>g.id===s.goalId) : null;
  return `<div class="tt-session-card" style="border-left-color:${color}">
    <div class="tt-session-topic">${esc(s.topic)}</div>
    ${goal ? `<div class="tt-session-goal" style="font-size:11px;color:var(--muted);margin-bottom:2px">📎 ${esc(goal.name)}</div>` : ''}
    ${s.startTime ? `<div class="tt-session-time">${esc(s.startTime)}${s.endTime?' – '+esc(s.endTime):''}</div>` : ''}
    ${s.durationHours ? `<div class="tt-session-time">${s.durationHours}h</div>` : ''}
    ${s.notes ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;white-space:pre-wrap">${esc(s.notes)}</div>` : ''}
    <div class="tt-session-status" style="color:${color}">${esc(s.status)}</div>
    <div class="tt-session-actions">
      ${s.status!=='Completed'?`<button class="icon-btn" title="Mark complete" onclick="ttMarkDone('${s.id}')">✓</button>`:''}
      <button class="icon-btn" title="Edit" onclick="openSessionModal('${s.id}')">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn icon-btn-danger" title="Delete" onclick="ttDeleteSession('${s.id}')">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  </div>`;
}

function _ttStatusColor(status) {
  return status==='Completed'?'#16a34a':status==='In Progress'?'#06b6d4':'#94a3b8';
}

function ttMarkDone(id) {
  const sessions = ttGetSessions();
  const s = sessions.find(x=>x.id===id);
  if (!s) return;
  s.status = 'Completed';
  ttSaveSessions(sessions);
  stLog('timetable_session', 'Completed session: ' + s.topic);
  timetableRender();
  if (typeof progressRender === 'function') progressRender();
}

function ttDeleteSession(id) {
  if (!confirm('Delete this session?')) return;
  ttSaveSessions(ttGetSessions().filter(s=>s.id!==id));
  timetableRender();
}

// ── Study hours modal ──────────────────────────────────────────────
function openStudyHoursModal() {
  const cfg  = ttGetConfig();
  const hrs  = cfg.studyHours || {};
  DAYS.forEach(d => {
    const el = document.getElementById('sh-' + d.toLowerCase());
    if (el) el.value = hrs[d] || 0;
  });
  document.getElementById('study-hours-modal').classList.add('open');
}
function closeStudyHoursModal() { document.getElementById('study-hours-modal').classList.remove('open'); }
function saveStudyHours() {
  const cfg = ttGetConfig();
  cfg.studyHours = {};
  DAYS.forEach(d => {
    const el = document.getElementById('sh-' + d.toLowerCase());
    cfg.studyHours[d] = el ? (parseInt(el.value)||0) : 0;
  });
  ttSaveConfig(cfg);
  closeStudyHoursModal();
  timetableRender();
}

// ── Auto-schedule ──────────────────────────────────────────────────
function autoSchedule() {
  const goals  = stRead('goals');
  const paths  = stRead('learning');
  const cfg    = ttGetConfig();
  const hrs    = cfg.studyHours || {};

  // Collect unstarted learning items from all paths
  const pending = [];
  paths.forEach(path => {
    const goal = goals.find(g=>g.id===path.goalId);
    (path.items||[]).filter(x=>x.status!=='Completed').forEach(item => {
      pending.push({ topic:item.topic, goalName:goal?goal.name:'', estimatedHours:item.estimatedHours||1, learningItemId:item.id, goalId:path.goalId });
    });
  });

  if (!pending.length) { alert('No pending learning topics to schedule.'); return; }

  const sessions = ttGetSessions();
  const today    = new Date();
  let date       = new Date(today);
  let newSessions = [];

  for (const item of pending) {
    let hoursLeft = item.estimatedHours;
    while (hoursLeft > 0) {
      const dayName = DAYS[(date.getDay()+6)%7];
      const avail   = hrs[dayName] || 0;
      const ds      = date.toISOString().slice(0,10);
      const existing = sessions.filter(s=>s.date===ds).reduce((sum,s)=>sum+(s.durationHours||0),0);
      const free    = avail - existing;
      if (free > 0) {
        const dur = Math.min(free, hoursLeft);
        newSessions.push({ id:'ts_'+Date.now()+'_'+Math.random().toString(36).slice(2), date:ds, topic:item.topic, goalId:item.goalId, learningItemId:item.learningItemId, durationHours:dur, status:'Scheduled' });
        hoursLeft -= dur;
      }
      date.setDate(date.getDate()+1);
      if (date > new Date(today.getTime() + 90*24*3600000)) break; // max 90 days out
    }
  }

  if (!newSessions.length) { alert('No available study hours found. Set up your study hours first.'); return; }
  ttSaveSessions([...sessions, ...newSessions]);
  stLog('timetable_auto', `Auto-scheduled ${newSessions.length} sessions`);
  alert(`Scheduled ${newSessions.length} session${newSessions.length!==1?'s':''}!`);
  timetableRender();
}

// ── Session Modal ───────────────────────────────────────────────────
function openSessionModal(id) {
  const sessions = ttGetSessions();
  const s = id ? sessions.find(x => x.id === id) : null;

  document.getElementById('session-modal-title').textContent = s ? 'Edit Session' : 'Add Study Session';
  document.getElementById('sess-id').value       = s ? s.id : '';
  document.getElementById('sess-topic').value    = s ? s.topic : '';
  document.getElementById('sess-date').value     = s ? s.date : new Date().toISOString().slice(0,10);
  document.getElementById('sess-duration').value = s ? (s.durationHours || '') : '';
  document.getElementById('sess-start').value    = s ? (s.startTime || '') : '';
  document.getElementById('sess-end').value      = s ? (s.endTime || '') : '';
  document.getElementById('sess-status').value   = s ? s.status : 'Scheduled';
  document.getElementById('sess-notes').value    = s ? (s.notes || '') : '';
  document.getElementById('sess-error').textContent = '';

  // Populate goal select
  const goalSel = document.getElementById('sess-goal');
  const goals   = stRead('goals');
  goalSel.innerHTML = '<option value="">— Not linked to a goal —</option>' +
    goals.map(g => `<option value="${g.id}" ${s && s.goalId===g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('');

  document.getElementById('session-modal').classList.add('open');
  setTimeout(() => document.getElementById('sess-topic').focus(), 80);
}

function closeSessionModal() {
  document.getElementById('session-modal').classList.remove('open');
}

function saveSessionForm() {
  const topic    = document.getElementById('sess-topic').value.trim();
  const date     = document.getElementById('sess-date').value;
  const duration = parseFloat(document.getElementById('sess-duration').value);
  const errEl    = document.getElementById('sess-error');

  if (!topic) { errEl.textContent = 'Topic is required.'; document.getElementById('sess-topic').focus(); return; }
  if (!date)  { errEl.textContent = 'Date is required.';  document.getElementById('sess-date').focus();  return; }
  if (!duration || duration <= 0) { errEl.textContent = 'Duration must be greater than 0.'; document.getElementById('sess-duration').focus(); return; }
  errEl.textContent = '';

  const id = document.getElementById('sess-id').value;
  const session = {
    id          : id || ('ts_' + Date.now()),
    date,
    topic,
    goalId      : document.getElementById('sess-goal').value || null,
    startTime   : document.getElementById('sess-start').value || '',
    endTime     : document.getElementById('sess-end').value || '',
    durationHours: duration,
    notes       : document.getElementById('sess-notes').value.trim(),
    status      : document.getElementById('sess-status').value
  };

  const sessions = ttGetSessions();
  const idx = id ? sessions.findIndex(s => s.id === id) : -1;
  if (idx > -1) sessions[idx] = session;
  else sessions.push(session);

  ttSaveSessions(sessions);
  stLog('timetable_session', (id ? 'Updated' : 'Added') + ' session: ' + topic);
  closeSessionModal();
  timetableRender();
  if (typeof dashboardRender === 'function') dashboardRender();
}

document.addEventListener('DOMContentLoaded', timetableRender);
