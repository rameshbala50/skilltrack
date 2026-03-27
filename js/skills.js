/* ──────────────────────────────────────────
   SkillTrack — Skills Module
────────────────────────────────────────── */
'use strict';

const SKILL_GROUPS = [
  'Cloud & Data Platforms','Data Engineering','Programming','AI/ML',
  'Visualization & BI','DevOps & CI/CD','Architecture & Design','Soft Skills','Custom'
];
const SKILL_GROUP_CFG = {
  'Cloud & Data Platforms' : { icon:'☁️',  color:'#0369a1', bg:'#f0f9ff' },
  'Data Engineering'       : { icon:'⚙️',  color:'#d97706', bg:'#fffbeb' },
  'Programming'            : { icon:'💻',  color:'#059669', bg:'#f0fdf4' },
  'AI/ML'                  : { icon:'🤖',  color:'#0d9488', bg:'#f0fdfa' },
  'Visualization & BI'     : { icon:'📊',  color:'#7c3aed', bg:'#faf5ff' },
  'DevOps & CI/CD'         : { icon:'🔧',  color:'#64748b', bg:'#f8fafc' },
  'Architecture & Design'  : { icon:'🏗️', color:'#7c3aed', bg:'#f5f3ff' },
  'Soft Skills'            : { icon:'🤝',  color:'#0d9488', bg:'#f0fdfa' },
  'Custom'                 : { icon:'⭐',  color:'#b45309', bg:'#fef3c7' }
};
const PROF_CONFIG = {
  'Beginner'    : { color:'#94a3b8', bg:'#f1f5f9' },
  'Intermediate': { color:'#06b6d4', bg:'#ecfeff' },
  'Advanced'    : { color:'#0d9488', bg:'#f0fdfa' },
  'Expert'      : { color:'#d97706', bg:'#fffbeb' }
};
const PROF_ORDER = ['Beginner','Intermediate','Advanced','Expert'];

let _skillGroup  = 'all';
let _skillSearch = '';
let _skillProf   = 'Intermediate';

// ── Keyword → Group mapping for auto-categorisation ────────────────
const _SKILL_KEYWORD_MAP = [
  // AI/ML
  ['AI/ML', ['machine learning','deep learning','neural network','tensorflow','pytorch','scikit',
    'keras','llm','gpt','nlp','bert','transformer','hugging face','langchain','llamaindex',
    'openai','anthropic','gemini','rag','embedding','xgboost','lightgbm','mlflow','wandb',
    'vector database','pinecone','weaviate','regression','classification','clustering',
    'dimensionality','pca','t-sne','umap','svm','support vector','random forest','gradient boost',
    'diffusion','gan','computer vision','cnn','rnn','lstm','attention','fine-tun','lora','qlora',
    'prompt engineer','semantic search','feature engineer','hyperparameter','experiment track',
    'model monitor','model serv','model registr','feature store','explainab','shap','lime',
    'responsible ai','ai governance','ai safety','cortex','snowpark ml']],
  // Programming
  ['Programming', ['python','java','javascript','typescript','sql','scala','golang','rust','c++',
    'c#','ruby','kotlin','swift','fastapi','flask','django','fastapi','jinja','pandas','numpy',
    'polars','dbt','data wrangling','eda','exploratory data','rest api','graphql','bash','shell',
    'r programming','advanced sql','query optim']],
  // Cloud & Data Platforms
  ['Cloud & Data Platforms', ['aws','azure','gcp','google cloud','snowflake','databricks',
    'bigquery','s3','sagemaker','vertex ai','azure ml','adls','redshift','synapse','glue',
    'emr','lambda','ec2','rds','cosmos','cloud storage','gpu instance','cloud platform',
    'data warehouse','data lakehouse','data lake','data marketplace']],
  // Data Engineering
  ['Data Engineering', ['airflow','spark','pyspark','kafka','kinesis','dbt','fivetran','airbyte',
    'etl','elt','pipeline','flink','hadoop','hive','data pipeline','streaming','batch process',
    'data ingestion','data labelling','annotation','data build tool','schemachange','flyway',
    'tasks & streams','dynamic table','snowflake stage','replication']],
  // Visualization & BI
  ['Visualization & BI', ['tableau','power bi','looker','streamlit','matplotlib','seaborn',
    'plotly','grafana','superset','qlik','metabase','d3','chart','dashboard','report',
    'visualis','bi tool']],
  // DevOps & CI/CD
  ['DevOps & CI/CD', ['docker','kubernetes','k8s','git','terraform','jenkins','github actions',
    'gitlab','ci/cd','mlops','helm','ansible','linux','devops','containeris','container',
    'infrastructure','iac','deployment','monitoring','observab','prometheus','datadog',
    'version control','ci pipeline','cd pipeline']],
  // Architecture & Design
  ['Architecture & Design', ['architecture','system design','rbac','role-based','security',
    'governance','compliance','data modeling','schema','data vault','medallion','star schema',
    'snowflake schema','slowly changing','scd','data masking','row-level','column-level',
    'network policy','oauth','saml','sso','private link','solution design','design pattern',
    'microservice','api design','performance','optimis','clustering key','materialized view',
    'query profile','explain plan','warehouse sizing','search optimiz']],
  // Soft Skills
  ['Soft Skills', ['communication','leadership','collaboration','presentation','stakeholder',
    'agile','scrum','project management','cross-functional','mentoring','coaching','negotiation',
    'problem solving','critical thinking','time management','documentation','cost optimis',
    'cost mindset']],
];

