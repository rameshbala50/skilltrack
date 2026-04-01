/* ──────────────────────────────────────────
   SkillTrack — Job Summary Module
────────────────────────────────────────── */
'use strict';

function jobSummaryRender() {
  const container = document.getElementById('job-summary-content');
  if (!container) return;
  const jobs = stRead('jobs');

  if (!jobs.length) {
    container.innerHTML = '<div class="empty-state"><h3>No jobs tracked yet</h3><p>Add jobs via Job Tracker, Dice Jobs, or LinkedIn Jobs.</p></div>';
    return;
  }

  // Exclude Not Interested by default for totals
  const active = jobs.filter(j => _jobMigrateStatus(j.status) !== 'Not Interested');
  const notInterested = jobs.filter(j => _jobMigrateStatus(j.status) === 'Not Interested');

  // ── Status breakdown ──
  const statusCounts = {};
  JOB_STATUSES.forEach(s => statusCounts[s] = 0);
  jobs.forEach(j => { const s = _jobMigrateStatus(j.status); if (statusCounts[s] != null) statusCounts[s]++; });

  // ── Goal breakdown ──
  const goalCounts = {};
  active.forEach(j => {
    const g = j.linkedGoal || '(No Goal)';
    goalCounts[g] = (goalCounts[g] || 0) + 1;
  });

  // ── Source breakdown ──
  const sourceCounts = {};
  active.forEach(j => {
    const s = j.source || '(Unknown)';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });

  // ── Role category breakdown ──
  const roleCatCounts = {};
  active.forEach(j => {
    const c = _jobRoleCatLabel(j);
    roleCatCounts[c] = (roleCatCounts[c] || 0) + 1;
  });

  // ── Location (state) breakdown — top 10 ──
  const stateCounts = {};
  active.forEach(j => {
    const s = j.state || '(Unknown)';
    stateCounts[s] = (stateCounts[s] || 0) + 1;
  });

  // ── AI analyzed vs pending ──
  const analyzed = active.filter(j => j.aiAnalysis).length;
  const pending = active.length - analyzed;

  // ── Work mode breakdown ──
  const modeCounts = {};
  active.forEach(j => {
    const m = j.workMode || '(Not Specified)';
    modeCounts[m] = (modeCounts[m] || 0) + 1;
  });

  // Build HTML
  let html = '';

  // Top stats
  html += `<div class="js-stats-row">
    <div class="js-stat-card" onclick="jobSummaryNavigate('all')">
      <div class="js-stat-val">${jobs.length}</div><div class="js-stat-lbl">Total Jobs</div>
    </div>
    <div class="js-stat-card" onclick="jobSummaryNavigate('except-not-interested')">
      <div class="js-stat-val">${active.length}</div><div class="js-stat-lbl">Active Jobs</div>
    </div>
    <div class="js-stat-card" onclick="jobSummaryNavigate('Not Interested')">
      <div class="js-stat-val">${notInterested.length}</div><div class="js-stat-lbl">Not Interested</div>
    </div>
    <div class="js-stat-card">
      <div class="js-stat-val" style="color:var(--green)">${analyzed}</div><div class="js-stat-lbl">AI Analyzed</div>
    </div>
    <div class="js-stat-card">
      <div class="js-stat-val" style="color:var(--yellow)">${pending}</div><div class="js-stat-lbl">Pending Analysis</div>
    </div>
  </div>`;

  // Status breakdown
  html += _summarySection('By Status', _summaryTable(
    JOB_STATUSES.filter(s => statusCounts[s] > 0).map(s => {
      const m = JOB_STATUS_META[s] || {};
      return { label: m.emoji + ' ' + s, count: statusCounts[s], filter: 'status', value: s, color: m.color };
    })
  ));

  // Goal breakdown
  html += _summarySection('By Goal', _summaryTable(
    Object.entries(goalCounts).sort((a,b) => b[1] - a[1]).map(([g, c]) => ({
      label: g, count: c, filter: 'goal', value: g === '(No Goal)' ? '' : g
    }))
  ));

  // Role category breakdown
  html += _summarySection('By Role Category', _summaryTable(
    Object.entries(roleCatCounts).sort((a,b) => b[1] - a[1]).map(([r, c]) => {
      const catKey = Object.entries(JOB_ROLE_CATS).find(([k,v]) => v === r);
      return { label: r, count: c, filter: 'rolecat', value: catKey ? catKey[0] : 'OTH' };
    })
  ));

  // Source breakdown
  html += _summarySection('By Source', _summaryTable(
    Object.entries(sourceCounts).sort((a,b) => b[1] - a[1]).map(([s, c]) => ({
      label: s, count: c, filter: 'source', value: s === '(Unknown)' ? '' : s
    }))
  ));

  // Work mode breakdown
  html += _summarySection('By Work Mode', _summaryTable(
    Object.entries(modeCounts).sort((a,b) => b[1] - a[1]).map(([m, c]) => ({
      label: m, count: c
    }))
  ));

  // Location top 10
  const topStates = Object.entries(stateCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  html += _summarySection('Top 10 Locations', _summaryTable(
    topStates.map(([s, c]) => ({
      label: s, count: c, filter: 'state', value: s === '(Unknown)' ? '' : s
    }))
  ));

  container.innerHTML = html;
}

function _summarySection(title, content) {
  return `<div class="js-section">
    <div class="js-section-title">${title}</div>
    ${content}
  </div>`;
}

function _summaryTable(rows) {
  return `<table class="js-table"><tbody>` +
    rows.map(r => {
      const clickable = r.filter ? ' class="js-row-click" onclick="jobSummaryNavigate(\'' + esc(r.value) + '\', \'' + r.filter + '\')"' : '';
      const colorDot = r.color ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};margin-right:6px"></span>` : '';
      return `<tr${clickable}>
        <td style="padding:6px 12px">${colorDot}${esc(r.label)}</td>
        <td style="padding:6px 12px;text-align:right;font-weight:600;font-family:var(--mono)">${r.count}</td>
      </tr>`;
    }).join('') +
    `</tbody></table>`;
}

// Navigate to Job Tracker with a specific filter pre-set
function jobSummaryNavigate(value, filterType) {
  // Reset all filters
  _jobStatusFilter = 'all'; _jobRoleCatFilter = 'all'; _jobCompanyFilter = 'all';
  _jobLocationFilter = 'all'; _jobEmpTypeFilter = 'all'; _jobSourceFilter = 'all';
  _jobGoalFilter = 'all'; _jobDateFilter = 'all'; _jobIdFilter = 'all';
  _jobPage = 1;

  if (value === 'all') {
    // Show all — no filter
  } else if (value === 'except-not-interested') {
    _jobStatusFilter = 'except-not-interested';
  } else if (filterType === 'status') {
    _jobStatusFilter = value;
  } else if (filterType === 'goal') {
    _jobGoalFilter = value;
  } else if (filterType === 'rolecat') {
    _jobRoleCatFilter = value;
  } else if (filterType === 'source') {
    _jobSourceFilter = value;
  } else if (filterType === 'state') {
    _jobLocationFilter = value;
  }

  // Switch to Job Tracker panel
  switchPanel('jobs', document.querySelector('.nav-item[data-panel="jobs"]'));
}
