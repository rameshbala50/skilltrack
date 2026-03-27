/* ──────────────────────────────────────────
   SkillTrack — Job Posting Analyser
   Panel: jobposting
────────────────────────────────────────── */
'use strict';

// ── State ─────────────────────────────────────────────────────────
let _jpLastAnalysis = null;   // last AI analysis result
let _jpJobText      = '';     // cleaned job description text
let _jpDuplicateJob = null;   // pending duplicate job awaiting user decision

// ── Render ────────────────────────────────────────────────────────
function jpRender() {
  // Panel is static HTML — nothing to re-render on switch.
  // Just ensure scan results are cleared if no analysis.
  if (!_jpLastAnalysis) {
    const r = document.getElementById('jp-results');
    if (r) r.innerHTML = '';
  }
}

// ── Fetch job from URL ────────────────────────────────────────────
async function jpFetchUrl() {
  const urlInput = document.getElementById('jp-url');
  const url = (urlInput ? urlInput.value.trim() : '');
  if (!url) { _jpMsg('Enter a job URL first.', 'warn'); return; }

  const btn = document.getElementById('jp-fetch-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Fetching…'; }
  _jpMsg('Fetching job description…', '');

  if (IS_LOCAL) {
    _jpMsg('URL fetch requires server mode. Please copy and paste the job description manually.', 'warn');
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg> Fetch'; }
    return;
  }

  try {
    const res  = await fetch('api/fetch.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.ok && data.data && data.data.text) {
      const ta = document.getElementById('jp-textarea');
      if (ta) ta.value = data.data.text;
      _jpMsg('Job description fetched! Review and edit if needed, then run Quick Scan or AI Analyse.', '');
    } else {
      _jpMsg(data.error || 'Could not fetch. Try copying the job text manually.', 'warn');
    }
  } catch(e) {
    _jpMsg('Fetch failed: ' + e.message + '. Try copying the job text manually.', 'error');
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg> Fetch';
  }
}

// ── Quick Scan (client-side) ───────────────────────────────────────
function jpQuickScan() {
  const text = _jpGetJobText();
  if (!text) { _jpMsg('Paste a job description or provide a URL for AI Analyse.', 'warn'); return; }

  const mySkills = stRead('skills');
  if (!mySkills.length) { _jpMsg('No skills in My Skills yet.', 'warn'); return; }

  const lower = text.toLowerCase();
  const matched  = [];
  const missing  = [];

  mySkills.forEach(s => {
    const name = s.name.toLowerCase();
    if (lower.includes(name)) matched.push(s);
  });

  // Also look for mentions of known skill names NOT in user's list
  // (just flag them — we don't have a master list here)
  const resultsEl = document.getElementById('jp-results');
  if (!resultsEl) return;

  const pct = mySkills.length ? Math.round(matched.length / mySkills.length * 100) : 0;

  resultsEl.innerHTML = `
    <div class="jp-quick-scan-result">
      <div class="jp-qs-header">
        <span class="jp-qs-title">Quick Scan Result</span>
        <span class="jp-qs-note">Client-side match — your skills vs job text</span>
      </div>
      <div class="jp-qs-stats">
        <div class="jp-qs-stat jp-qs-stat-match">
          <div class="jp-qs-stat-val">${matched.length}</div>
          <div class="jp-qs-stat-lbl">Skills Mentioned</div>
        </div>
        <div class="jp-qs-stat jp-qs-stat-total">
          <div class="jp-qs-stat-val">${mySkills.length}</div>
          <div class="jp-qs-stat-lbl">My Skills Total</div>
        </div>
        <div class="jp-qs-stat jp-qs-stat-pct">
          <div class="jp-qs-stat-val">${pct}%</div>
          <div class="jp-qs-stat-lbl">Coverage</div>
        </div>
      </div>
      ${matched.length ? `
        <div class="jp-qs-chip-label">Skills found in posting:</div>
        <div class="jp-qs-chips">
          ${matched.map(s => `<span class="jp-qs-chip jp-qs-chip-match">${esc(s.name)}</span>`).join('')}
        </div>` : '<p style="font-size:13px;color:var(--muted)">None of your skills were explicitly mentioned in this posting.</p>'}
      <p style="font-size:12px;color:var(--muted2);margin-top:14px">
        For a detailed match score, gaps, and coaching — use <b>AI Analyse</b>.
      </p>
    </div>`;
  _jpMsg('', '');
  _jpSetActiveBtn('jp-scan-btn');
}

