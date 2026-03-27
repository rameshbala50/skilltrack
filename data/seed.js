/* ═══════════════════════════════════════════════════════════════
   SkillTrack — Seed Data
   Populates localStorage with starter data on first load.
   Edit this file to customise your skills, goals, and job tracker.
   seedAppData(true) forces a full reseed (clears existing data).
═══════════════════════════════════════════════════════════════ */
'use strict';

// ── GOALS ─────────────────────────────────────────────────────────
const SEED_GOALS = [
  {
    id          : 'g_snowflake_architect',
    name        : 'Snowflake Architect',
    type        : 'Job Role',
    priority    : 'Primary',
    targetDate  : '2026-12-31',
    description : 'Designs and optimises enterprise-grade cloud data platforms on Snowflake. Responsible for data warehouse architecture, performance tuning, governance, security, and enabling self-serve analytics at scale.',
    notes       : '8–15 years overall experience. 3–6 years hands-on Snowflake. Strong prior data warehouse background (Teradata, Oracle, etc.).',
    createdAt   : '2026-01-01T00:00:00.000Z',
    requiredSkills : [
      // 1. Snowflake Core Expertise (Must-Have)
      { name:'Snowflake Architecture (multi-cluster, virtual warehouses, storage layer)', category:'Snowflake Core Expertise', level:'Expert'       },
      { name:'Data Sharing & Data Marketplace',                                          category:'Snowflake Core Expertise', level:'Expert'       },
      { name:'Time Travel, Fail-safe, Zero-copy Cloning',                               category:'Snowflake Core Expertise', level:'Expert'       },
      { name:'Snowflake Stages (internal/external)',                                     category:'Snowflake Core Expertise', level:'Expert'       },
      { name:'File Formats (CSV, JSON, Parquet, Avro, ORC)',                            category:'Snowflake Core Expertise', level:'Advanced'     },
      { name:'Performance Tuning (clustering, pruning, caching)',                       category:'Snowflake Core Expertise', level:'Expert'       },
      { name:'Snowflake Security Model (RBAC, masking policies, row-level security)',   category:'Snowflake Core Expertise', level:'Expert'       },

      // 2. Cloud Platform Knowledge
      { name:'AWS (S3, IAM, EC2, Lambda)',            category:'Cloud Platform Knowledge', level:'Advanced'     },
      { name:'Azure (ADLS, ADF, Synapse)',            category:'Cloud Platform Knowledge', level:'Intermediate' },
      { name:'GCP (GCS, BigQuery basics)',            category:'Cloud Platform Knowledge', level:'Intermediate' },
      { name:'Networking (VPC, PrivateLink)',         category:'Cloud Platform Knowledge', level:'Advanced'     },
      { name:'Storage Integration',                  category:'Cloud Platform Knowledge', level:'Advanced'     },
      { name:'Cloud Cost Management',                category:'Cloud Platform Knowledge', level:'Advanced'     },

      // 3. Data Engineering Skills
      { name:'ETL/ELT Design Patterns',              category:'Data Engineering Skills',  level:'Expert'       },
      { name:'Batch & Near Real-time Ingestion',     category:'Data Engineering Skills',  level:'Advanced'     },
      { name:'Snowpipe',                             category:'Data Engineering Skills',  level:'Advanced'     },
      { name:'Kafka / Streaming Basics',             category:'Data Engineering Skills',  level:'Intermediate' },
      { name:'Airflow / Orchestration Tools',        category:'Data Engineering Skills',  level:'Advanced'     },
      { name:'dbt (Core / Cloud)',                   category:'Data Engineering Skills',  level:'Advanced'     },
      { name:'Star Schema / Snowflake Schema',       category:'Data Engineering Skills',  level:'Expert'       },
      { name:'Data Vault',                           category:'Data Engineering Skills',  level:'Advanced'     },

      // 4. SQL & Query Optimization
      { name:'Advanced SQL (window functions, CTEs, recursive queries)', category:'SQL & Query Optimization', level:'Expert'   },
      { name:'Query Profiling & Optimization',                           category:'SQL & Query Optimization', level:'Expert'   },
      { name:'Handling Large-scale Datasets Efficiently',                category:'SQL & Query Optimization', level:'Advanced' },

      // 5. Data Governance & Security
      { name:'Role-based Access Control (RBAC)',     category:'Data Governance & Security', level:'Advanced'     },
      { name:'Data Masking & Encryption',            category:'Data Governance & Security', level:'Advanced'     },
      { name:'GDPR / Compliance Basics',             category:'Data Governance & Security', level:'Intermediate' },
      { name:'Auditing & Monitoring',                category:'Data Governance & Security', level:'Advanced'     },

      // 6. Architecture & Design Skills
      { name:'End-to-end Data Platform Design',           category:'Architecture & Design Skills', level:'Expert'   },
      { name:'Data Lake vs Data Warehouse vs Lakehouse',  category:'Architecture & Design Skills', level:'Expert'   },
      { name:'Medallion Architecture (Bronze/Silver/Gold)',category:'Architecture & Design Skills', level:'Advanced' },
      { name:'High Availability & Disaster Recovery',     category:'Architecture & Design Skills', level:'Advanced' },
      { name:'Multi-region / Cross-cloud Architecture',   category:'Architecture & Design Skills', level:'Advanced' },

      // 7. DevOps & Automation
      { name:'CI/CD Pipelines (Git, GitHub Actions, Azure DevOps)', category:'DevOps & Automation', level:'Intermediate' },
      { name:'Terraform / Infrastructure as Code',                  category:'DevOps & Automation', level:'Intermediate' },
      { name:'Version Control & Release Management',                category:'DevOps & Automation', level:'Advanced'     },

      // 8. BI & Analytics Integration
      { name:'Power BI',                             category:'BI & Analytics Integration', level:'Intermediate' },
      { name:'Tableau',                              category:'BI & Analytics Integration', level:'Intermediate' },
      { name:'Looker',                               category:'BI & Analytics Integration', level:'Intermediate' },
      { name:'Semantic Layer Design',                category:'BI & Analytics Integration', level:'Advanced'     },
      { name:'Performance Tuning for Dashboards',   category:'BI & Analytics Integration', level:'Advanced'     },

      // 9. Monitoring & Cost Optimization
      { name:'Warehouse Sizing Strategies',          category:'Monitoring & Cost Optimization', level:'Advanced' },
      { name:'Auto-suspend / Auto-resume',           category:'Monitoring & Cost Optimization', level:'Advanced' },
      { name:'Query Cost Analysis',                  category:'Monitoring & Cost Optimization', level:'Advanced' },
      { name:'Resource Monitors',                    category:'Monitoring & Cost Optimization', level:'Advanced' },

      // 10. Soft Skills
      { name:'Stakeholder Communication',            category:'Soft Skills', level:'Advanced' },
      { name:'Requirement Gathering',                category:'Soft Skills', level:'Advanced' },
      { name:'Solution Design Documentation',        category:'Soft Skills', level:'Advanced' },
      { name:'Mentoring Engineers',                  category:'Soft Skills', level:'Advanced' },
      { name:'Decision-making Under Trade-offs',     category:'Soft Skills', level:'Advanced' },

      // Bonus / High-Value Skills
      { name:'Snowpark (Python, Java, Scala)',        category:'Bonus Skills', level:'Intermediate' },
      { name:'AI/ML Integration with Snowflake',     category:'Bonus Skills', level:'Intermediate' },
      { name:'Cortex / GenAI Features',              category:'Bonus Skills', level:'Intermediate' },
      { name:'Data Catalog Tools (Alation, Collibra)',category:'Bonus Skills', level:'Beginner'     }
    ]
  }
];

