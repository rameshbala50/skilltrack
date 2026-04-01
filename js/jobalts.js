/* ──────────────────────────────────────────
   SkillTrack — Job Tracker v2 (Card Layout)
────────────────────────────────────────── */
'use strict';

let _jt2SelectedId = null;

function _altScoreColor(s) {
  if (s >= 75) return '#16a34a';
  if (s >= 50) return '#ca8a04';
  return '#dc2626';
}

function _jt2GetFilteredJobs() {
  let jobs = stRead('jobs');
  // Use same filters as main tracker
  const q = _jobSearch ? _jobSearch.toLowerCase() : '';
  if (q) jobs = jobs.filter(j => _jobMatchesSearch(j, q));
  if (_jobStatusFilter === 'except-not-interested') jobs = jobs.filter(j => _jobMigrateStatus(j.status) !== 'Not Interested');
  else if (_jobStatusFilter !== 'all') jobs = jobs.filter(j => _jobMigrateStatus(j.status) === _jobStatusFilter);
  if (_jobRoleCatFilter !== 'all') jobs = jobs.filter(j => _jobRoleCat(j) === _jobRoleCatFilter);
  if (_jobCompanyFilter !== 'all') jobs = jobs.filter(j => j.company === _jobCompanyFilter);
  if (_jobLocationFilter !== 'all') jobs = jobs.filter(j => j.state === _jobLocationFilter);
  if (_jobEmpTypeFilter !== 'all') jobs = jobs.filter(j => j.employmentType === _jobEmpTypeFilter);
  if (_jobSourceFilter !== 'all') jobs = jobs.filter(j => j.source === _jobSourceFilter);
  if (_jobGoalFilter !== 'all') jobs = jobs.filter(j => j.linkedGoal === _jobGoalFilter);
  if (_jobIdFilter !== 'all') jobs = jobs.filter(j => j.jobId && j.jobId.startsWith(_jobIdFilter));
  jobs.sort(_jobSortFn);
  return jobs;
}

function _jt2PopulateFilters(jobs) {
  const populate = (sel, values, curVal, label) => {
    if (!sel) return;
    sel.innerHTML = `<option value="all">${label}</option>` +
      values.map(v => `<option value="${esc(v.value || v)}"${(v.value || v) === curVal ? ' selected' : ''}>${esc(v.label || v)}</option>`).join('');
  };
  const stsSel  = document.getElementById('jt2-filter-status');
  const goalSel = document.getElementById('jt2-filter-goal');
  const srcSel  = document.getElementById('jt2-filter-source');
  const stSel   = document.getElementById('jt2-filter-state');

  const statuses = JOB_STATUSES.filter(s => jobs.some(j => _jobMigrateStatus(j.status) === s));
  const stsOpts = [{ value: 'except-not-interested', label: 'Except Not Interested' }, ...statuses.map(s => ({ value: s, label: s }))];
  const goals   = [...new Set(jobs.map(j => j.linkedGoal).filter(Boolean))].sort();
  const sources = [...new Set(jobs.map(j => j.source).filter(Boolean))].sort();
  const states  = [...new Set(jobs.map(j => j.state).filter(Boolean))].sort();

  populate(stsSel, stsOpts, _jobStatusFilter, 'All Statuses');
  populate(goalSel, goals, _jobGoalFilter, 'All Goals');
  populate(srcSel, sources, _jobSourceFilter, 'All Sources');
  populate(stSel, states, _jobLocationFilter, 'All States');
}

function jt2ApplyFilters() {
  _jobStatusFilter   = document.getElementById('jt2-filter-status')?.value || 'all';
  _jobGoalFilter     = document.getElementById('jt2-filter-goal')?.value || 'all';
  _jobSourceFilter   = document.getElementById('jt2-filter-source')?.value || 'all';
  _jobLocationFilter = document.getElementById('jt2-filter-state')?.value || 'all';
  _jobPage = 1;
  _jt2SelectedId = null;
  jobTracker2Render();
}

