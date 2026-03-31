/* ──────────────────────────────────────────
   SkillTrack — Dice Jobs Import Module
────────────────────────────────────────── */
'use strict';

let _diceRunning = false;
let _diceAbort = false;

function diceJobsRender() {
  const container = document.getElementById('dice-results');
  if (!container) return;
  // Populate goal dropdown
  const goalSel = document.getElementById('dice-goal');
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

function _diceLog(msg, type) {
  const log = document.getElementById('dice-log');
  if (!log) return;
  const line = document.createElement('div');
  line.className = 'dice-log-line' + (type ? ' dice-log-' + type : '');
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function _diceProgress(current, total, added, skipped, failed) {
  const bar = document.getElementById('dice-progress-bar');
  const txt = document.getElementById('dice-progress-text');
  const statsEl = document.getElementById('dice-stats');
  if (bar) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    bar.style.width = pct + '%';
  }
  if (txt) txt.textContent = current + ' / ' + total;
  if (statsEl) statsEl.textContent = 'Added: ' + added + ' | Skipped: ' + skipped + ' | Failed: ' + failed;
}

function _diceSetRunning(running) {
  _diceRunning = running;
  const btn = document.getElementById('dice-start-btn');
  const stopBtn = document.getElementById('dice-stop-btn');
  if (btn) btn.disabled = running;
  if (stopBtn) stopBtn.style.display = running ? '' : 'none';
  if (running) {
    _diceAbort = false;
    const log = document.getElementById('dice-log');
    if (log) log.innerHTML = '';
    const bar = document.getElementById('dice-progress-bar');
    if (bar) bar.style.width = '0%';
    document.getElementById('dice-progress-text').textContent = '';
    document.getElementById('dice-stats').textContent = '';
  }
}

function diceStop() { _diceAbort = true; }

// Job category from role title
function _diceRoleCat(role) {
  const r = role.toLowerCase();
  if (/\bai\b|artificial.?intelligence|agentic|gen.?ai|llm|nlp|chatbot|prompt/.test(r)) return 'AIENG';
  if (/\bml\b|machine.?learn|deep.?learn|neural|tensorflow|pytorch/.test(r)) return 'MLENG';
  if (/\bdata\b.*(?:scien|analy|engin|innov|govern)/.test(r)) return 'DATASC';
  if (/software.*(?:ai|ml)|(?:ai|ml).*software|backend.*ai|full.?stack.*ai/.test(r)) return 'AIENG';
  if (/(?:ai|ml).*architect|architect.*(?:ai|ml)/.test(r)) return 'AIENG';
  if (/snowflake/.test(r)) return 'SNFSA';
  return 'OTH';
}

// Map role category to goal name (same as LinkedIn)
const _DICE_CAT_TO_GOAL = {
  AIENG: 'AI Engineer', MLENG: 'ML Engineer', DATASC: 'Data Scientist',
  SNFSA: 'Snowflake Data Architect', OTH: ''
};

function _diceAutoGoal(role) {
  const cat = _diceRoleCat(role);
  return _DICE_CAT_TO_GOAL[cat] || '';
}

async function diceStartImport() {
  if (_diceRunning) return;

  const urlInput = document.getElementById('dice-url').value.trim();
  const pages = parseInt(document.getElementById('dice-pages').value) || 5;
  const goalOverride = document.getElementById('dice-goal').value; // optional override

  if (!urlInput) { _diceLog('Please enter a Dice search URL', 'error'); return; }
  if (!urlInput.includes('dice.com')) { _diceLog('URL must be a Dice search URL', 'error'); return; }

  _diceSetRunning(true);
  const apiBase = IS_LOCAL ? '' : 'api/dice-search.php';

  if (IS_LOCAL) {
    _diceLog('Dice import requires server mode (not available in local file:// mode)', 'error');
    _diceSetRunning(false);
    return;
  }

  // ── Step 1: Collect job IDs from all pages ──
  _diceLog('═══ Step 1: Collecting job IDs from ' + pages + ' pages ═══', 'heading');
  const allIds = [];
  const seenIds = new Set();

  for (let p = 1; p <= pages; p++) {
    if (_diceAbort) { _diceLog('Stopped by user', 'warn'); break; }

    // Build page URL
    let pageUrl = urlInput;
    if (p === 1) {
      pageUrl = pageUrl.replace(/[&?]page=\d+/, '');
    } else {
      if (pageUrl.includes('page=')) {
        pageUrl = pageUrl.replace(/page=\d+/, 'page=' + p);
      } else {
        pageUrl += (pageUrl.includes('?') ? '&' : '?') + 'page=' + p;
      }
    }

    try {
      const r = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', url: pageUrl })
      });
      const d = await r.json();
      if (!d.ok) { _diceLog('  Page ' + p + ': ERROR — ' + d.error, 'error'); continue; }

      let newCount = 0;
      (d.data.ids || []).forEach(id => {
        if (!seenIds.has(id)) { seenIds.add(id); allIds.push(id); newCount++; }
      });
      _diceLog('  Page ' + p + ': +' + newCount + ' new (total: ' + allIds.length + ')', newCount > 0 ? 'ok' : 'warn');

      if (newCount === 0 && p > 2) { _diceLog('  No new jobs — stopping pagination', 'warn'); break; }
    } catch (e) {
      _diceLog('  Page ' + p + ': FETCH ERROR — ' + e.message, 'error');
    }

    // Small delay between pages
    await new Promise(r => setTimeout(r, 300));
  }

  if (allIds.length === 0) {
    _diceLog('No job IDs found. Check the URL and try again.', 'error');
    _diceSetRunning(false);
    return;
  }
  _diceLog('Total unique IDs: ' + allIds.length, 'heading');

  // ── Step 2: Load existing jobs & build duplicate set ──
  _diceLog('');
  _diceLog('═══ Step 2: Checking existing jobs ═══', 'heading');
  const existingJobs = stRead('jobs');
  const existSet = new Set();
  existingJobs.forEach(j => {
    existSet.add((j.role + '|' + j.company + '|' + j.state).toLowerCase());
  });
  _diceLog('Existing jobs: ' + existingJobs.length, 'ok');

  // Find max seq per category
  const catSeq = { AIENG: 0, MLENG: 0, DATASC: 0, SNFSA: 0, OTH: 0 };
  existingJobs.forEach(j => {
    if (j.jobId) {
      const m = j.jobId.match(/^JOB-(\w+)-(\d+)$/);
      if (m && catSeq.hasOwnProperty(m[1])) {
        catSeq[m[1]] = Math.max(catSeq[m[1]], parseInt(m[2]));
      }
    }
  });

  // ── Step 3: Fetch each job detail ──
  _diceLog('');
  _diceLog('═══ Step 3: Fetching ' + allIds.length + ' job details ═══', 'heading');

  let added = 0, skipped = 0, failed = 0, fetchErr = 0;
  const jobs = [...existingJobs];
  const batchSize = 50;
  let batchNum = 0;
  const ts = Date.now();

  for (let i = 0; i < allIds.length; i++) {
    if (_diceAbort) { _diceLog('Stopped by user', 'warn'); break; }

    const jid = allIds[i];
    const idx = i + 1;
    _diceProgress(idx, allIds.length, added, skipped, failed + fetchErr);

    try {
      const r = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detail', jobDiceId: jid })
      });
      const d = await r.json();

      if (!d.ok) {
        fetchErr++;
        // silent skip for fetch errors (Dice blocking)
        continue;
      }

      const meta = d.data;
      if (!meta.role) { failed++; continue; }

      // Duplicate check
      const key = (meta.role + '|' + meta.company + '|' + meta.state).toLowerCase();
      if (existSet.has(key)) { skipped++; continue; }

      // Generate job ID
      const cat = _diceRoleCat(meta.role);
      catSeq[cat] = (catSeq[cat] || 0) + 1;
      const jobId = 'JOB-' + cat + '-' + String(catSeq[cat]).padStart(4, '0');

      const newJob = {
        id: 'j_' + (ts + i),
        jobId: jobId,
        role: meta.role,
        company: meta.company || '',
        status: 'Job Added',
        source: 'Dice',
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
        notes: '',
        jobText: meta.jobText || '',
        clientName: '',
        employerType: '',
        linkedGoal: goalOverride || _diceAutoGoal(meta.role)
      };

      jobs.push(newJob);
      existSet.add(key);
      added++;

      const descLen = meta.jobText ? meta.jobText.length : 0;
      _diceLog('  ' + idx + '/' + allIds.length + ' [' + jobId + '] ' + meta.role + ' | ' + meta.company + ' (' + descLen + ' chars)', 'ok');

      // Batch sync every N jobs
      if (added > 0 && added % batchSize === 0) {
        batchNum++;
        _diceLog('  ── Batch sync #' + batchNum + ' (' + jobs.length + ' total) ──', 'heading');
        stWrite('jobs', jobs);
      }

    } catch (e) {
      fetchErr++;
    }

    // Delay between requests
    await new Promise(r => setTimeout(r, 400));
  }

  _diceProgress(allIds.length, allIds.length, added, skipped, failed + fetchErr);

  // ── Final sync ──
  if (added > 0) {
    _diceLog('');
    _diceLog('Syncing ' + jobs.length + ' total jobs...', 'heading');
    stWrite('jobs', jobs);
    _diceLog('All synced!', 'ok');
  }

  _diceLog('');
  _diceLog('═══ Done! Added: ' + added + ' | Skipped: ' + skipped + ' | Failed: ' + (failed + fetchErr) + ' | Total: ' + jobs.length + ' ═══', 'heading');
  _diceSetRunning(false);
}