// ── MY SKILLS ─────────────────────────────────────────────────────
// ✏️  Update proficiency levels to match your actual experience.
// Levels: Beginner | Intermediate | Advanced | Expert
const SEED_SKILLS = [

  // ── Cloud & Data Platforms ──────────────────────────────────────
  { id:'sk_sf_arch',    name:'Snowflake Architecture',          group:'Cloud & Data Platforms', proficiency:'Advanced',     notes:'Multi-cluster warehouses, storage layer, micropartitions' },
  { id:'sk_sf_vw',      name:'Virtual Warehouses',              group:'Cloud & Data Platforms', proficiency:'Advanced',     notes:'Sizing, multi-cluster, auto-suspend/resume' },
  { id:'sk_sf_pipe',    name:'Snowpipe',                        group:'Cloud & Data Platforms', proficiency:'Advanced',     notes:'Continuous data ingestion, event notifications' },
  { id:'sk_sf_clone',   name:'Zero-Copy Cloning',               group:'Cloud & Data Platforms', proficiency:'Advanced',     notes:'Dev/test environments, instant clones' },
  { id:'sk_sf_share',   name:'Data Sharing & Marketplace',      group:'Cloud & Data Platforms', proficiency:'Intermediate', notes:'Reader accounts, inbound/outbound shares' },
  { id:'sk_sf_tt',      name:'Time Travel & Fail-safe',         group:'Cloud & Data Platforms', proficiency:'Intermediate', notes:'Data recovery, retention periods' },
  { id:'sk_sf_stages',  name:'Snowflake Stages & File Formats', group:'Cloud & Data Platforms', proficiency:'Advanced',     notes:'Internal/external stages, Parquet, JSON, CSV' },
  { id:'sk_sf_rbac',    name:'Snowflake RBAC & Security',       group:'Cloud & Data Platforms', proficiency:'Intermediate', notes:'Roles, privileges, masking policies' },
  { id:'sk_aws',        name:'AWS (S3, IAM, EC2)',               group:'Cloud & Data Platforms', proficiency:'Intermediate', notes:'S3 storage integration, IAM roles, Lambda basics' },
  { id:'sk_azure',      name:'Azure (ADLS, ADF)',                group:'Cloud & Data Platforms', proficiency:'Beginner',     notes:'Azure Data Lake Storage, basic ADF pipelines' },

  // ── Data Engineering ────────────────────────────────────────────
  { id:'sk_dbt',        name:'dbt (Core / Cloud)',               group:'Data Engineering',       proficiency:'Intermediate', notes:'Models, tests, documentation, snapshots' },
  { id:'sk_airflow',    name:'Apache Airflow',                   group:'Data Engineering',       proficiency:'Intermediate', notes:'DAGs, operators, scheduling, dependencies' },
  { id:'sk_etl',        name:'ETL/ELT Pipeline Design',          group:'Data Engineering',       proficiency:'Advanced',     notes:'Batch pipelines, incremental loads, full refresh patterns' },
  { id:'sk_ingestion',  name:'Batch & Near Real-time Ingestion', group:'Data Engineering',       proficiency:'Intermediate', notes:'Snowpipe, COPY INTO, streaming patterns' },
  { id:'sk_kafka',      name:'Kafka / Streaming Basics',         group:'Data Engineering',       proficiency:'Beginner',     notes:'Topics, consumers, Kafka Connect basics' },
  { id:'sk_star',       name:'Star Schema / Snowflake Schema',   group:'Data Engineering',       proficiency:'Advanced',     notes:'Dimensional modelling, fact/dimension tables' },
  { id:'sk_datavault',  name:'Data Vault',                       group:'Data Engineering',       proficiency:'Beginner',     notes:'Hubs, links, satellites — enterprise pattern' },
  { id:'sk_medallion',  name:'Medallion Architecture',           group:'Data Engineering',       proficiency:'Intermediate', notes:'Bronze/Silver/Gold layers, lakehouse pattern' },
  { id:'sk_dwarch',     name:'Data Warehouse Architecture',      group:'Data Engineering',       proficiency:'Advanced',     notes:'End-to-end platform design, lakehouse vs DW' },

  // ── Programming ─────────────────────────────────────────────────
  { id:'sk_sql',        name:'Advanced SQL',                     group:'Programming',            proficiency:'Expert',       notes:'Window functions, CTEs, recursive queries, query optimisation' },
  { id:'sk_python',     name:'Python',                           group:'Programming',            proficiency:'Intermediate', notes:'Pandas, data transformation, automation scripts' },
  { id:'sk_snowpark',   name:'Snowpark',                         group:'Programming',            proficiency:'Beginner',     notes:'Python UDFs, stored procedures in Snowpark' },
  { id:'sk_git',        name:'Git / GitHub',                     group:'Programming',            proficiency:'Intermediate', notes:'Version control, branching, pull requests' },

  // ── AI/ML ───────────────────────────────────────────────────────
  { id:'sk_cortex',     name:'Snowflake Cortex / GenAI',         group:'AI/ML',                  proficiency:'Beginner',     notes:'Cortex AI functions, LLM integration basics' },

  // ── Visualization & BI ──────────────────────────────────────────
  { id:'sk_powerbi',    name:'Power BI',                         group:'Visualization & BI',     proficiency:'Intermediate', notes:'Reports, dashboards, DAX basics, Snowflake connector' },
  { id:'sk_tableau',    name:'Tableau',                          group:'Visualization & BI',     proficiency:'Intermediate', notes:'Dashboards, LOD expressions, performance tuning' },

  // ── DevOps & CI/CD ──────────────────────────────────────────────
  { id:'sk_cicd',       name:'CI/CD Pipelines',                  group:'DevOps & CI/CD',         proficiency:'Beginner',     notes:'GitHub Actions basics, deployment pipelines' },
  { id:'sk_terraform',  name:'Terraform',                        group:'DevOps & CI/CD',         proficiency:'Beginner',     notes:'IaC basics, Snowflake provider' },

  // ── Architecture & Design ───────────────────────────────────────
  { id:'sk_ha',         name:'High Availability & DR',           group:'Architecture & Design',  proficiency:'Beginner',     notes:'Failover, business continuity, replication' },
  { id:'sk_govern',     name:'Data Governance & Lineage',        group:'Architecture & Design',  proficiency:'Intermediate', notes:'RBAC design, data classification, lineage tracking' },
  { id:'sk_compliance', name:'GDPR / Compliance',                group:'Architecture & Design',  proficiency:'Intermediate', notes:'Data masking, encryption, audit trails' },

  // ── Soft Skills ─────────────────────────────────────────────────
  { id:'sk_comm',       name:'Stakeholder Communication',        group:'Soft Skills',            proficiency:'Advanced',     notes:'Presenting technical solutions to business stakeholders' },
  { id:'sk_docs',       name:'Solution Design Documentation',    group:'Soft Skills',            proficiency:'Advanced',     notes:'Architecture diagrams, HLD/LLD documents' },
  { id:'sk_mentor',     name:'Mentoring Engineers',              group:'Soft Skills',            proficiency:'Intermediate', notes:'Code reviews, knowledge sharing, guiding junior team members' }
];