function jobTracker2Render() {
  const el = document.getElementById('jt2-board');
  if (!el) return;
  const allJobs = stRead('jobs');
  _jt2PopulateFilters(allJobs);
  const jobs = _jt2GetFilteredJobs();

  if (!jobs.length) {
    el.innerHTML = '<div class="empty-state"><h3>No jobs match filters</h3><p>' + allJobs.length + ' total jobs</p></div>';
    return;
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(jobs.length / _jobPageSize));
  if (_jobPage > totalPages) _jobPage = totalPages;
  const startIdx = (_jobPage - 1) * _jobPageSize;
  const pageJobs = jobs.slice(startIdx, startIdx + _jobPageSize);

  const paginationHtml = totalPages > 1 ? `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 4px;font-size:12px;color:var(--muted)">
      <span>Showing ${startIdx + 1}–${Math.min(startIdx + _jobPageSize, jobs.length)} of ${jobs.length} jobs</span>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="btn btn-sm btn-ghost" onclick="_jt2Page(1)" ${_jobPage===1?'disabled':''}>&laquo;</button>
        <button class="btn btn-sm btn-ghost" onclick="_jt2Page(${_jobPage - 1})" ${_jobPage===1?'disabled':''}>&lsaquo; Prev</button>
        <span style="padding:0 8px">Page ${_jobPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-ghost" onclick="_jt2Page(${_jobPage + 1})" ${_jobPage===totalPages?'disabled':''}>Next &rsaquo;</button>
        <button class="btn btn-sm btn-ghost" onclick="_jt2Page(${totalPages})" ${_jobPage===totalPages?'disabled':''}>&raquo;</button>
      </div>
    </div>` : `<div style="padding:4px;font-size:12px;color:var(--muted)">${jobs.length} jobs</div>`;

  const cardsHtml = pageJobs.map((j, i) => {
    const s = _jobMigrateStatus(j.status);
    const m = JOB_STATUS_META[s] || {};
    const ai = j.aiAnalysis;
    const score = ai ? ai.matchScore : null;
    const sc = score != null ? _altScoreColor(score) : null;
    const loc = [j.city, j.state].filter(Boolean).join(', ');
    const bg = i % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
    const sel = _jt2SelectedId === j.id;

    let html = `<div class="jt2-card ${sel ? 'jt2-card-sel' : ''}" style="border-left:4px solid ${m.color || '#94a3b8'};background:${bg}" onclick="jt2Select('${j.id}')">
      <div class="jt2-card-head">
        <div class="jt2-card-info">
          <div class="jt2-role">${esc(j.role)}</div>
          <div class="jt2-company">${esc(j.company)}${loc ? ' · ' + esc(loc) : ''}</div>
        </div>
        <div class="jt2-right">
          ${score != null ? `<span class="jt2-score" style="color:${sc}">${score}%</span>` : ''}
          <span class="jt2-status" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.emoji} ${s}</span>
          <button class="jt2-action-btn jt2-edit-btn" title="Edit" onclick="event.stopPropagation();openJobModal('${j.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="jt2-action-btn jt2-del-btn" title="Delete" onclick="event.stopPropagation();jt2Delete('${j.id}')">
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

  el.innerHTML = paginationHtml + cardsHtml + (totalPages > 1 ? paginationHtml : '');
}

function jt2Select(id) {
  if (_jt2SelectedId === id) {
    _jt2SelectedId = null;
  } else {
    _jt2SelectedId = id;
  }
  jobTracker2Render();
  if (_jt2SelectedId) {
    setTimeout(() => {
      const pane = document.querySelector('.jt2-detail-pane');
      if (pane) pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
}

function jt2Delete(id) {
  if (!confirm('Delete this job?')) return;
  if (_jt2SelectedId === id) _jt2SelectedId = null;
  stDelete('jobs', id);
  jobTracker2Render();
}

function _jt2Page(p) {
  _jobPage = p;
  _jt2SelectedId = null;
  jobTracker2Render();
}

// Override jobsCloseDetail to also work from v2 detail pane
const _origJobsCloseDetail = typeof jobsCloseDetail === 'function' ? jobsCloseDetail : null;
function jobsCloseDetail() {
  // Close in v2 if that's the active panel
  const v2Panel = document.getElementById('panel-jobs2');
  if (v2Panel && v2Panel.classList.contains('active')) {
    _jt2SelectedId = null;
    jobTracker2Render();
    return;
  }
  // Otherwise use original
  if (_origJobsCloseDetail) _origJobsCloseDetail();
  else { _jobSelectedId = null; jobsRender(); }
}
