/* ──────────────────────────────────────────
   SkillTrack — Unified Storage Layer
   Local mode  → localStorage (sync)
   Server mode → PHP JSON APIs (async sync-back)
────────────────────────────────────────── */
'use strict';

const IS_LOCAL = location.protocol === 'file:'
  || location.hostname === 'localhost'
  || location.hostname === '127.0.0.1';

// "Work as user" — admin impersonation. Set via adminSetWorkAsUser().
window._workAsUid = null;

function _uid() {
  // Admin "Work as" override
  if (window._workAsUid) return window._workAsUid;
  // Server mode: use the user injected by PHP/inline script
  if (!IS_LOCAL && window._currentUser && window._currentUser.uid) return window._currentUser.uid;
  // Local mode: read from st-session in localStorage
  return (JSON.parse(localStorage.getItem('st-session') || '{}') || {}).uid || 'demo';
}
function _key(module) { return 'st-' + _uid() + '-' + module; }

// ── Read / Write ───────────────────────────────────────────────────
function stRead(module) {
  return JSON.parse(localStorage.getItem(_key(module)) || '[]');
}
function stWrite(module, data) {
  localStorage.setItem(_key(module), JSON.stringify(data));
  if (!IS_LOCAL) _serverSync(module, data);
}
function stUpsert(module, item) {
  const list = stRead(module);
  const idx  = list.findIndex(x => x.id === item.id);
  if (idx > -1) list[idx] = item; else list.push(item);
  stWrite(module, list);
  return item;
}
function stDelete(module, id) {
  stWrite(module, stRead(module).filter(x => x.id !== id));
}

// ── Object store (single object, not array) ────────────────────────
function stReadObj(module) {
  return JSON.parse(localStorage.getItem(_key(module)) || '{}');
}
function stWriteObj(module, obj) {
  localStorage.setItem(_key(module), JSON.stringify(obj));
  if (!IS_LOCAL) _serverSync(module, obj);
}

// ── Activity log ───────────────────────────────────────────────────
// Activity is intentionally kept local-only (localStorage) as a lightweight
// per-device audit trail. It is not synced to the server via _serverSync.
function stLog(type, message) {
  const key = 'st-' + _uid() + '-activity';
  const log  = JSON.parse(localStorage.getItem(key) || '[]');
  log.unshift({ id: 'a_' + Date.now(), type, message, at: new Date().toISOString() });
  if (log.length > 100) log.length = 100;
  localStorage.setItem(key, JSON.stringify(log));
}
function stReadActivity() {
  return JSON.parse(localStorage.getItem('st-' + _uid() + '-activity') || '[]');
}

// ── HTML escape (shared across modules) ────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Relative time ──────────────────────────────────────────────────
function relTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24)  return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7)   return d + 'd ago';
  return new Date(isoStr).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

// ── Format date string ─────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

// ── Server sync (with auth check & user warning) ───────────────────
let _syncFailCount = 0;
async function _serverSync(module, data) {
  try {
    const body = { action: 'sync', data };
    if (window._workAsUid) body.as_uid = window._workAsUid;
    const res = await fetch('api/' + module + '.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.ok) {
      _syncFailCount = 0;
      _hideSyncWarning();
    } else {
      console.warn('[SkillTrack] Sync rejected:', module, json.error);
      _syncFailCount++;
      if (json.error === 'Not authenticated') {
        _showSyncWarning('Session expired — your changes are saved locally only. Please <a href="index.php" style="color:#fff;text-decoration:underline">log in again</a> to sync.');
      } else {
        _showSyncWarning('Sync failed: ' + (json.error || 'server error'));
      }
    }
  } catch(e) {
    console.warn('[SkillTrack] Sync failed:', module, e);
    _syncFailCount++;
    _showSyncWarning('Cannot reach server — changes saved locally only.');
  }
}

function _showSyncWarning(msg) {
  let bar = document.getElementById('sync-warning-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'sync-warning-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:#fff;padding:8px 16px;font-size:13px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.2);';
    document.body.prepend(bar);
  }
  bar.innerHTML = msg;
  bar.style.display = '';
}
function _hideSyncWarning() {
  const bar = document.getElementById('sync-warning-bar');
  if (bar) bar.style.display = 'none';
}

