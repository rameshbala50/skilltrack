/* ──────────────────────────────────────────
   SkillTrack — LinkedIn Jobs Import Module
────────────────────────────────────────── */
'use strict';

let _liRunning = false;

function linkedinJobsRender() {
  // Populate goal dropdown
  const goalSel = document.getElementById('li-goal');
  if (goalSel && goalSel.options.length <= 1) {
    const goals = stRead('goals');
    goals.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.name;
      opt.textContent = g.name;
      goalSel.appendChild(opt);
    });
  }
}

function _liLog(msg, type) {
  const log = document.getElementById('li-log');
  if (!log) return;
  const line = document.createElement('div');
  line.className = 'dice-log-line' + (type ? ' dice-log-' + type : '');
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function _liSetRunning(running) {
  _liRunning = running;
  const btn = document.getElementById('li-fetch-btn');
  if (btn) {
    btn.disabled = running;
    btn.textContent = running ? 'Fetching...' : 'Fetch & Add Job';
  }
}

function _liShowResult(meta) {
  const el = document.getElementById('li-result');
  if (!el) return;
  const esc = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '—';

  el.innerHTML = `
    <div class="card" style="margin-top:16px">
      <div class="card-header">
        <h3 class="card-title">Job Details</h3>
        <span class="jt-status-badge" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0">Saved to Tracker</span>
      </div>
      <div class="card-body">
        <div class="jd-detail-section">
          <div class="jd-detail-grid">
            <div class="jd-detail-row"><span class="jd-detail-label">Role</span><span class="jd-detail-value" style="font-weight:600">${esc(meta.role)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Company</span><span class="jd-detail-value">${esc(meta.company)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Location</span><span class="jd-detail-value">${esc(meta.location)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Work Mode</span><span class="jd-detail-value">${esc(meta.workMode)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Salary</span><span class="jd-detail-value" style="color:#16a34a;font-weight:600">${esc(meta.salary)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Employment</span><span class="jd-detail-value">${esc(meta.empType)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Posted</span><span class="jd-detail-value">${esc(meta.postedRelative || meta.postedDate)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Applicants</span><span class="jd-detail-value">${esc(meta.applicants)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Seniority</span><span class="jd-detail-value">${esc(meta.seniorityLevel)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Function</span><span class="jd-detail-value">${esc(meta.jobFunction)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Industries</span><span class="jd-detail-value">${esc(meta.industries)}</span></div>
            <div class="jd-detail-row"><span class="jd-detail-label">Source</span><span class="jd-detail-value">LinkedIn</span></div>
          </div>
        </div>
        ${meta.description ? `
        <div class="jd-detail-section" style="margin-top:12px">
          <h4 class="jd-section-title" style="color:var(--primary);margin-bottom:8px">Job Description</h4>
          <div style="font-size:13px;line-height:1.6;white-space:pre-wrap;max-height:300px;overflow-y:auto;color:var(--text)">${esc(meta.description).substring(0, 3000)}</div>
        </div>` : ''}
      </div>
    </div>`;
}

// Job category from role title (same as dicejobs.js)
function _liRoleCat(role) {
  const r = role.toLowerCase();
  if (/\bai\b|artificial.?intelligence|agentic|gen.?ai|llm|nlp|chatbot|prompt/.test(r)) return 'AIENG';
  if (/\bml\b|machine.?learn|deep.?learn|neural|tensorflow|pytorch/.test(r)) return 'MLENG';
  if (/\bdata\b.*(?:scien|analy|engin|innov|govern)/.test(r)) return 'DATASC';
  if (/software.*(?:ai|ml)|(?:ai|ml).*software|backend.*ai|full.?stack.*ai/.test(r)) return 'AIENG';
  if (/(?:ai|ml).*architect|architect.*(?:ai|ml)/.test(r)) return 'AIENG';
  if (/snowflake/.test(r)) return 'SNFSA';
  return 'OTH';
}

// Map role category to goal name
const _LI_CAT_TO_GOAL = {
  AIENG: 'AI Engineer', MLENG: 'ML Engineer', DATASC: 'Data Scientist',
  SNFSA: 'Snowflake Data Architect', OTH: ''
};

function _liAutoGoal(role) {
  const cat = _liRoleCat(role);
  const goalName = _LI_CAT_TO_GOAL[cat] || '';
  // Verify the goal exists in user's goals
  if (goalName) {
    const goals = stRead('goals');
    if (goals.some(g => g.name === goalName)) return goalName;
  }
  return goalName; // return even if not in goals — still useful as label
}

async function liImportJob() {
  if (_liRunning) return;

  const urlInput = document.getElementById('li-url').value.trim();
  const goalOverride = document.getElementById('li-goal').value; // optional override

  if (!urlInput) { _liLog('Please enter a LinkedIn job URL', 'error'); return; }
  if (!urlInput.includes('linkedin.com')) { _liLog('URL must be a LinkedIn job URL', 'error'); return; }

  if (IS_LOCAL) {
    _liLog('LinkedIn import requires server mode (not available in local file:// mode)', 'error');
    return;
  }

  // Clear previous
  const log = document.getElementById('li-log');
  if (log) log.innerHTML = '';
  document.getElementById('li-result').innerHTML = '';

  _liSetRunning(true);
  _liLog('Fetching job details from LinkedIn...', 'heading');

  try {
    const r = await fetch('api/linkedin-job.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput })
    });
    const d = await r.json();

    if (!d.ok) {
      _liLog('Error: ' + d.error, 'error');
      _liSetRunning(false);
      return;
    }

    const meta = d.data;
    if (!meta.role) {
      _liLog('Could not extract job title from the page. LinkedIn may require login for this job.', 'error');
      _liSetRunning(false);
      return;
    }

    // Auto-detect linked goal from role, allow manual override
    const linkedGoal = goalOverride || _liAutoGoal(meta.role);

    _liLog('Found: ' + meta.role + ' at ' + meta.company, 'ok');
    if (meta.location) _liLog('  Location: ' + meta.location, 'ok');
    if (meta.salary) _liLog('  Salary: ' + meta.salary, 'ok');
    if (meta.empType) _liLog('  Type: ' + meta.empType, 'ok');
    if (meta.applicants) _liLog('  Applicants: ' + meta.applicants, 'ok');
    if (meta.seniorityLevel) _liLog('  Seniority: ' + meta.seniorityLevel, 'ok');
    if (meta.description) _liLog('  Description: ' + meta.description.length + ' chars', 'ok');
    _liLog('  Linked Goal: ' + (linkedGoal || '(none)'), linkedGoal ? 'ok' : 'warn');

    // Duplicate check
    const existingJobs = stRead('jobs');
    const key = (meta.role + '|' + meta.company + '|' + meta.state).toLowerCase();
    const isDup = existingJobs.some(j => (j.role + '|' + j.company + '|' + j.state).toLowerCase() === key);

    if (isDup) {
      _liLog('');
      _liLog('DUPLICATE: A job with the same role, company, and state already exists. Skipped.', 'warn');
      _liShowResult(meta);
      _liSetRunning(false);
      return;
    }

    // Generate job ID
    const catSeq = { AIENG: 0, MLENG: 0, DATASC: 0, SNFSA: 0, OTH: 0 };
    existingJobs.forEach(j => {
      if (j.jobId) {
        const m = j.jobId.match(/^JOB-(\w+)-(\d+)$/);
        if (m && catSeq.hasOwnProperty(m[1])) {
          catSeq[m[1]] = Math.max(catSeq[m[1]], parseInt(m[2]));
        }
      }
    });
    const cat = _liRoleCat(meta.role);
    catSeq[cat] = (catSeq[cat] || 0) + 1;
    const jobId = 'JOB-' + cat + '-' + String(catSeq[cat]).padStart(4, '0');

    // Build notes from extra metadata
    const notesParts = [];
    if (meta.applicants) notesParts.push('Applicants: ' + meta.applicants);
    if (meta.seniorityLevel) notesParts.push('Seniority: ' + meta.seniorityLevel);
    if (meta.jobFunction) notesParts.push('Function: ' + meta.jobFunction);
    if (meta.industries) notesParts.push('Industries: ' + meta.industries);

    const newJob = {
      id: 'j_' + Date.now(),
      jobId: jobId,
      role: meta.role,
      company: meta.company || '',
      status: 'Job Added',
      source: 'LinkedIn',
      url: meta.url,
      city: meta.city || '',
      state: meta.state || '',
      country: meta.country || 'USA',
      location: meta.location || '',
      postedDate: meta.postedDate || '',
      employmentType: meta.empType || 'Full-Time',
      workMode: meta.workMode || '',
      salary: meta.salary || '',
      addedAt: new Date().toISOString(),
      addedBy: window._currentUser ? window._currentUser.email : '',
      notes: notesParts.join(' | '),
      jobText: meta.jobText || '',
      clientName: '',
      employerType: '',
      linkedGoal: linkedGoal
    };

    existingJobs.push(newJob);
    stWrite('jobs', existingJobs);

    _liLog('');
    _liLog('Job saved! [' + jobId + '] ' + meta.role + ' | ' + meta.company + ' (Goal: ' + linkedGoal + ')', 'heading');
    _liLog('Total jobs: ' + existingJobs.length, 'ok');

    _liShowResult(meta);

    // Clear URL for next entry
    document.getElementById('li-url').value = '';

  } catch (e) {
    _liLog('Error: ' + e.message, 'error');
  }

  _liSetRunning(false);
}