// ── JOB TRACKER ───────────────────────────────────────────────────
// ✏️  Add your actual job applications here.
const SEED_JOBS = [
  {
    id          : 'j_sample_1',
    company     : 'Example Corp',
    role        : 'Senior Snowflake Architect',
    url         : '',
    status      : 'Wishlist',
    salary      : '£90k–£110k',
    location    : 'London / Remote',
    appliedDate : '',
    notes       : 'Found on LinkedIn. Good tech stack match.',
    linkedGoalId: 'g_snowflake_architect',
    addedAt     : new Date().toISOString()
  }
];

// ── SEEDER ─────────────────────────────────────────────────────────
function seedAppData(force) {
  if (!IS_LOCAL) return; // Only run locally

  const session = JSON.parse(localStorage.getItem('st-session') || '{}');
  const uid     = session.uid || 'demo';

  // Only seed sample data for the default test user, not new users
  if (!force && uid !== 'w3help@yahoo.com' && uid !== 'demo') return;

  const stamp   = key => 'st-' + uid + '-' + key;
  const flag    = stamp('seeded-v4');

  if (!force && localStorage.getItem(flag)) return; // already seeded

  // Attach IDs and timestamps to skills
  const now    = new Date().toISOString();
  const skills = SEED_SKILLS.map(s => ({ ...s, addedAt: s.addedAt || now }));

  localStorage.setItem(stamp('goals'),  JSON.stringify(SEED_GOALS));
  localStorage.setItem(stamp('skills'), JSON.stringify(skills));
  localStorage.setItem(stamp('jobs'),   JSON.stringify(SEED_JOBS));

  // Mark seeded
  localStorage.setItem(flag, now);

  console.log('[SkillTrack] Seed data loaded:', {
    goals : SEED_GOALS.length,
    skills: skills.length,
    jobs  : SEED_JOBS.length
  });
}

// ── CONSOLE HELPERS (paste in DevTools if needed) ─────────────────
// Force reseed:          seedAppData(true)
// Clear all app data:    Object.keys(localStorage).filter(k=>k.startsWith('st-')).forEach(k=>localStorage.removeItem(k))