// ── Server init: load all data from PHP APIs into localStorage ─────
async function stInit() {
  if (IS_LOCAL) return;
  const modules = ['goals', 'skills', 'learning', 'timetable', 'jobs'];
  let authFailed = false;
  await Promise.all(modules.map(async mod => {
    try {
      const body = { action: 'list' };
      if (window._workAsUid) body.as_uid = window._workAsUid;
      const res = await fetch('api/' + mod + '.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await res.json();
      if (d.ok) {
        localStorage.setItem(_key(mod), JSON.stringify(d.data ?? []));
      } else if (d.error === 'Not authenticated') {
        authFailed = true;
      }
    } catch(e) {
      console.warn('[SkillTrack] stInit fetch failed for', mod, e);
    }
  }));
  if (authFailed) {
    window.location.href = 'index.php';
  }
}

// ── AI call ────────────────────────────────────────────────────────
async function aiCall(action, payload) {
  if (IS_LOCAL) return _aiCallLocal(action, payload);
  try {
    const res = await fetch('api/ai.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const preview = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
      return { ok: false, error: 'Server error: ' + (preview || 'HTTP ' + res.status) };
    }
    // Unwrap PHP jsonOut envelope: {ok, data:{skills,items,...}} → {ok, skills, items,...}
    if (json.ok && json.data) return { ok: true, ...json.data };
    return json; // error: {ok:false, error:'...'}
  } catch(e) {
    return { ok: false, error: 'Connection error: ' + e.message };
  }
}

// ── Local-mode: direct Claude API call from browser ────────────────
async function _callClaudeDirect(messages, maxTokens) {
  const key = localStorage.getItem('st-claude-key') || '';
  if (!key) return { ok: false, error: 'NO_KEY' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, system: 'You are a JSON-only API. Always respond with raw JSON only — no markdown fences, no explanation, no prose. Never wrap the result in an object unless explicitly asked.', messages })
    });
    const data = await res.json();
    if (data.content && data.content[0] && data.content[0].text) return { ok: true, text: data.content[0].text };
    return { ok: false, error: data.error ? data.error.message : 'AI response error.' };
  } catch(e) {
    return { ok: false, error: 'API connection failed: ' + e.message };
  }
}

