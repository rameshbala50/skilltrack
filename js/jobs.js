/* ──────────────────────────────────────────
   SkillTrack — Job Tracker Module
────────────────────────────────────────── */
'use strict';

const JOB_STATUSES = [
  'Job Added','Can Be Applied','Applied','Phone Screen',
  'Interview','Offer','Accepted','Rejected','Withdrawn','No Response','Not Interested','Duplicate'
];

const JOB_STATUS_META = {
  'Job Added':      { emoji:'📌', color:'#64748b', bg:'#f1f5f9', border:'#cbd5e1' },
  'Can Be Applied': { emoji:'📋', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
  'Applied':        { emoji:'📨', color:'#059669', bg:'#ecfdf5', border:'#a7f3d0' },
  'Phone Screen':   { emoji:'🎙️', color:'#4338ca', bg:'#eef2ff', border:'#c7d2fe' },
  'Interview':      { emoji:'📅', color:'#7c3aed', bg:'#faf5ff', border:'#e9d5ff' },
  'Offer':          { emoji:'🎉', color:'#ea580c', bg:'#fff7ed', border:'#fed7aa' },
  'Accepted':       { emoji:'✅', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  'Rejected':       { emoji:'❌', color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
  'Withdrawn':      { emoji:'🚪', color:'#64748b', bg:'#f8fafc', border:'#e2e8f0' },
  'No Response':    { emoji:'🔇', color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb' },
  'Not Interested': { emoji:'👎', color:'#9ca3af', bg:'#f3f4f6', border:'#d1d5db' },
  'Duplicate':      { emoji:'🔁', color:'#78716c', bg:'#f5f5f4', border:'#d6d3d1' },
  // Legacy mapping — treat old 'Wishlist' and 'To Apply' as new statuses
  'Wishlist':       { emoji:'📌', color:'#64748b', bg:'#f1f5f9', border:'#cbd5e1' },
  'To Apply':       { emoji:'📋', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
};

// Migrate legacy statuses on read
function _jobMigrateStatus(s) {
  if (s === 'Wishlist') return 'Job Added';
  if (s === 'To Apply') return 'Can Be Applied';
  return s;
}

// Format date + time: "25-MAR-2026 14:30:05"
function _fmtDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return esc(isoStr);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dd = String(d.getDate()).padStart(2,'0');
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  return `${dd}-${mon}-${yyyy} ${hh}:${mm}:${ss}`;
}

// Format date only: "25-MAR-2026"
function _fmtDateDMY(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return esc(isoStr);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return String(d.getDate()).padStart(2,'0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
}

// Format "x days ago" label from a date string
function _daysAgoLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffMs = now - d;
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return ' <span style="color:var(--muted);font-size:.8rem">(today)</span>';
  if (days === 1) return ' <span style="color:var(--muted);font-size:.8rem">(1 day ago)</span>';
  return ` <span style="color:var(--muted);font-size:.8rem">(${days} days ago)</span>`;
}

// Generate readable Job ID: JOB-AIENG-001
function _generateJobId(role) {
  const jobs = stRead('jobs');
  // Create short role abbreviation (first letters of up to 3 words, max 6 chars)
  const words = (role || 'JOB').toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  let abbr = '';
  if (words.length === 1) {
    abbr = words[0].slice(0, 5);
  } else {
    abbr = words.slice(0, 3).map(w => w.slice(0, 2)).join('');
  }
  if (!abbr) abbr = 'JOB';

  // Find next sequence number for this prefix
  const prefix = 'JOB-' + abbr + '-';
  let maxSeq = 0;
  jobs.forEach(j => {
    if (j.jobId && j.jobId.startsWith(prefix)) {
      const num = parseInt(j.jobId.slice(prefix.length), 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  return prefix + String(maxSeq + 1).padStart(3, '0');
}

// Backfill jobId for any jobs missing one
function _jobBackfillIds() {
  const jobs = stRead('jobs');
  let changed = false;
  jobs.forEach(j => {
    if (!j.jobId) {
      j.jobId = _generateJobId(j.role);
      changed = true;
    }
  });
  if (changed) stWrite('jobs', jobs);
}

const JOB_ROLE_CATS = {
  'AIENG':  'AI Engineer',
  'MLENG':  'ML Engineer',
  'DATASC': 'Data Scientist',
  'SNFSA':  'Snowflake Architect',
  'OTH':    'Other'
};

function _jobRoleCat(job) {
  if (!job.jobId) return 'OTH';
  const m = job.jobId.match(/^JOB-(\w+)-/);
  return m ? m[1] : 'OTH';
}

function _jobRoleCatLabel(job) {
  return JOB_ROLE_CATS[_jobRoleCat(job)] || 'Other';
}

const JOB_SOURCES = ['LinkedIn','Indeed','Dice','Glassdoor','Company Website','Referral','Recruiter','Other'];

// Map role title to standard job ID prefix
function _roleToJobPrefix(role) {
  const r = (role || '').toLowerCase();
  if (r.includes('snowflake') && (r.includes('architect') || r.includes('engineer') || r.includes('admin'))) return 'SNFSA';
  if (r.includes('ai ') || r.includes('artificial intelligence') || r.includes('agentic') || r.includes('ai/ml')) return 'AIENG';
  if (r.includes('ml ') || r.includes('machine learning')) return 'MLENG';
  if (r.includes('data scien')) return 'DATASC';
  return 'OTH';
}

// Re-generate job ID if the role category changed
function _maybeUpdateJobId(job) {
  const newPrefix = _roleToJobPrefix(job.role);
  const currentPrefix = job.jobId ? job.jobId.match(/^JOB-(\w+)-/) : null;
  if (currentPrefix && currentPrefix[1] === newPrefix) return; // already correct
  // Generate new ID with the correct prefix
  const jobs = stRead('jobs');
  const fullPrefix = 'JOB-' + newPrefix + '-';
  let maxSeq = 0;
  jobs.forEach(j => {
    if (j.jobId && j.jobId.startsWith(fullPrefix)) {
      const num = parseInt(j.jobId.slice(fullPrefix.length), 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  job.jobId = fullPrefix + String(maxSeq + 1).padStart(4, '0');
}

// Apply AI metadata to job — ALWAYS overwrites all fields
function _applyAiMeta(job, r) {
  job.aiAnalysis = r;
  const meta = r.jobMeta || {};
  // Always update role from AI
  if (r.jobTitle)          job.role = r.jobTitle;
  if (r.company)           job.company = r.company;
  // Always overwrite from jobMeta
  if (meta.source)         job.source = meta.source;
  if (meta.clientName)     job.clientName = meta.clientName;
  if (meta.city)           job.city = meta.city;
  if (meta.state)          job.state = meta.state;
  if (meta.country)        job.country = meta.country;
  if (meta.employerType)   job.employerType = meta.employerType;
  if (meta.employmentType) job.employmentType = meta.employmentType;
  if (meta.salary)         job.salary = meta.salary;
  if (meta.workMode)       job.workMode = meta.workMode;
  if (meta.postedDate)     job.postedDate = meta.postedDate;
  // Update job ID if role category changed
  _maybeUpdateJobId(job);
  // Check for duplicates (same company + role + city, different job id)
  _markDuplicateIfNeeded(job);
  // Timestamps
  job.modifiedAt = new Date().toISOString();
  job.modifiedBy = (window._currentUser || {}).name || (window._currentUser || {}).email || '';
}

// Mark job as Duplicate if another job has same company + role + city (case-insensitive)
function _markDuplicateIfNeeded(job) {
  if (job.status === 'Duplicate') return; // already marked
  if (!job.company || !job.role) return; // can't compare without company/role
  const jobs = stRead('jobs');
  const co = job.company.toLowerCase().trim();
  const ro = job.role.toLowerCase().trim();
  const ci = (job.city || '').toLowerCase().trim();
  const dup = jobs.find(j =>
    j.id !== job.id &&
    j.status !== 'Duplicate' &&
    (j.company || '').toLowerCase().trim() === co &&
    (j.role || '').toLowerCase().trim() === ro &&
    (j.city || '').toLowerCase().trim() === ci
  );
  if (dup) {
    job.status = 'Duplicate';
    job.notes = (job.notes ? job.notes + '\n' : '') + 'Duplicate of ' + (dup.jobId || dup.id);
  }
}

// Shared score colour helper (also used in jobposting.js)
function _scoreColor(score) {
  return score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';
}

let _jobView           = 'table';
let _jobSearch         = '';
let _jobPage           = 1;
const _jobPageSize     = 50;

function _jobMatchesSearch(j, q) {
  if (!q) return true;
  const fields = [
    j.jobId, j.role, j.company, j.clientName, j.status,
    j.city, j.state, j.country, j.location, j.workMode,
    j.employmentType, j.employerType, j.source, j.salary,
    j.linkedGoal, j.notes
  ];
  return fields.some(f => f && f.toLowerCase().includes(q));
}

let _jobSearchTimer = null;
function jobsSearchDebounced() {
  clearTimeout(_jobSearchTimer);
  _jobSearchTimer = setTimeout(() => {
    _jobSearch = (document.getElementById('jobs-search')?.value || '').trim();
    _jobPage = 1;
    jobsRender();
  }, 300);
}
let _jobStatusFilter   = 'except-not-interested';
let _jobCompanyFilter  = 'all';
let _jobSourceFilter   = 'all';
let _jobLocationFilter = 'all';
let _jobEmpTypeFilter  = 'all';
let _jobRoleCatFilter  = 'all';
let _jobGoalFilter     = 'all';
let _jobDateFilter     = 'all';
let _jobIdFilter       = 'all';
let _jobSelectedId     = null;   // currently selected row id
let _jobSortCol        = 'addedAt'; // current sort column
let _jobSortAsc        = false;     // sort direction (false = newest first)

function jobsApplyFilters() {
  _jobStatusFilter   = document.getElementById('jobs-filter-status')?.value || 'all';
  _jobRoleCatFilter  = document.getElementById('jobs-filter-rolecat')?.value || 'all';
  _jobCompanyFilter  = document.getElementById('jobs-filter-company')?.value || 'all';
  _jobLocationFilter = document.getElementById('jobs-filter-state')?.value || 'all';
  _jobEmpTypeFilter  = document.getElementById('jobs-filter-emptype')?.value || 'all';
  _jobSourceFilter   = document.getElementById('jobs-filter-source')?.value || 'all';
  _jobGoalFilter     = document.getElementById('jobs-filter-goal')?.value || 'all';
  _jobDateFilter     = document.getElementById('jobs-filter-date')?.value || 'all';
  _jobIdFilter       = document.getElementById('jobs-filter-jobid')?.value || 'all';
  _jobPage = 1;
  jobsRender();
}

function jobsSortBy(col) {
  if (_jobSortCol === col) {
    _jobSortAsc = !_jobSortAsc;
  } else {
    _jobSortCol = col;
    _jobSortAsc = true;
  }
  _jobPage = 1;
  jobsRender();
}

function _jobSortFn(a, b) {
  const dir = _jobSortAsc ? 1 : -1;
  let va, vb;
  switch (_jobSortCol) {
    case 'jobId':       va = (a.jobId || '').toLowerCase();   vb = (b.jobId || '').toLowerCase();   break;
    case 'role':        va = (a.role || '').toLowerCase();    vb = (b.role || '').toLowerCase();    break;
    case 'company':     va = (a.company || '').toLowerCase(); vb = (b.company || '').toLowerCase(); break;
    case 'status':      va = JOB_STATUSES.indexOf(_jobMigrateStatus(a.status)); vb = JOB_STATUSES.indexOf(_jobMigrateStatus(b.status)); return (va - vb) * dir;
    case 'score':       va = a.aiAnalysis ? a.aiAnalysis.matchScore : -1; vb = b.aiAnalysis ? b.aiAnalysis.matchScore : -1; return (va - vb) * dir;
    case 'state':       va = (a.state || '').toLowerCase();   vb = (b.state || '').toLowerCase();   break;
    case 'city':        va = (a.city || '').toLowerCase();    vb = (b.city || '').toLowerCase();    break;
    case 'location':    va = ((a.city||'') + (a.state||'')).toLowerCase(); vb = ((b.city||'') + (b.state||'')).toLowerCase(); break;
    case 'source':      va = (a.source || '').toLowerCase();  vb = (b.source || '').toLowerCase();  break;
    case 'salary':      va = (a.salary || '').toLowerCase();  vb = (b.salary || '').toLowerCase();  break;
    case 'addedAt':     va = a.addedAt || '';                 vb = b.addedAt || '';                 break;
    case 'appliedDate': va = a.appliedDate || '';             vb = b.appliedDate || '';             break;
    default:            va = a.addedAt || '';                 vb = b.addedAt || '';                 break;
  }
  if (va < vb) return -1 * dir;
  if (va > vb) return  1 * dir;
  return 0;
}

function _jobPopulateFilters(jobs) {
  const stsSel   = document.getElementById('jobs-filter-status');
  const catSel   = document.getElementById('jobs-filter-rolecat');
  const compSel  = document.getElementById('jobs-filter-company');
  const stateSel = document.getElementById('jobs-filter-state');
  const empSel   = document.getElementById('jobs-filter-emptype');
  const srcSel   = document.getElementById('jobs-filter-source');
  const goalSel  = document.getElementById('jobs-filter-goal');
  const dateSel  = document.getElementById('jobs-filter-date');
  const idSel    = document.getElementById('jobs-filter-jobid');

  const populate = (sel, values, curVal, label) => {
    if (!sel) return;
    sel.innerHTML = `<option value="all">${label}</option>` +
      values.map(v => `<option value="${esc(v.value || v)}"${(v.value || v) === curVal ? ' selected' : ''}>${esc(v.label || v)}</option>`).join('');
  };

  const statuses  = JOB_STATUSES.filter(s => jobs.some(j => _jobMigrateStatus(j.status) === s));
  const usedCats  = [...new Set(jobs.map(j => _jobRoleCat(j)))];
  const catOpts   = Object.entries(JOB_ROLE_CATS).filter(([k]) => usedCats.includes(k)).map(([k, v]) => ({ value: k, label: v }));
  const companies = [...new Set(jobs.map(j => j.company).filter(Boolean))].sort();
  const states    = [...new Set(jobs.map(j => j.state).filter(Boolean))].sort();
  const emps      = [...new Set(jobs.map(j => j.employmentType).filter(Boolean))].sort();
  const srcs      = [...new Set(jobs.map(j => j.source).filter(Boolean))].sort();
  const goals     = [...new Set(jobs.map(j => j.linkedGoal).filter(Boolean))].sort();
  // Added date: group by date string (e.g. "25-Mar-2026")
  const dateOpts = [...new Set(jobs.map(j => {
    if (!j.addedAt) return '';
    const d = new Date(j.addedAt);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
  }).filter(Boolean))].sort((a, b) => {
    // Sort newest first
    return new Date(b) - new Date(a);
  });
  // Job ID prefix (e.g. JOB-AIENG, JOB-MLENG, JOB-OTH)
  const idPrefixes = [...new Set(jobs.map(j => {
    if (!j.jobId) return '';
    const m = j.jobId.match(/^(JOB-[A-Z]+)/);
    return m ? m[1] : '';
  }).filter(Boolean))].sort();

  // Add "Except Not Interested" as first option after "All"
  const stsOpts = [{ value: 'except-not-interested', label: 'Except Not Interested' }, ...statuses.map(s => ({ value: s, label: s }))];
  populate(stsSel, stsOpts, _jobStatusFilter, 'All Statuses');
  populate(catSel, catOpts, _jobRoleCatFilter, 'All Roles');
  populate(compSel, companies, _jobCompanyFilter, 'All Companies');
  populate(stateSel, states, _jobLocationFilter, 'All States');
  populate(empSel, emps, _jobEmpTypeFilter, 'All Types');
  populate(srcSel, srcs, _jobSourceFilter, 'All Sources');
  populate(goalSel, goals, _jobGoalFilter, 'All Goals');
  populate(dateSel, dateOpts, _jobDateFilter, 'All Dates');
  populate(idSel, idPrefixes, _jobIdFilter, 'All Job IDs');
}

// ── Render ──────────────────────────────────────────────────────────
function jobsRender() {
  const jobs  = stRead('jobs');
  const board = document.getElementById('jobs-board');
  if (!board) return;

  _jobPopulateFilters(jobs);

  const statEl = document.getElementById('stat-jobs');
  if (statEl) statEl.textContent = jobs.length;

  if (!jobs.length) {
    _jobSelectedId = null;
    board.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        <h3>No jobs tracked yet</h3>
        <p>Add job applications to track your progress from Wishlist to Offer.</p>
        <button class="btn btn-primary" onclick="openJobModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Job
        </button>
      </div>`;
    return;
  }

  if (_jobView === 'kanban') {
    const q = _jobSearch.toLowerCase();
    const filtered = jobs.filter(j =>
      !q || j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)
    );
    _renderKanban(filtered, board);
    return;
  }

  // Table view
  let filtered = [...jobs];
  const q = _jobSearch.toLowerCase();
  if (q) filtered = filtered.filter(j => _jobMatchesSearch(j, q));
  if (_jobStatusFilter === 'except-not-interested') filtered = filtered.filter(j => _jobMigrateStatus(j.status) !== 'Not Interested');
  else if (_jobStatusFilter !== 'all') filtered = filtered.filter(j => _jobMigrateStatus(j.status) === _jobStatusFilter);
  if (_jobRoleCatFilter !== 'all')  filtered = filtered.filter(j => _jobRoleCat(j) === _jobRoleCatFilter);
  if (_jobCompanyFilter !== 'all')  filtered = filtered.filter(j => j.company === _jobCompanyFilter);
  if (_jobLocationFilter !== 'all') filtered = filtered.filter(j => j.state === _jobLocationFilter);
  if (_jobEmpTypeFilter !== 'all')  filtered = filtered.filter(j => j.employmentType === _jobEmpTypeFilter);
  if (_jobSourceFilter !== 'all')   filtered = filtered.filter(j => j.source === _jobSourceFilter);
  if (_jobGoalFilter !== 'all')     filtered = filtered.filter(j => j.linkedGoal === _jobGoalFilter);
  if (_jobDateFilter !== 'all')     filtered = filtered.filter(j => {
    if (!j.addedAt) return false;
    const d = new Date(j.addedAt);
    return !isNaN(d) && d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) === _jobDateFilter;
  });
  if (_jobIdFilter !== 'all')       filtered = filtered.filter(j => j.jobId && j.jobId.startsWith(_jobIdFilter));

  // Sort
  filtered.sort(_jobSortFn);

  // Keep selection valid
  if (_jobSelectedId && !filtered.find(j => j.id === _jobSelectedId)) {
    _jobSelectedId = null;
  }

  // Paginate
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / _jobPageSize));
  if (_jobPage > totalPages) _jobPage = totalPages;
  const startIdx = (_jobPage - 1) * _jobPageSize;
  const pageJobs = filtered.slice(startIdx, startIdx + _jobPageSize);

  const tableHtml = totalFiltered
    ? _jobTableHtml(pageJobs)
    : '<div class="jobs-empty-filter"><p>No jobs match the current filters.</p></div>';

  const paginationHtml = totalPages > 1 ? `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 4px;font-size:12px;color:var(--muted)">
      <span>Showing ${startIdx + 1}–${Math.min(startIdx + _jobPageSize, totalFiltered)} of ${totalFiltered} jobs</span>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="btn btn-sm btn-ghost" onclick="jobsGoPage(1)" ${_jobPage===1?'disabled':''}>&laquo;</button>
        <button class="btn btn-sm btn-ghost" onclick="jobsGoPage(${_jobPage - 1})" ${_jobPage===1?'disabled':''}>&lsaquo; Prev</button>
        <span style="padding:0 8px">Page ${_jobPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-ghost" onclick="jobsGoPage(${_jobPage + 1})" ${_jobPage===totalPages?'disabled':''}>Next &rsaquo;</button>
        <button class="btn btn-sm btn-ghost" onclick="jobsGoPage(${totalPages})" ${_jobPage===totalPages?'disabled':''}>&raquo;</button>
      </div>
    </div>` : (totalFiltered ? `<div style="padding:4px;font-size:12px;color:var(--muted)">${totalFiltered} jobs</div>` : '');

  board.innerHTML = `
    ${_pipelineHtml(filtered)}
    ${paginationHtml}
    ${tableHtml}
    ${totalPages > 1 ? paginationHtml : ''}`;
}

function jobsGoPage(p) {
  _jobPage = p;
  _jobSelectedId = null;
  jobsRender();
}

// ── Pipeline Overview ──────────────────────────────────────────────
function _pipelineHtml(jobs) {
  const counts = {};
  JOB_STATUSES.forEach(s => counts[s] = 0);
  jobs.forEach(j => { const s = _jobMigrateStatus(j.status); if (counts[s] != null) counts[s]++; });
  const items = JOB_STATUSES.filter(s => counts[s] > 0).map(s => {
    const m = JOB_STATUS_META[s] || {};
    return `<div class="pipeline-item">
      <span class="pipeline-emoji">${m.emoji||''}</span>
      <span class="pipeline-label">${s}</span>
      <span class="pipeline-count" style="background:${m.color||'#64748b'}">${counts[s]}</span>
    </div>`;
  }).join('');
  return `<div class="pipeline-bar">${items}</div>`;
}

// ── Filter Bars ────────────────────────────────────────────────────
function _statusFilterHtml(jobs) {
  const used = new Set(jobs.map(j => j.status));
  const pills = JOB_STATUSES.filter(s => used.has(s)).map(s => {
    const m   = JOB_STATUS_META[s] || {};
    const act = _jobStatusFilter === s;
    return `<button class="jf-pill ${act ? 'jf-pill-active' : ''}"
      style="${act ? `background:${m.color};border-color:${m.color};color:#fff` : ''}"
      onclick="setJobStatusFilter('${s}', this)">${m.emoji||''} ${s}</button>`;
  });
  const allActive = _jobStatusFilter === 'all';
  return `<div class="jf-bar">
    <button class="jf-pill ${allActive ? 'jf-pill-active jf-pill-all' : ''}"
      onclick="setJobStatusFilter('all', this)">All <span class="jf-pill-cnt">${jobs.length}</span></button>
    ${pills.join('')}
  </div>`;
}

function _sourceFilterHtml(jobs) {
  const used = new Set(jobs.map(j => j.source).filter(Boolean));
  if (!used.size) return '';
  const pills = [...used].map(s => {
    const act = _jobSourceFilter === s;
    return `<button class="jf-pill jf-pill-src ${act ? 'jf-pill-src-active' : ''}"
      onclick="setJobSourceFilter('${s}', this)">${s}</button>`;
  });
  const allActive = _jobSourceFilter === 'all';
  return `<div class="jf-bar jf-bar-src">
    <span class="jf-src-label">Source:</span>
    <button class="jf-pill jf-pill-src ${allActive ? 'jf-pill-src-active' : ''}"
      onclick="setJobSourceFilter('all', this)">All</button>
    ${pills.join('')}
  </div>`;
}

function setJobStatusFilter(val) { _jobStatusFilter = val; jobsRender(); }
function setJobSourceFilter(val) { _jobSourceFilter = val; jobsRender(); }

// ── Card View (v2 layout) ─────────────────────────────────────────
const _JT_COL_COUNT = 10; // kept for compatibility

function _scoreColorV2(s) {
  if (s >= 75) return '#16a34a';
  if (s >= 50) return '#ca8a04';
  return '#dc2626';
}

function _jobTableHtml(jobs) {
  const cards = jobs.map((j, i) => {
    const ai    = j.aiAnalysis;
    const score = ai ? ai.matchScore : null;
    const sc    = score != null ? _scoreColorV2(score) : null;
    const sel   = _jobSelectedId === j.id;
    const displayStatus = _jobMigrateStatus(j.status);
    const m     = JOB_STATUS_META[displayStatus] || JOB_STATUS_META[j.status] || {};
    const loc   = [j.city, j.state].filter(Boolean).join(', ');
    const bg    = i % 2 === 0 ? 'var(--surface)' : 'var(--bg)';

    let html = `<div class="jt2-card ${sel ? 'jt2-card-sel' : ''}" style="border-left:4px solid ${m.color || '#94a3b8'};background:${bg}" onclick="jobsSelectRow('${j.id}')">
      <div class="jt2-card-head">
        <div class="jt2-card-info">
          <div class="jt2-role">${esc(j.role)}</div>
          <div class="jt2-company">${esc(j.company)}${loc ? ' · ' + esc(loc) : ''}</div>
        </div>
        <div class="jt2-right">
          ${score != null ? `<span class="jt2-score" style="color:${sc}">${score}%</span>` : ''}
          <span class="jt2-status" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.emoji} ${displayStatus}</span>
          <button class="jt2-action-btn jt2-edit-btn" title="Edit" onclick="event.stopPropagation();openJobModal('${j.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="jt2-action-btn jt2-del-btn" title="Delete" onclick="event.stopPropagation();jobsDelete('${j.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
      <div class="jt2-meta">
        ${j.source ? `<span class="jt2-tag">${esc(j.source)}</span>` : ''}
        ${j.employmentType ? `<span class="jt2-tag">${esc(j.employmentType)}</span>` : ''}
        ${j.workMode ? `<span class="jt2-tag">${esc(j.workMode)}</span>` : ''}
        ${j.salary ? `<span class="jt2-tag jt2-salary">${esc(j.salary)}</span>` : ''}
        ${j.linkedGoal ? `<span class="jt2-tag jt2-goal">${esc(j.linkedGoal)}</span>` : ''}
        ${j.jobId ? `<span class="jt2-tag jt2-id">${esc(j.jobId)}</span>` : ''}
      </div>
    </div>`;

    // Detail pane below selected card
    if (sel) {
      const detailJob = stRead('jobs').find(x => x.id === j.id) || j;
      html += `<div class="jt2-detail-pane"><div class="jd-pane jd-pane-open jd-pane-inline">${_jobDetailPaneHtml(detailJob)}</div></div>`;
    }

    return html;
  }).join('');

  return cards;
}

// ── Row Selection & Inline Detail ─────────────────────────────────
function jobsSelectRow(id) {
  if (_jobSelectedId === id) {
    // Toggle off
    _jobSelectedId = null;
  } else {
    _jobSelectedId = id;
  }
  jobsRender();
  // Scroll to the detail pane if opened
  if (_jobSelectedId) {
    setTimeout(() => {
      const detailRow = document.querySelector('.jt2-detail-pane') || document.querySelector('.jt-detail-row');
      if (detailRow) detailRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
}

function jobsCloseDetail() {
  _jobSelectedId = null;
  jobsRender();
}

function _jobDetailPaneHtml(job) {
  const m  = JOB_STATUS_META[job.status] || JOB_STATUS_META['Wishlist'];
  const ai = job.aiAnalysis;

  // ── Header: role (title), company (sub), status, actions ──
  const headerHtml = `
    <div class="jd-header">
      <div class="jd-header-left">
        <div class="jd-title">
          <span class="jd-role">${esc(job.role)}</span>
        </div>
        <div class="jd-subtitle">
          <span class="jd-company">${esc(job.company)}</span>
          <span class="jd-status-badge" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.emoji} ${job.status}</span>
        </div>
      </div>
      <div class="jd-header-actions">
        <button class="btn btn-sm btn-ghost" onclick="openJobModal('${job.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="btn btn-sm btn-primary" id="jd-fullanalysis-${job.id}" onclick="jobsFullAnalysis('${job.id}')" title="Fetch description (if needed) + AI Analysis + Extract metadata">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Job Analysis
        </button>
        <button class="btn btn-sm btn-ghost" id="jd-reanalyze-${job.id}" onclick="jobsReAnalyze('${job.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Re-analyze
        </button>
        ${!job.jobText && job.url ? `<button class="btn btn-sm btn-ghost" id="jd-fetch-${job.id}" onclick="jobsFetchDesc('${job.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
          Fetch Job Desc
        </button>` : ''}
        <button class="jd-close-btn" onclick="jobsCloseDetail()" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>`;

  // ── Section 1: Job Details ──
  const _pill = (text, color) => `<span style="background:${color}15;color:${color};border:1px solid ${color}30;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600">${esc(text)}</span>`;
  const workModeColor = { 'Remote':'#16a34a', 'Hybrid':'#d97706', 'Onsite':'#2563eb' };

  const detailRows = [
    job.jobId       ? `<div class="jd-detail-row"><span class="jd-detail-label">Job ID</span><span class="jd-detail-value" style="font-family:var(--mono);font-size:.8rem;color:var(--primary)">${esc(job.jobId)}</span></div>` : '',
    `<div class="jd-detail-row"><span class="jd-detail-label">Role</span><span class="jd-detail-value" style="font-weight:600">${esc(job.role)}</span></div>`,
    `<div class="jd-detail-row"><span class="jd-detail-label">Company</span><span class="jd-detail-value">${esc(job.company)}</span></div>`,
    job.clientName  ? `<div class="jd-detail-row"><span class="jd-detail-label">Client</span><span class="jd-detail-value">${esc(job.clientName)}</span></div>` : '',
    `<div class="jd-detail-row"><span class="jd-detail-label">Status</span><span class="jd-detail-value"><span style="background:${m.bg};color:${m.color};border:1px solid ${m.border};padding:2px 8px;border-radius:4px;font-size:.75rem">${m.emoji} ${_jobMigrateStatus(job.status)}</span></span></div>`,
    job.addedAt     ? `<div class="jd-detail-row"><span class="jd-detail-label">Job Added</span><span class="jd-detail-value">${_fmtDateTime(job.addedAt)}</span></div>` : '',
    job.postedDate  ? `<div class="jd-detail-row"><span class="jd-detail-label">Job Post Date</span><span class="jd-detail-value">${_fmtDateDMY(job.postedDate)}${_daysAgoLabel(job.postedDate)}</span></div>` : '',
    `<div class="jd-detail-row"><span class="jd-detail-label">${job.updatedBy ? 'Modified By' : 'Added By'}</span><span class="jd-detail-value">${esc(job.updatedBy || job.addedBy || '—')}</span></div>`,
    job.updatedAt   ? `<div class="jd-detail-row"><span class="jd-detail-label">Modified</span><span class="jd-detail-value">${_fmtDateTime(job.updatedAt)}</span></div>` : '',
    job.appliedDate ? `<div class="jd-detail-row"><span class="jd-detail-label">Applied Date</span><span class="jd-detail-value">${_fmtDateDMY(job.appliedDate)}</span></div>` : '',
    job.salary      ? `<div class="jd-detail-row"><span class="jd-detail-label">Salary</span><span class="jd-detail-value" style="font-weight:600;color:#16a34a">${esc(job.salary)}</span></div>` : '',
    (job.city || job.state || job.country) ? `<div class="jd-detail-row"><span class="jd-detail-label">Location</span><span class="jd-detail-value">${esc([job.city, job.state, job.country].filter(Boolean).join(', '))}</span></div>` : '',
    job.workMode && job.workMode !== 'Not Specified' ? `<div class="jd-detail-row"><span class="jd-detail-label">Work Mode</span><span class="jd-detail-value">${_pill(job.workMode, workModeColor[job.workMode] || '#64748b')}</span></div>` : '',
    job.employmentType ? `<div class="jd-detail-row"><span class="jd-detail-label">Employment Type</span><span class="jd-detail-value">${_pill(job.employmentType, '#7c3aed')}</span></div>` : '',
    job.employerType   ? `<div class="jd-detail-row"><span class="jd-detail-label">Employer Type</span><span class="jd-detail-value">${_pill(job.employerType, '#2563eb')}</span></div>` : '',
    job.source      ? `<div class="jd-detail-row"><span class="jd-detail-label">Source</span><span class="jd-detail-value">${esc(job.source)}</span></div>` : '',
  ].filter(Boolean).join('');

  const notesHtml = job.notes ? `<div class="jd-notes-block"><span class="jd-detail-label">Notes</span><div class="jd-notes-text">${esc(job.notes)}</div></div>` : '';

  const jobDetailsSection = `
    <div class="jd-section">
      <div class="jd-section-title">Job Summary</div>
      <div class="jd-details-grid">${detailRows}</div>
      ${notesHtml}
    </div>`;

  // ── Section 2: AI Analysis ──
  const aiContent = ai ? _jobDetailAiHtml(ai, job.id) : `
    <div class="jd-no-ai">
      ${job.jobText ? `<p>No AI analysis yet.</p>
        <button class="btn btn-sm btn-primary" onclick="jobsReAnalyze('${job.id}')" id="jd-analyze-now-${job.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Analyze Now
        </button>` : `<p>No job description available. Fetch or paste the description first, then analyze.</p>`}
    </div>`;
  const aiSection = `
    <div class="jd-section">
      <div class="jd-section-title">AI Analysis</div>
      <div class="jd-ai-section">${aiContent}</div>
    </div>`;

  // ── Section 3: Job Description ──
  const jdRows = [
    job.url     ? `<div class="jd-detail-row"><span class="jd-detail-label">URL</span><a class="jd-detail-value jd-meta-link" href="${esc(job.url)}" target="_blank" rel="noopener">${esc(job.url.replace(/^https?:\/\//,'').slice(0,80))}</a></div>` : '',
    job.jobText ? `<div class="jd-jobtext">${esc(job.jobText.replace(/\n{3,}/g,'\n\n').trim()).replace(/\n/g, '<br>')}</div>` : '<div style="color:#94a3b8;font-size:.82rem">No job description saved. Paste the job posting in the Job Posting Analyser to capture it.</div>',
  ].filter(Boolean).join('');

  const jdSection = `
    <div class="jd-section">
      <div class="jd-section-title">Job Description</div>
      ${jdRows}
    </div>`;

  return `${headerHtml}${jobDetailsSection}${aiSection}${jdSection}`;
}

function _jobDetailAiHtml(ai, jobId) {
  const s = ai.matchScore || 0;
  const c = _scoreColor(s);
  const C = 2 * Math.PI * 30;
  const arc = C * (1 - s / 100);

  const col = (title, items, clr) => {
    if (!items || !items.length) return '';
    return `<div class="jd-ai-col">
      <div class="jd-ai-col-title" style="color:${clr}">${title}</div>
      <ul class="jd-ai-col-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>`;
  };

  return `
    <div class="jd-ai-top">
      <div class="jd-ai-ring">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" stroke-width="8"/>
          <circle cx="40" cy="40" r="30" fill="none" stroke="${c}" stroke-width="8"
            stroke-dasharray="${C}" stroke-dashoffset="${arc}"
            stroke-linecap="round" transform="rotate(-90 40 40)"/>
          <text x="40" y="36" text-anchor="middle" font-size="14" font-weight="700" fill="${c}">${s}%</text>
          <text x="40" y="50" text-anchor="middle" font-size="7" fill="#64748b">Match</text>
        </svg>
      </div>
      <div class="jd-ai-summary">
        <div class="jd-ai-level" style="color:${c}">${esc(ai.matchLevel || '')}</div>
        ${ai.overallAdvice ? `<p class="jd-ai-advice">${esc(ai.overallAdvice)}</p>` : ''}
      </div>
    </div>
    <div class="jd-ai-grid">
      ${col('Top Strengths',      ai.topStrengths,    '#16a34a')}
      ${col('Critical Gaps',      ai.criticalGaps,    '#dc2626')}
      ${col('Job-Specific Gaps',  ai.jobSpecificGaps, '#d97706')}
      ${col('Interview Topics',   ai.interviewTopics, '#2563eb')}
      ${col('Resume Tips',        ai.resumeTips,      '#7c3aed')}
    </div>
    ${ai.applicationStrategy ? `<p class="jd-ai-strategy"><b>Strategy:</b> ${esc(ai.applicationStrategy)}</p>` : ''}
    ${ai.salaryInsight ? `<p class="jd-ai-strategy"><b>Salary:</b> ${esc(ai.salaryInsight)}</p>` : ''}`;
}

// ── Re-analyze ─────────────────────────────────────────────────────
async function jobsFetchDesc(id) {
  const jobs = stRead('jobs');
  const job  = jobs.find(j => j.id === id);
  if (!job || !job.url) return;

  const btn = document.getElementById('jd-fetch-' + id);
  if (btn) { btn.disabled = true; btn.textContent = 'Fetching…'; }

  try {
    const res = await fetch('api/fetch.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: job.url })
    });
    const data = await res.json();

    const text = data.ok && data.data && data.data.text ? data.data.text : (data.ok && data.text ? data.text : '');
    if (text) {
      job.jobText = text.slice(0, 3000);
      stUpsert('jobs', job);
      stLog('job_fetched', 'Fetched job desc: ' + job.role + ' at ' + job.company);
      jobsRender();
    } else {
      if (btn) { btn.textContent = 'Fetch failed'; btn.style.color = '#dc2626'; }
      setTimeout(() => { if (btn) { btn.textContent = 'Fetch Job Desc'; btn.disabled = false; btn.style.color = ''; } }, 3000);
    }
  } catch (e) {
    if (btn) { btn.textContent = 'Fetch failed'; btn.style.color = '#dc2626'; }
    setTimeout(() => { if (btn) { btn.textContent = 'Fetch Job Desc'; btn.disabled = false; btn.style.color = ''; } }, 3000);
  }
}

// ── Bulk Job Analysis: runs full analysis on ALL filtered jobs ──────
let _bulkAnalysisRunning = false;

function _getFilteredJobs() {
  const allJobs = stRead('jobs');
  let filtered = [...allJobs];
  const q = _jobSearch.toLowerCase();
  if (q) filtered = filtered.filter(j => _jobMatchesSearch(j, q));
  if (_jobStatusFilter === 'except-not-interested') filtered = filtered.filter(j => _jobMigrateStatus(j.status) !== 'Not Interested');
  else if (_jobStatusFilter !== 'all') filtered = filtered.filter(j => _jobMigrateStatus(j.status) === _jobStatusFilter);
  if (_jobRoleCatFilter !== 'all')  filtered = filtered.filter(j => _jobRoleCat(j) === _jobRoleCatFilter);
  if (_jobCompanyFilter !== 'all')  filtered = filtered.filter(j => j.company === _jobCompanyFilter);
  if (_jobLocationFilter !== 'all') filtered = filtered.filter(j => j.state === _jobLocationFilter);
  if (_jobEmpTypeFilter !== 'all')  filtered = filtered.filter(j => j.employmentType === _jobEmpTypeFilter);
  if (_jobSourceFilter !== 'all')   filtered = filtered.filter(j => j.source === _jobSourceFilter);
  if (_jobGoalFilter !== 'all')     filtered = filtered.filter(j => j.linkedGoal === _jobGoalFilter);
  if (_jobDateFilter !== 'all')     filtered = filtered.filter(j => {
    if (!j.addedAt) return false;
    const d = new Date(j.addedAt);
    return !isNaN(d) && d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) === _jobDateFilter;
  });
  if (_jobIdFilter !== 'all')       filtered = filtered.filter(j => j.jobId && j.jobId.startsWith(_jobIdFilter));
  return filtered;
}

async function jobsBulkAnalysis() {
  if (_bulkAnalysisRunning) {
    _bulkAnalysisRunning = false; // stop signal
    return;
  }

  const allFiltered = _getFilteredJobs();
  if (!allFiltered.length) { alert('No jobs match the current filters.'); return; }

  const reanalyzeAll = document.getElementById('jobs-reanalyze-all')?.checked || false;
  // "Only missing" = no AI analysis OR no company OR no jobText
  const filtered = reanalyzeAll ? allFiltered
    : allFiltered.filter(j => !j.aiAnalysis || !j.company || !j.jobText || j.jobText.length < 50);

  if (!filtered.length) {
    alert('All ' + allFiltered.length + ' filtered jobs already have AI analysis, company, and description.\n\nCheck "Re-analyze all" to force re-analysis.');
    return;
  }

  const total = filtered.length;
  const needsFetch = filtered.filter(j => j.url && (!j.jobText || j.jobText.length < 50)).length;
  const avgSec = needsFetch > 0 ? Math.round((needsFetch * 11 + (total - needsFetch) * 8) / total) : 8;
  const estMin = Math.ceil(total * avgSec / 60);
  const estStr = estMin < 2 ? 'under 2 minutes' : 'about ' + estMin + ' minutes';

  const mode = reanalyzeAll ? 'RE-ANALYZE ALL' : 'ONLY MISSING';
  const msg = mode + ': ' + total + ' jobs' +
    (reanalyzeAll ? '' : ' (out of ' + allFiltered.length + ' filtered)') + '\n' +
    needsFetch + ' needing description fetch\n\n' +
    'Estimated time: ' + estStr + '\n\n' +
    'Click "Job Analysis" button again to stop.';
  if (!confirm(msg)) return;

  const btn = document.getElementById('jobs-bulk-analysis-btn');
  _bulkAnalysisRunning = true;
  const startTime = Date.now();

  const mySkills   = stRead('skills');
  const user       = window._currentUser || {};
  const skillsList = mySkills.map(s =>
    s.name + ' (' + s.proficiency + (s.group ? ', ' + s.group : '') + ')'
  ).join('; ') || 'none listed';

  let done = 0, failed = 0, fetched = 0;

  for (const job of filtered) {
    if (!_bulkAnalysisRunning) break;

    done++;
    // Calculate ETA
    const elapsed = (Date.now() - startTime) / 1000;
    const perJob = done > 1 ? elapsed / (done - 1) : avgSec;
    const remaining = Math.ceil((total - done) * perJob / 60);
    const eta = remaining < 1 ? '<1 min left' : remaining + ' min left';
    if (btn) btn.textContent = done + '/' + total + ' — ' + eta + ' (click to stop)';

    try {
      // Step 1: Fetch description if missing
      if (job.url && (!job.jobText || job.jobText.length < 50)) {
        try {
          const res = await fetch('api/fetch.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: job.url })
          });
          const data = await res.json();
          const text = data.ok && data.data && data.data.text ? data.data.text : '';
          if (text && text.length > 50) { job.jobText = text.slice(0, 5000); fetched++; }
        } catch (e) { /* continue */ }
      }

      // Step 2: AI Analysis (always run, even if already analyzed)
      const jobText = job.jobText || [job.role, job.company, job.notes].filter(Boolean).join(' — ').slice(0, 500);
      const r = await aiCall('job_analysis', {
        candidateName: user.name || 'Candidate',
        skills: skillsList,
        jobText: jobText || job.role + ' at ' + job.company
      });

      if (r.ok) {
        _applyAiMeta(job, r);
        stUpsert('jobs', job);
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }

    // Re-render every 5 jobs to show progress
    if (done % 5 === 0) jobsRender();
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(totalTime / 60);
  const secs = totalTime % 60;
  const timeStr = mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';

  _bulkAnalysisRunning = false;
  if (btn) {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> Job Analysis';
  }
  jobsRender();
  alert('Job Analysis complete!\n\n' +
    'Processed: ' + done + '/' + total + '\n' +
    'Descriptions fetched: ' + fetched + '\n' +
    'Failed: ' + failed + '\n' +
    'Time: ' + timeStr);
}

// ── Job Analysis: Fetch (if needed) → AI Analyze → Copy metadata ────
async function jobsFullAnalysis(id) {
  const jobs = stRead('jobs');
  const job  = jobs.find(j => j.id === id);
  if (!job) return;

  const btn = document.getElementById('jd-fullanalysis-' + id);
  if (btn) { btn.disabled = true; btn.textContent = 'Analysing…'; }

  // Step 1: Fetch description if missing and URL exists
  if (job.url && (!job.jobText || job.jobText.length < 50 || !job.company)) {
    if (btn) btn.textContent = 'Fetching…';
    try {
      const res = await fetch('api/fetch.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: job.url })
      });
      const data = await res.json();
      const text = data.ok && data.data && data.data.text ? data.data.text : '';
      if (text && text.length > 50) {
        job.jobText = text.slice(0, 5000);
        stLog('job_fetched', 'Fetched desc: ' + (job.role || job.jobId));
      }
    } catch (e) { /* continue with whatever text we have */ }
  }

  // Step 2: Run AI analysis
  if (btn) btn.textContent = 'AI Analysing…';
  const mySkills   = stRead('skills');
  const user       = window._currentUser || {};
  const skillsList = mySkills.map(s =>
    s.name + ' (' + s.proficiency + (s.group ? ', ' + s.group : '') + ')'
  ).join('; ') || 'none listed';
  const jobText = job.jobText || [job.role, job.company, job.notes].filter(Boolean).join(' — ').slice(0, 500);

  const r = await aiCall('job_analysis', {
    candidateName: user.name || 'Candidate',
    skills:        skillsList,
    jobText:       jobText || job.role + ' at ' + job.company
  });

  if (!r.ok) {
    if (btn) { btn.disabled = false; btn.textContent = 'Job Analysis'; }
    alert('Analysis failed: ' + (r.error || 'Unknown error'));
    return;
  }

  // Step 3: Always overwrite all metadata from AI
  _applyAiMeta(job, r);

  stUpsert('jobs', job);
  stLog('job_analysis', 'Full analysis: ' + job.role + ' at ' + job.company + ' → ' + (r.matchScore || '?') + '%');
  jobsRender();
}

async function jobsReAnalyze(id) {
  const jobs = stRead('jobs');
  const job  = jobs.find(j => j.id === id);
  if (!job) return;

  const btn = document.getElementById('jd-reanalyze-' + id);
  if (btn) { btn.disabled = true; btn.textContent = 'Analysing…'; }

  const mySkills   = stRead('skills');
  const user       = window._currentUser || {};
  const skillsList = mySkills.map(s =>
    s.name + ' (' + s.proficiency + (s.group ? ', ' + s.group : '') + ')'
  ).join('; ') || 'none listed';

  const jobText = job.jobText || [job.role, job.company, job.notes].filter(Boolean).join(' — ').slice(0, 500);

  const r = await aiCall('job_analysis', {
    candidateName: user.name || 'Candidate',
    skills:        skillsList,
    jobText:       jobText || job.role + ' at ' + job.company
  });

  if (!r.ok) {
    if (btn) { btn.disabled = false; btn.textContent = 'Re-analyze'; }
    alert('Analysis failed: ' + r.error);
    return;
  }

  _applyAiMeta(job, r);
  stUpsert('jobs', job);
  stLog('job_updated', 'Re-analysed: ' + job.role + ' at ' + job.company);

  // Re-render the full table (updates match score in row) and detail pane
  jobsRender();
}

// ── Board (secondary view) — vertical rows: status left, cards right ─
function _renderKanban(jobs, board) {
  // Only show statuses that have jobs or are common entry points
  const activeStatuses = JOB_STATUSES.filter(s =>
    jobs.some(j => j.status === s)
  );
  // Always show Wishlist and To Apply even if empty
  ['Wishlist', 'To Apply'].forEach(s => {
    if (!activeStatuses.includes(s)) activeStatuses.unshift(s);
  });

  const rows = activeStatuses.map(status => {
    const m    = JOB_STATUS_META[status] || {};
    const col  = jobs.filter(j => j.status === status);
    const cards = col.length
      ? col.map(j => _jobKanbanCard(j)).join('')
      : `<div class="kb-empty">No jobs</div>`;
    return `<div class="kb-row">
      <div class="kb-row-header" style="border-left:4px solid ${m.color||'#64748b'}">
        <div class="kb-row-status">
          <span class="kb-row-emoji">${m.emoji||''}</span>
          <span class="kb-row-label">${status}</span>
          <span class="kb-row-count" style="background:${m.color||'#64748b'}">${col.length}</span>
        </div>
        <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px" onclick="openJobModal(null,'${status}')">+ Add</button>
      </div>
      <div class="kb-row-cards">${cards}</div>
    </div>`;
  }).join('');

  board.innerHTML = `<div class="kb-board">${rows}</div>`;
}

function _jobKanbanCard(j) {
  const ai = j.aiAnalysis;
  const score = ai ? ai.matchScore : null;
  const scoreC = score != null ? _scoreColor(score) : null;
  return `<div class="kanban-card" onclick="openJobModal('${j.id}')">
    <div class="job-card-company">${esc(j.company)}</div>
    <div class="job-card-role">${esc(j.role)}</div>
    ${score != null ? `<span class="job-score-badge" style="background:${scoreC}20;color:${scoreC};border:1px solid ${scoreC}40">${score}% match</span>` : ''}
    ${j.source ? `<div class="job-card-meta">${esc(j.source)}</div>` : ''}
    ${j.appliedDate ? `<div class="job-card-meta">Applied: ${fmtDate(j.appliedDate)}</div>` : ''}
    <div style="display:flex;justify-content:flex-end;margin-top:6px">
      <button class="icon-btn icon-btn-danger" onclick="event.stopPropagation();jobsDelete('${j.id}')" title="Delete">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  </div>`;
}

// ── Delete ──────────────────────────────────────────────────────────
function jobsDelete(id) {
  const j = stRead('jobs').find(x => x.id === id);
  if (!confirm('Delete job at ' + (j ? j.company : '') + '?')) return;
  if (_jobSelectedId === id) _jobSelectedId = null;
  stDelete('jobs', id);
  stLog('job_deleted', 'Removed job: ' + (j ? j.role + ' at ' + j.company : ''));
  jobsRender();
}

// ── Modal ───────────────────────────────────────────────────────────
function openJobModal(id, defaultStatus) {
  const jobs = stRead('jobs');
  const job  = id ? jobs.find(j => j.id === id) : null;

  const _v = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  document.getElementById('job-modal-title').textContent = job ? 'Edit Job' : 'Add Job';
  _v('jm-id',           job ? job.id : '');
  _v('jm-jobid',        job ? (job.jobId || '') : '(auto)');
  _v('jm-role',         job ? job.role : '');
  _v('jm-company',      job ? job.company : '');
  _v('jm-status',       job ? _jobMigrateStatus(job.status) : (defaultStatus || 'Job Added'));
  _v('jm-source',       job ? (job.source || '') : '');
  _v('jm-salary',       job ? (job.salary || '') : '');
  _v('jm-applied',      job ? (job.appliedDate || '') : '');
  _v('jm-posted',       job ? (job.postedDate || '') : '');
  _v('jm-city',         job ? (job.city || '') : '');
  _v('jm-state',        job ? (job.state || '') : '');
  _v('jm-country',      job ? (job.country || 'USA') : 'USA');
  _v('jm-goal',         job ? (job.linkedGoalId || '') : '');
  _v('jm-emptype',      job ? (job.employmentType || '') : '');
  _v('jm-employertype', job ? (job.employerType || '') : '');
  _v('jm-workmode',     job ? (job.workMode || '') : '');
  _v('jm-url',          job ? (job.url || '') : '');
  _v('jm-notes',        job ? (job.notes || '') : '');
  _v('jm-jobtext',      job ? (job.jobText || '') : '');
  document.getElementById('jm-error').textContent = '';

  // Populate goal select
  const goalSel = document.getElementById('jm-goal');
  const goals   = stRead('goals');
  goalSel.innerHTML = '<option value="">— None —</option>' +
    goals.map(g => `<option value="${g.id}" ${job && job.linkedGoalId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('');

  document.getElementById('job-modal').classList.add('open');
  setTimeout(() => document.getElementById('jm-company').focus(), 80);
}

function closeJobModal() { document.getElementById('job-modal').classList.remove('open'); }

function jobsSaveForm() {
  const company = document.getElementById('jm-company').value.trim();
  const role    = document.getElementById('jm-role').value.trim();
  const errEl   = document.getElementById('jm-error');
  if (!company || !role) { errEl.textContent = 'Company and role are required.'; return; }
  errEl.textContent = '';

  const jobs     = stRead('jobs');
  const id       = document.getElementById('jm-id').value;
  const isNew    = !id;
  const existing = isNew ? null : jobs.find(j => j.id === id);

  const _fv = (fid) => (document.getElementById(fid) || {}).value || '';
  const cityVal    = _fv('jm-city').trim();
  const stateVal   = _fv('jm-state').trim();
  const countryVal = _fv('jm-country').trim() || 'USA';
  const goalId     = _fv('jm-goal');
  const goals      = stRead('goals');
  const linkedGoal = goals.find(g => g.id === goalId);

  const job = {
    id             : id || ('j_' + Date.now()),
    jobId          : existing ? (existing.jobId || _generateJobId(role)) : _generateJobId(role),
    company,
    role,
    url            : _fv('jm-url').trim(),
    status         : _fv('jm-status') || 'Job Added',
    salary         : _fv('jm-salary').trim(),
    city           : cityVal,
    state          : stateVal,
    country        : countryVal,
    location       : [cityVal, stateVal, countryVal].filter(Boolean).join(', '),
    appliedDate    : _fv('jm-applied'),
    postedDate     : _fv('jm-posted'),
    notes          : _fv('jm-notes').trim(),
    linkedGoalId   : goalId,
    linkedGoal     : linkedGoal ? linkedGoal.name : (existing ? existing.linkedGoal : ''),
    source         : _fv('jm-source'),
    employmentType : _fv('jm-emptype'),
    employerType   : _fv('jm-employertype'),
    workMode       : _fv('jm-workmode'),
    addedAt        : existing ? existing.addedAt : new Date().toISOString(),
    addedBy        : existing ? (existing.addedBy || '') : ((window._currentUser || {}).name || (window._currentUser || {}).email || ''),
    modifiedAt     : existing ? new Date().toISOString() : undefined,
    modifiedBy     : existing ? ((window._currentUser || {}).name || (window._currentUser || {}).email || '') : undefined,
    jobText        : _fv('jm-jobtext').trim() || (existing ? existing.jobText : '') || '',
    aiAnalysis     : existing ? existing.aiAnalysis : undefined,
    clientName     : existing ? existing.clientName : undefined,
  };

  stUpsert('jobs', job);
  stLog('job_' + (isNew ? 'added' : 'updated'), (isNew ? 'Added' : 'Updated') + ' job: ' + role + ' at ' + company);
  closeJobModal();
  jobsRender();
  if (typeof dashboardRender === 'function') dashboardRender();
}

// ── Report ──────────────────────────────────────────────────────────
function jobsOpenReport() {
  const modal = document.getElementById('job-report-modal');
  if (!modal) return;
  // Populate status filter options
  const sel = document.getElementById('jr-filter-status');
  if (sel) {
    const jobs = stRead('jobs');
    const used = [...new Set(jobs.map(j => j.status))];
    sel.innerHTML = '<option value="all">All Statuses</option>' +
      JOB_STATUSES.filter(s => used.includes(s))
        .map(s => `<option value="${s}">${JOB_STATUS_META[s]?.emoji || ''} ${s}</option>`).join('');
  }
  modal.classList.add('open');
  jobsRenderReport();
}

function jobsCloseReport() {
  document.getElementById('job-report-modal')?.classList.remove('open');
}

function jobsRenderReport() {
  const bodyEl = document.getElementById('jr-body');
  if (!bodyEl) return;

  let jobs = stRead('jobs');
  const statusF = document.getElementById('jr-filter-status')?.value || 'all';
  const sort    = document.getElementById('jr-sort')?.value || 'added';

  if (statusF !== 'all') jobs = jobs.filter(j => j.status === statusF);

  if (sort === 'score')   jobs.sort((a, b) => (b.aiAnalysis?.matchScore || 0) - (a.aiAnalysis?.matchScore || 0));
  if (sort === 'status')  jobs.sort((a, b) => JOB_STATUSES.indexOf(a.status) - JOB_STATUSES.indexOf(b.status));
  if (sort === 'company') jobs.sort((a, b) => a.company.localeCompare(b.company));
  if (sort === 'added')   jobs.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));

  // Pipeline summary
  const counts = {};
  JOB_STATUSES.forEach(s => counts[s] = 0);
  stRead('jobs').forEach(j => { if (counts[j.status] != null) counts[j.status]++; });
  const pipelinePills = JOB_STATUSES.filter(s => counts[s] > 0).map(s => {
    const m = JOB_STATUS_META[s] || {};
    return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;background:${m.bg};color:${m.color};border:1px solid ${m.border};margin:2px">${m.emoji} ${s} <b>${counts[s]}</b></span>`;
  }).join('');

  const totalAnalysed = jobs.filter(j => j.aiAnalysis).length;
  const avgScore = totalAnalysed
    ? Math.round(jobs.filter(j => j.aiAnalysis).reduce((s, j) => s + (j.aiAnalysis.matchScore || 0), 0) / totalAnalysed)
    : null;

  const rows = jobs.map(j => {
    const m     = JOB_STATUS_META[j.status] || JOB_STATUS_META['Wishlist'];
    const ai    = j.aiAnalysis;
    const score = ai ? ai.matchScore : null;
    const c     = score != null ? _scoreColor(score) : '#64748b';
    return `<tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:10px 12px;font-weight:600;color:#1e293b">${esc(j.company)}</td>
      <td style="padding:10px 12px;color:#475569">${esc(j.role)}</td>
      <td style="padding:10px 12px">
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:${m.bg};color:${m.color};border:1px solid ${m.border};white-space:nowrap">${m.emoji} ${j.status}</span>
      </td>
      <td style="padding:10px 12px;text-align:center">
        ${score != null ? `<span style="font-size:12px;font-weight:700;color:${c}">${score}%</span>` : '<span style="color:#94a3b8">—</span>'}
      </td>
      <td style="padding:10px 12px;font-size:12px;color:#64748b">${j.source || '—'}</td>
      <td style="padding:10px 12px;font-size:12px;color:#64748b">${j.appliedDate ? fmtDate(j.appliedDate) : '—'}</td>
      <td style="padding:10px 12px;font-size:12px;color:#64748b;max-width:180px">${ai && ai.overallAdvice ? esc(ai.overallAdvice.slice(0, 80)) + (ai.overallAdvice.length > 80 ? '…' : '') : '—'}</td>
    </tr>`;
  }).join('');

  const user = window._currentUser || {};
  const dateStr = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

  bodyEl.innerHTML = `
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#64748b;margin-bottom:8px">Generated ${dateStr}${user.name ? ' · ' + esc(user.name) : ''}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">${pipelinePills}</div>
      <div style="display:flex;gap:16px;font-size:13px;color:#475569">
        <span>Total tracked: <b>${stRead('jobs').length}</b></span>
        ${avgScore != null ? `<span>Avg AI match: <b style="color:${_scoreColor(avgScore)}">${avgScore}%</b></span>` : ''}
        <span>Showing: <b>${jobs.length}</b></span>
      </div>
    </div>
    ${jobs.length ? `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:8px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Company</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Role</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Status</th>
            <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Match</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Source</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Applied</th>
            <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">AI Advice</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` : '<div style="text-align:center;padding:32px;color:#94a3b8">No jobs match this filter.</div>'}`;

  document.getElementById('jr-title').textContent = `Job Tracker Report (${jobs.length} job${jobs.length !== 1 ? 's' : ''})`;
}

function jobsPrintReport() {
  const body = document.getElementById('jr-body')?.innerHTML || '';
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Job Tracker Report</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#1e293b}table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;text-align:left;border:1px solid #e2e8f0}th{background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:.04em}tr:nth-child(even){background:#f8fafc}@media print{body{padding:0}}</style>
    </head><body>${body}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
}

function jobsCopyReport() {
  const jobs = stRead('jobs');
  const lines = ['Company\tRole\tStatus\tMatch Score\tSource\tApplied Date\tAI Advice'];
  jobs.forEach(j => {
    const score = j.aiAnalysis ? j.aiAnalysis.matchScore + '%' : '—';
    const advice = j.aiAnalysis ? (j.aiAnalysis.overallAdvice || '').replace(/\t|\n/g, ' ') : '—';
    lines.push([j.company, j.role, j.status, score, j.source || '—', j.appliedDate || '—', advice].join('\t'));
  });
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.querySelector('#job-report-modal .btn-ghost');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`, 2000); }
  });
}

// ── View toggle ─────────────────────────────────────────────────────
function setJobView(view, btn) {
  _jobView = view;
  _jobSelectedId = null;
  document.querySelectorAll('#panel-jobs .view-toggle .pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  jobsRender();
}

// ── Init ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('jobs-search');
  if (search) search.addEventListener('input', jobsSearchDebounced);
  // _jobBackfillIds() and jobsRender() called by app.js after stInit() completes
});