// ── AI Analyse ─────────────────────────────────────────────────────
async function jpRunAnalysis() {
  let text = _jpGetJobText();
  const urlInput = document.getElementById('jp-url');
  const url = urlInput ? urlInput.value.trim() : '';

  // If no text but URL exists, fetch description first
  if (!text && url) {
    _jpMsg('Fetching job description from URL…', 'info');
    try {
      const res = await fetch('api/fetch.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      const fetched = data.ok && data.data && data.data.text ? data.data.text : '';
      if (fetched && fetched.length > 50) {
        text = fetched.slice(0, 5000);
        const ta = document.getElementById('jp-jobtext');
        if (ta) ta.value = text;
        _jpMsg('', '');
      }
    } catch (e) { /* continue */ }
  }

  if (!text) { _jpMsg('Paste a job description or provide a URL.', 'warn'); return; }

  const mySkills = stRead('skills');
  const user     = window._currentUser || {};
  const name     = user.name || 'Candidate';

  const btn = document.getElementById('jp-analyse-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Analysing…'; }
  _jpShowLoader();

  const skillsList = mySkills.map(s =>
    s.name + ' (' + s.proficiency + (s.group ? ', ' + s.group : '') + ')'
  ).join('; ') || 'none listed';

  const r = await aiCall('job_analysis', {
    candidateName: name,
    skills:        skillsList,
    jobText:       text.slice(0, 3000)
  });

  if (btn) { btn.disabled = false; btn.textContent = 'AI Analyse'; }

  if (!r.ok) {
    _jpMsg('AI analysis failed: ' + r.error, 'error');
    _jpHideLoader();
    return;
  }

  _jpLastAnalysis = r;
  _jpHideLoader();
  _jpRenderAnalysis(r);
  _jpMsg('', '');
  _jpSetActiveBtn('jp-analyse-btn');
  // Show Cover Letter and Save buttons
  const coverBtn = document.getElementById('jp-cover-btn');
  const saveBtn2 = document.getElementById('jp-save-btn');
  if (coverBtn) coverBtn.style.display = '';
  if (saveBtn2) saveBtn2.style.display = '';

  stLog('job_analysis', 'Analysed job: ' + (r.jobTitle || 'Unknown role') + ' at ' + (r.company || 'Unknown company'));
}

function _jpRenderAnalysis(d) {
  const resultsEl = document.getElementById('jp-results');
  if (!resultsEl) return;

  const meta = d.jobMeta || {};
  const _pill = (text, color) => `<span style="background:${color}15;color:${color};border:1px solid ${color}30;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600">${esc(text)}</span>`;
  const workModeColor = { 'Remote':'#16a34a', 'Hybrid':'#d97706', 'Onsite':'#2563eb' };

  // ── Job Summary (same format as Job Tracker detail pane) ──
  const detailRows = [
    `<div class="jd-detail-row"><span class="jd-detail-label">Role</span><span class="jd-detail-value" style="font-weight:600">${esc(d.jobTitle || '')}</span></div>`,
    `<div class="jd-detail-row"><span class="jd-detail-label">Company</span><span class="jd-detail-value">${esc(d.company || '')}</span></div>`,
    meta.clientName  ? `<div class="jd-detail-row"><span class="jd-detail-label">Client</span><span class="jd-detail-value">${esc(meta.clientName)}</span></div>` : '',
    meta.postedDate  ? `<div class="jd-detail-row"><span class="jd-detail-label">Job Post Date</span><span class="jd-detail-value">${esc(meta.postedDate)}${typeof _daysAgoLabel === 'function' ? _daysAgoLabel(meta.postedDate) : ''}</span></div>` : '',
    meta.salary      ? `<div class="jd-detail-row"><span class="jd-detail-label">Salary</span><span class="jd-detail-value" style="font-weight:600;color:#16a34a">${esc(meta.salary)}</span></div>` : (d.salaryInsight ? `<div class="jd-detail-row"><span class="jd-detail-label">Salary</span><span class="jd-detail-value" style="font-weight:600;color:#16a34a">${esc(d.salaryInsight)}</span></div>` : ''),
    meta.country     ? `<div class="jd-detail-row"><span class="jd-detail-label">Country</span><span class="jd-detail-value">${esc(meta.country)}</span></div>` : '',
    meta.state       ? `<div class="jd-detail-row"><span class="jd-detail-label">State</span><span class="jd-detail-value">${esc(meta.state)}</span></div>` : '',
    meta.city        ? `<div class="jd-detail-row"><span class="jd-detail-label">City</span><span class="jd-detail-value">${esc(meta.city)}</span></div>` : '',
    meta.workMode && meta.workMode !== 'Not Specified' ? `<div class="jd-detail-row"><span class="jd-detail-label">Work Mode</span><span class="jd-detail-value">${_pill(meta.workMode, workModeColor[meta.workMode] || '#64748b')}</span></div>` : '',
    meta.employmentType ? `<div class="jd-detail-row"><span class="jd-detail-label">Employment Type</span><span class="jd-detail-value">${_pill(meta.employmentType, '#7c3aed')}</span></div>` : '',
    meta.employerType   ? `<div class="jd-detail-row"><span class="jd-detail-label">Employer Type</span><span class="jd-detail-value">${_pill(meta.employerType, '#2563eb')}</span></div>` : '',
    meta.source      ? `<div class="jd-detail-row"><span class="jd-detail-label">Source</span><span class="jd-detail-value">${esc(meta.source)}</span></div>` : '',
  ].filter(Boolean).join('');

  const jobSummarySection = `
    <div class="jd-section">
      <div class="jd-section-title">Job Summary</div>
      <div class="jd-details-grid">${detailRows}</div>
    </div>`;

  // ── AI Analysis (same format as Job Tracker detail pane) ──
  const s = d.matchScore || 0;
  const c = _scoreColor(s);
  const circ = 2 * Math.PI * 30;
  const arc = circ * (1 - s / 100);

  const col = (title, items, clr) => {
    if (!items || !items.length) return '';
    return `<div class="jd-ai-col">
      <div class="jd-ai-col-title" style="color:${clr}">${title}</div>
      <ul class="jd-ai-col-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>`;
  };

  const aiSection = `
    <div class="jd-section">
      <div class="jd-section-title">AI Analysis</div>
      <div class="jd-ai-section">
        <div class="jd-ai-top">
          <div class="jd-ai-ring">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#e2e8f0" stroke-width="8"/>
              <circle cx="40" cy="40" r="30" fill="none" stroke="${c}" stroke-width="8"
                stroke-dasharray="${circ}" stroke-dashoffset="${arc}"
                stroke-linecap="round" transform="rotate(-90 40 40)"/>
              <text x="40" y="36" text-anchor="middle" font-size="14" font-weight="700" fill="${c}">${s}%</text>
              <text x="40" y="50" text-anchor="middle" font-size="7" fill="#64748b">Match</text>
            </svg>
          </div>
          <div class="jd-ai-summary">
            <div class="jd-ai-level" style="color:${c}">${esc(d.matchLevel || '')}</div>
            ${d.overallAdvice ? `<p class="jd-ai-advice">${esc(d.overallAdvice)}</p>` : ''}
          </div>
        </div>
        <div class="jd-ai-grid">
          ${col('Top Strengths',      d.topStrengths,    '#16a34a')}
          ${col('Critical Gaps',      d.criticalGaps,    '#dc2626')}
          ${col('Job-Specific Gaps',  d.jobSpecificGaps, '#d97706')}
          ${col('Interview Topics',   d.interviewTopics, '#2563eb')}
          ${col('Resume Tips',        d.resumeTips,      '#7c3aed')}
        </div>
        ${d.learningPlan && d.learningPlan.length ? `<div class="jd-ai-col" style="margin-top:12px"><div class="jd-ai-col-title" style="color:#0d9488">Learning Plan</div><ol class="jd-ai-col-list">${d.learningPlan.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>` : ''}
        ${d.applicationStrategy ? `<p class="jd-ai-strategy"><b>Strategy:</b> ${esc(d.applicationStrategy)}</p>` : ''}
        ${d.salaryInsight ? `<p class="jd-ai-strategy"><b>Salary:</b> ${esc(d.salaryInsight)}</p>` : ''}
      </div>
    </div>`;

  resultsEl.innerHTML = jobSummarySection + aiSection;
}

// ── Cover Letter ───────────────────────────────────────────────────
async function jpGenerateCoverLetter() {
  const text = _jpGetJobText();
  const d    = _jpLastAnalysis;
  if (!d || !text) { _jpMsg('Run AI Analyse first.', 'warn'); return; }

  const user = window._currentUser || {};
  const name = user.name || 'Candidate';

  const btn = document.getElementById('jp-cl-btn-gen');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }

  const r = await aiCall('cover_letter', {
    candidateName: name,
    jobTitle:      d.jobTitle || '',
    company:       d.company  || '',
    topStrengths:  (d.topStrengths || []).join(', '),
    jobText:       text.slice(0, 1500)
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Regenerate'; }

  if (!r.ok) {
    _jpMsg('Cover letter failed: ' + r.error, 'error');
    return;
  }

  const bodyEl = document.getElementById('jp-cl-body');
  if (bodyEl) bodyEl.textContent = r.letter || '';

  document.getElementById('jp-cl-modal').classList.add('open');
  _jpSetActiveBtn('jp-cover-btn');
}

function jpCloseCoverLetter() {
  document.getElementById('jp-cl-modal').classList.remove('open');
}

function jpCopyCoverLetter() {
  const text = (document.getElementById('jp-cl-body') || {}).textContent || '';
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('jp-cl-btn-copy');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
  });
}

// ── Save to Job Tracker ────────────────────────────────────────────
function jpSaveToTracker() {
  const d = _jpLastAnalysis;
  const text = _jpGetJobText();
  const saveUrl = (document.getElementById('jp-url')?.value || '').trim();
  if (!text.trim() && !d && !saveUrl) { _jpMsg('Paste a job description or provide a URL.', 'warn'); return; }

  // If no AI analysis, try to extract company/role from first lines of text
  let company = '', role = '';
  if (d) {
    company = d.company  || '';
    role    = d.jobTitle || '';
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    company = lines[0] || 'Unknown Company';
    role    = lines[1] || 'Unknown Role';
  }

  // Duplicate check — match on role + company + location
  const meta = d ? (d.jobMeta || {}) : {};
  const location = [meta.city, meta.state, meta.country].filter(Boolean).join(', ');
  const existing = stRead('jobs').find(j =>
    j.company.toLowerCase() === company.toLowerCase() &&
    j.role.toLowerCase()    === role.toLowerCase() &&
    (j.location || '').toLowerCase() === location.toLowerCase()
  );
  if (existing) {
    _jpDuplicateJob = existing;
    const locLabel = location ? ` in <b>${esc(location)}</b>` : '';
    const el = document.getElementById('jp-msg');
    if (el) {
      el.innerHTML =
        `<span>⚠️ <b>${esc(role)}</b> at <b>${esc(company)}</b>${locLabel} is already in your tracker.</span>` +
        `<button class="btn btn-sm" style="padding:2px 10px;margin-left:10px;font-size:12px" onclick="jpConfirmUpdateAnalysis()">Update analysis</button>` +
        `<button class="btn btn-sm btn-ghost" style="padding:2px 8px;margin-left:4px;font-size:12px" onclick="_jpClearDuplicate()">Keep existing</button>`;
      el.className = 'jp-msg jp-msg-warn';
    }
    return;
  }

  _jpDoSave(d, text, company, role);
}

function jpConfirmUpdateAnalysis() {
  const existing = _jpDuplicateJob;
  if (!existing || !_jpLastAnalysis) return;
  _jpDuplicateJob = null;
  existing.aiAnalysis = _jpLastAnalysis;
  existing.jobText    = _jpGetJobText().slice(0, 3000);
  stUpsert('jobs', existing);
  stLog('job_updated', 'Updated AI analysis: ' + existing.role + ' at ' + existing.company);
  _jpMsg('', '');
  _jpSetSavedState('Updated in Job Tracker ✓');
}

function _jpClearDuplicate() {
  _jpDuplicateJob = null;
  _jpMsg('', '');
}

function _jpDoSave(d, text, company, role) {
  const urlInput = document.getElementById('jp-url');
  const meta = d ? (d.jobMeta || {}) : {};
  const job = {
    id:             'j_' + Date.now(),
    jobId:          typeof _generateJobId === 'function' ? _generateJobId(role) : 'JOB-' + Date.now(),
    company,
    role,
    status:         'Job Added',
    notes:          d ? (d.overallAdvice || '') : '',
    url:            urlInput ? urlInput.value.trim() : '',
    addedAt:        new Date().toISOString(),
    addedBy:        (window._currentUser || {}).name || (window._currentUser || {}).email || '',
    jobText:        text.slice(0, 3000),
    aiAnalysis:     d || null,
    // Extracted metadata from AI (empty if no analysis)
    source:         meta.source || '',
    clientName:     meta.clientName || '',
    city:           meta.city || '',
    state:          meta.state || '',
    country:        meta.country || '',
    location:       [meta.city, meta.state, meta.country].filter(Boolean).join(', '),
    employerType:   meta.employerType || '',
    employmentType: meta.employmentType || '',
    salary:         meta.salary || (d ? d.salaryInsight : '') || '',
    workMode:       meta.workMode || '',
    postedDate:     meta.postedDate || '',
  };
  stUpsert('jobs', job);
  stLog('job_added', 'Saved from Job Posting: ' + role + ' at ' + company);
  _jpMsg('', '');
  _jpSetSavedState('Saved to Job Tracker ✓');
  _jpSetActiveBtn('jp-save-btn');
}

function _jpSetSavedState(label) {
  const btn = document.getElementById('jp-save-btn');
  if (!btn) return;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${label}`;
  btn.style.color    = '#16a34a';
  btn.style.borderColor = '#16a34a';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> Save to Job Tracker`;
    btn.style.color       = '';
    btn.style.borderColor = '';
    btn.disabled = false;
  }, 3000);
}