function _inferSkillGroup(skillName) {
  const n = skillName.toLowerCase();
  for (const [group, keywords] of _SKILL_KEYWORD_MAP) {
    if (keywords.some(kw => n.includes(kw))) return group;
  }
  return null;
}

function autoCategorizeCustomSkills() {
  const skills  = stRead('skills');
  const customs = skills.filter(s => !s.group || s.group === 'Custom');
  if (!customs.length) { alert('No skills in the Custom group.'); return; }

  let changed = 0;
  skills.forEach(s => {
    if (s.group && s.group !== 'Custom') return;
    const inferred = _inferSkillGroup(s.name);
    if (inferred) { s.group = inferred; changed++; }
  });

  if (!changed) { alert('Could not auto-categorize any Custom skills — try editing them manually.'); return; }
  stWrite('skills', skills);
  skillsRender();
}

// ── Render ─────────────────────────────────────────────────────────
function skillsRender() {
  const all  = stRead('skills');
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  const q        = _skillSearch.toLowerCase();
  const filtered = all.filter(s => {
    const okG = _skillGroup === 'all' || s.group === _skillGroup;
    const okS = !q || s.name.toLowerCase().includes(q) || (s.group||'').toLowerCase().includes(q);
    return okG && okS;
  });

  const statEl = document.getElementById('stat-skills');
  if (statEl) statEl.textContent = all.length;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <h3>${all.length===0?'No skills added yet':'No matching skills'}</h3>
      <p>${all.length===0?'Add skills manually or upload your resume.':'Try a different search or group.'}</p>
      ${all.length===0?`<div class="btn-group">
        <button class="btn btn-primary" onclick="openSkillModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Skill</button>
        <button class="btn btn-ghost" onclick="openResumeUpload()">Upload Resume</button>
      </div>`:''}
    </div>`;
    return;
  }

  let html = _skillsSummary(all);
  if (_skillGroup === 'all') {
    const byGroup = {};
    filtered.forEach(s => { const g=s.group||'Custom'; (byGroup[g]=byGroup[g]||[]).push(s); });
    html += `<div class="gap-categories">` +
      SKILL_GROUPS.filter(g=>byGroup[g]).map(g => _skillGroupBlock(g, byGroup[g])).join('') +
      `</div>`;
  } else {
    const cfg = SKILL_GROUP_CFG[_skillGroup] || { icon:'📋', color:'#64748b', bg:'#f8fafc' };
    html += `<div class="gap-categories">${_skillGroupBlock(_skillGroup, filtered)}</div>`;
  }
  grid.innerHTML = html;
}

function _skillsSummary(all) {
  if (!all.length) return '';
  const counts = {};
  PROF_ORDER.forEach(p => counts[p] = 0);
  all.forEach(s => { if (counts[s.proficiency] !== undefined) counts[s.proficiency]++; });
  const pills = PROF_ORDER.filter(p=>counts[p]).map(p => {
    const c = PROF_CONFIG[p];
    return `<span class="prof-summary-pill" style="background:${c.bg};color:${c.color}">${p}: <strong>${counts[p]}</strong></span>`;
  }).join('');
  return `<div class="skills-summary-bar"><span class="skills-total">${all.length} skill${all.length!==1?'s':''}</span><div class="prof-summary-pills">${pills}</div></div>`;
}

function _skillGroupBlock(group, skills) {
  const cfg      = SKILL_GROUP_CFG[group] || { icon:'📋', color:'#64748b', bg:'#f8fafc' };
  const autoBtn  = group === 'Custom'
    ? `<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 10px" onclick="autoCategorizeCustomSkills()" title="Move Custom skills to the right category">Auto-categorize</button>`
    : '';
  const rows = skills.map(s => {
    const pc = PROF_CONFIG[s.proficiency] || PROF_CONFIG['Intermediate'];
    return `<div class="gap-table-row">
      <div class="gap-skill-name">${esc(s.name)}</div>
      <div><span style="font-size:11px;font-weight:600;color:${pc.color};background:${pc.bg};padding:2px 10px;border-radius:20px;white-space:nowrap">${esc(s.proficiency)}</span></div>
      <div class="gap-status-cell" style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
        <button class="icon-btn" title="Edit" onclick="openSkillModal('${s.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn icon-btn-danger" title="Delete" onclick="skillsDelete('${s.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  return `<div class="gap-cat-block">
    <div class="gap-cat-header" style="background:${cfg.bg};border-color:${cfg.color}30">
      <div class="gap-cat-title">
        <span class="gap-cat-icon">${cfg.icon}</span>
        <span class="gap-cat-name" style="color:${cfg.color}">${esc(group.toUpperCase())}</span>
        <span class="gap-cat-count badge badge-muted">${skills.length} skill${skills.length!==1?'s':''}</span>
      </div>
      ${autoBtn}
    </div>
    <div class="gap-cat-table">
      <div class="gap-table-head"><div>Skill</div><div>Proficiency</div><div></div></div>
      ${rows}
    </div>
  </div>`;
}

// ── Delete ─────────────────────────────────────────────────────────
function skillsDelete(id) {
  const s = stRead('skills').find(x=>x.id===id);
  if (!confirm('Delete skill "' + (s?s.name:'') + '"?')) return;
  stDelete('skills', id);
  stLog('skill_deleted', 'Removed skill: ' + (s?s.name:''));
  skillsRender();
}

// ── Modal ──────────────────────────────────────────────────────────
function openSkillModal(id) {
  const skills = stRead('skills');
  const skill  = id ? skills.find(s=>s.id===id) : null;
  _skillProf   = skill ? skill.proficiency : 'Intermediate';

  document.getElementById('skill-modal-title').textContent = skill ? 'Edit Skill' : 'Add Skill';
  document.getElementById('sm-id').value    = skill ? skill.id : '';
  document.getElementById('sm-name').value  = skill ? skill.name : '';
  document.getElementById('sm-group').value = skill ? (skill.group||'Programming') : 'Programming';
  document.getElementById('sm-notes').value = skill ? (skill.notes||'') : '';
  document.getElementById('sm-error').textContent = '';

  _renderProfBtns();
  document.getElementById('skill-modal').classList.add('open');
  setTimeout(() => document.getElementById('sm-name').focus(), 80);
}
function closeSkillModal() { document.getElementById('skill-modal').classList.remove('open'); }

// Open modal pre-filled with a skill name (from Gap Analysis "I have this")
function openSkillModalPreset(name) {
  openSkillModal(null);
  setTimeout(() => {
    const el = document.getElementById('sm-name');
    if (el) { el.value = name; }
  }, 90);
}

function skillsSetProf(p) { _skillProf = p; _renderProfBtns(); }
function _renderProfBtns() {
  PROF_ORDER.forEach(p => {
    const btn = document.getElementById('sm-prof-' + p.toLowerCase());
    if (!btn) return;
    const pc = PROF_CONFIG[p];
    btn.style.background  = _skillProf===p ? pc.color : '';
    btn.style.color       = _skillProf===p ? '#fff'   : '';
    btn.style.borderColor = _skillProf===p ? pc.color : '';
  });
}

function skillsSaveForm() {
  const name  = document.getElementById('sm-name').value.trim();
  const errEl = document.getElementById('sm-error');
  if (!name) { errEl.textContent = 'Skill name is required.'; document.getElementById('sm-name').focus(); return; }
  const skills = stRead('skills');
  const id     = document.getElementById('sm-id').value;
  const dupe   = skills.find(s => s.name.toLowerCase()===name.toLowerCase() && s.id!==id);
  if (dupe) { errEl.textContent = `"${name}" already exists.`; return; }
  errEl.textContent = '';
  const existing = id ? skills.find(s=>s.id===id) : null;
  const skill = {
    id          : id || ('s_' + Date.now()),
    name,
    group       : document.getElementById('sm-group').value,
    proficiency : _skillProf,
    notes       : document.getElementById('sm-notes').value.trim(),
    addedAt     : existing ? existing.addedAt : new Date().toISOString()
  };
  stUpsert('skills', skill);
  stLog('skill_' + (id?'updated':'added'), (id?'Updated':'Added') + ' skill: ' + name + ' (' + _skillProf + ')');
  closeSkillModal();
  skillsRender();
  if (typeof dashboardRender === 'function') dashboardRender();
  // Auto-refresh gap analysis if it's currently showing results
  if (document.getElementById('panel-gap')?.classList.contains('active')) {
    if (typeof runGapAnalysis === 'function' && typeof _gapGoalId !== 'undefined' && _gapGoalId) runGapAnalysis();
  }
}

// ── Resume upload ──────────────────────────────────────────────────
function openResumeUpload() { document.getElementById('resume-upload-modal').classList.add('open'); }
function closeResumeModal() {
  document.getElementById('resume-upload-modal').classList.remove('open');
  document.getElementById('resume-file-input').value = '';
  document.getElementById('resume-status').innerHTML = '';
}
function handleResumeFile(input) {
  const file = input.files[0]; if (!file) return;
  const status = document.getElementById('resume-status');
  if (file.type !== 'application/pdf') { status.innerHTML = '<span style="color:var(--red)">Please select a PDF file.</span>'; return; }
  status.innerHTML = `<span style="color:var(--green)">✓ ${esc(file.name)} ready. Click Extract to process.</span>`;
  document.getElementById('btn-extract-resume').disabled = false;
}
async function extractResume() {
  const input = document.getElementById('resume-file-input');
  const file  = input.files[0]; if (!file) return;
  const status = document.getElementById('resume-status');
  status.innerHTML = '<span style="color:var(--primary)">Extracting skills via AI…</span>';
  document.getElementById('btn-extract-resume').disabled = true;

  const reader = new FileReader();
  reader.onload = async e => {
    const base64 = e.target.result.split(',')[1];
    const r = await aiCall('extract_resume', { pdfBase64: base64 });
    if (r.ok && Array.isArray(r.skills)) {
      const existing = stRead('skills');
      let added = 0;
      r.skills.forEach(s => {
        if (s.name && !existing.find(x => x.name.toLowerCase()===s.name.toLowerCase())) {
          stUpsert('skills', { id:'s_'+Date.now()+'_'+Math.random().toString(36).slice(2), name:s.name, group:s.group||'Custom', proficiency:s.proficiency||'Intermediate', notes:'Extracted from resume', addedAt:new Date().toISOString() });
          added++;
        }
      });
      status.innerHTML = `<span style="color:var(--green)">✓ Added ${added} new skill${added!==1?'s':''}.</span>`;
      stLog('resume_upload', `Extracted ${added} skills from resume`);
      skillsRender();
    } else {
      status.innerHTML = `<span style="color:var(--red)">${esc(r.error||'Extraction failed.')}</span>`;
      document.getElementById('btn-extract-resume').disabled = false;
    }
  };
  reader.readAsDataURL(file);
}

// ── Filters ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#skill-group-tabs .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#skill-group-tabs .pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); _skillGroup = btn.dataset.group; skillsRender();
    });
  });
  const search = document.getElementById('skills-search');
  if (search) search.addEventListener('input', () => { _skillSearch = search.value; skillsRender(); });
  skillsRender();
});