function _extractJsonLocal(text) {
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const i = s.search(/[\[{]/);
  if (i > 0) s = s.slice(i);
  try { return JSON.parse(s); } catch { return null; }
}

async function _aiCallLocal(action, payload) {
  const key = localStorage.getItem('st-claude-key') || '';
  if (!key) {
    // Prompt user for key
    const entered = prompt('Enter your Anthropic API key to use AI features locally:\n(It will be saved in your browser only)');
    if (!entered || !entered.trim()) return { ok: false, error: 'API key required to use AI features.' };
    localStorage.setItem('st-claude-key', entered.trim());
  }

  if (action === 'suggest_skills') {
    const { goalName, goalType } = payload;
    const prompt = `List 15-20 key skills required for the goal: '${goalName}' (Type: ${goalType}). Group them into logical categories and assign a required proficiency level. Return ONLY a JSON array of objects: [{"name":"skill name","category":"category name","level":"Expert|Advanced|Intermediate|Beginner"}]. No explanation, no markdown.`;
    const r = await _callClaudeDirect([{ role:'user', content: prompt }], 1500);
    if (!r.ok) return r;
    const skills = _extractJsonLocal(r.text);
    if (!Array.isArray(skills)) return { ok: false, error: 'AI returned unexpected format.' };
    return { ok: true, skills };
  }

  if (action === 'gap_narrative') {
    const { goalName, matched, partial, weak, missing } = payload;
    const prompt = `Give a concise 2-3 paragraph career coaching narrative about this gap analysis for goal '${goalName}'.\n\nMatched: ${(matched||[]).join(', ')||'none'}\nPartial: ${(partial||[]).join(', ')||'none'}\nWeak: ${(weak||[]).join(', ')||'none'}\nMissing: ${(missing||[]).join(', ')||'none'}\n\nBe encouraging and specific. Highlight strengths, identify the most important gaps, and give a motivating next-step recommendation.`;
    const r = await _callClaudeDirect([{ role:'user', content: prompt }], 1024);
    if (!r.ok) return r;
    return { ok: true, narrative: r.text.trim() };
  }

  if (action === 'learning_path') {
    const { goalName, goalType, missingSkills, weakSkills, existingSkills } = payload;
    const prompt = `Generate a structured learning path for '${goalName}' (Type: ${goalType}).\n\nSkills already strong: ${(existingSkills||[]).join(', ')||'none'}\nNeeds improvement: ${(weakSkills||[]).join(', ')||'none'}\nMissing entirely: ${(missingSkills||[]).join(', ')||'none'}\n\nReturn ONLY a JSON array:\n[{"topic":"...","description":"...","estimatedHours":10,"resources":[{"title":"...","url":"..."}]}]\n\n8-12 topics, foundational to advanced, focus on missing/weak skills.`;
    const r = await _callClaudeDirect([{ role:'user', content: prompt }], 3000);
    if (!r.ok) return r;
    const parsed = _extractJsonLocal(r.text);
    const items  = Array.isArray(parsed) ? parsed
                 : (parsed && Array.isArray(parsed.items)  ? parsed.items
                 : (parsed && Array.isArray(parsed.topics) ? parsed.topics
                 : (parsed && Array.isArray(parsed.path)   ? parsed.path : null)));
    if (!items) return { ok: false, error: 'AI returned unexpected format.' };
    return { ok: true, items };
  }

  if (action === 'extract_resume') {
    const pdfB64 = (payload.pdfBase64 || '').replace(/^data:application\/pdf;base64,/, '');
    const content = [
      { type:'document', source:{ type:'base64', media_type:'application/pdf', data: pdfB64 } },
      { type:'text', text:'Extract all technical and soft skills from this resume. Return ONLY a JSON array: [{"name":"...","group":"...","proficiency":"..."}] where group is one of: Cloud & Data Platforms, Data Engineering, Programming, AI/ML, Visualization & BI, DevOps & CI/CD, Architecture & Design, Soft Skills, Custom. Proficiency must be one of: Beginner, Intermediate, Advanced, Expert.' }
    ];
    const r = await _callClaudeDirect([{ role:'user', content }], 3000);
    if (!r.ok) return r;
    const skills = _extractJsonLocal(r.text);
    if (!Array.isArray(skills)) return { ok: false, error: 'AI returned unexpected format.' };
    return { ok: true, skills };
  }

  if (action === 'job_analysis') {
    const { candidateName, skills, jobText } = payload;
    const today = new Date().toISOString().slice(0,10);
    const prompt = `You are a career coach. Analyse this job posting against the candidate's skills and return ONLY a JSON object.\n\nCandidate: ${candidateName}\nCandidate skills: ${skills}\n\nJob posting:\n${(jobText||'').slice(0,2500)}\n\nReturn ONLY valid JSON:\n{"jobTitle":"...","company":"...","matchScore":72,"matchLevel":"Moderate Match","overallAdvice":"2-3 sentence coaching summary","topStrengths":["s1","s2","s3"],"criticalGaps":["g1","g2"],"jobSpecificGaps":["g1","g2"],"learningPlan":["step1","step2","step3","step4"],"resumeTips":["t1","t2"],"interviewTopics":["t1","t2","t3"],"applicationStrategy":"1-2 sentence strategy","salaryInsight":"","jobMeta":{"source":"Dice|LinkedIn|Indeed|Glassdoor|Company Website|Recruiter|Other","clientName":"end client if different from company else empty","city":"","state":"","country":"US if not specified","employerType":"Direct Hire|Recruiter|Staffing Agency|Consulting Firm|Other","employmentType":"Full-Time|Part-Time|Contract|Contract-to-Hire|Internship|Freelance","salary":"salary or range as stated else empty","workMode":"Remote|Hybrid|Onsite|Not Specified","postedDate":"YYYY-MM-DD format. Convert relative dates like 'Posted 2 days ago' or 'Updated 3 hours ago' to actual date using today. Empty if not found."}}\n\nmatchScore is 0-100. matchLevel: Strong Match | Moderate Match | Partial Match.\nToday's date is ${today}. Use this to convert relative posted dates (e.g. "2 days ago" means subtract 2 days from today).\nFor jobMeta: extract whatever is available from the posting. Use empty string for fields not found. Do NOT guess.`;
    const r = await _callClaudeDirect([{ role:'user', content: prompt }], 2000);
    if (!r.ok) return r;
    const data = _extractJsonLocal(r.text);
    if (!data || typeof data !== 'object') return { ok: false, error: 'AI returned unexpected format.' };
    return { ok: true, ...data };
  }

  if (action === 'cover_letter') {
    const { candidateName, jobTitle, company, topStrengths, jobText } = payload;
    const prompt = `Write a professional cover letter for ${candidateName} applying for ${jobTitle} at ${company}.\n\nKey strengths: ${topStrengths}\n\nJob context:\n${(jobText||'').slice(0,1200)}\n\nWrite 3 paragraphs: (1) opening with enthusiasm and fit, (2) key strengths with examples, (3) closing with call to action.\nReturn only the cover letter text — no subject line, no JSON, no markdown.`;
    const r = await _callClaudeDirect([{ role:'user', content: prompt }], 1200);
    if (!r.ok) return r;
    return { ok: true, letter: r.text.trim() };
  }

  return { ok: false, error: 'Unknown action: ' + action };
}

// ── Manage stored API key ───────────────────────────────────────────
function stSetApiKey() {
  const current = localStorage.getItem('st-claude-key') || '';
  const entered = prompt('Enter your Anthropic API key (starts with sk-ant-):\n\nLeave blank to clear.', current);
  if (entered === null) return; // cancelled
  if (!entered.trim()) {
    localStorage.removeItem('st-claude-key');
    alert('API key cleared.');
  } else {
    localStorage.setItem('st-claude-key', entered.trim());
    alert('API key saved. AI features are now active.');
  }
}
function stHasApiKey() { return !!(localStorage.getItem('st-claude-key') || ''); }