// ── Helpers ────────────────────────────────────────────────────────
function _jpGetJobText() {
  const ta = document.getElementById('jp-textarea');
  return ta ? ta.value.trim() : '';
}

// ── Active button indicator ───────────────────────────────────────
function _jpSetActiveBtn(activeId) {
  ['jp-scan-btn', 'jp-analyse-btn', 'jp-cover-btn', 'jp-save-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('jp-btn-done', id === activeId);
  });
}

function _jpMsg(msg, type) {
  const el = document.getElementById('jp-msg');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'jp-msg' + (type ? ' jp-msg-' + type : '');
}

function _jpShowLoader() {
  const r = document.getElementById('jp-results');
  if (r) r.innerHTML = `
    <div class="jp-loader">
      <div class="jp-loader-dots"><span></span><span></span><span></span></div>
      <p>Claude is analysing the job posting…</p>
    </div>`;
}

function _jpHideLoader() {
  // replaced by content in _jpRenderAnalysis
}

function jpClearAll() {
  const ta = document.getElementById('jp-textarea');
  const ur = document.getElementById('jp-url');
  if (ta) ta.value = '';
  if (ur) ur.value = '';
  _jpLastAnalysis = null;
  _jpJobText      = '';
  _jpDuplicateJob = null;
  const r = document.getElementById('jp-results');
  if (r) r.innerHTML = '';
  _jpMsg('', '');
  // Hide Cover Letter button (Save stays visible), clear active state
  const coverBtn = document.getElementById('jp-cover-btn');
  if (coverBtn) coverBtn.style.display = 'none';
  _jpSetActiveBtn(null);
}
