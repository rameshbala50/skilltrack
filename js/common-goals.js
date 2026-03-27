/* ──────────────────────────────────────────
   SkillTrack — Common Goal Templates
   Maintained by admin; users can copy these.
────────────────────────────────────────── */
'use strict';

const COMMON_GOALS = [

  // ── Snowflake Data Architect ────────────────────────────────────────
  {
    id          : 'tpl_snowflake_architect',
    name        : 'Snowflake Data Architect',
    type        : 'Job Role',
    icon        : '❄️',
    description : 'Senior data platform architect specialising in Snowflake cloud data warehouse design, optimisation, and governance.',
    tags        : ['Snowflake', 'Cloud', 'Data Architecture', 'SQL'],
    requiredSkills: [
      // ── Snowflake Platform (Core) ─────────────────────────────────
      { name: 'Snowflake Virtual Warehouses',             category: 'Snowflake Platform (Core)', level: 'Expert'       },
      { name: 'Micro-partitions & Table Clustering',      category: 'Snowflake Platform (Core)', level: 'Expert'       },
      { name: 'Time Travel & Fail-safe',                  category: 'Snowflake Platform (Core)', level: 'Advanced'     },
      { name: 'Data Sharing & Marketplace',               category: 'Snowflake Platform (Core)', level: 'Advanced'     },
      { name: 'Snowflake Tasks & Streams',                category: 'Snowflake Platform (Core)', level: 'Advanced'     },
      { name: 'Dynamic Tables',                           category: 'Snowflake Platform (Core)', level: 'Intermediate' },
      { name: 'Snowpark (Python / Java / Scala)',         category: 'Snowflake Platform (Core)', level: 'Advanced'     },
      { name: 'Snowflake Stages (Internal / External)',   category: 'Snowflake Platform (Core)', level: 'Advanced'     },
      { name: 'Replication & Failover Groups',            category: 'Snowflake Platform (Core)', level: 'Advanced'     },

      // ── Data Architecture & Modeling ──────────────────────────────
      { name: 'Data Vault 2.0',                           category: 'Data Architecture & Modeling', level: 'Advanced' },
      { name: 'Star & Snowflake Schema Design',           category: 'Data Architecture & Modeling', level: 'Expert'   },
      { name: 'Medallion Architecture (Bronze/Silver/Gold)', category: 'Data Architecture & Modeling', level: 'Advanced' },
      { name: 'Data Lakehouse Architecture',              category: 'Data Architecture & Modeling', level: 'Advanced' },
      { name: 'Slowly Changing Dimensions (SCD)',         category: 'Data Architecture & Modeling', level: 'Advanced' },

      // ── Security & RBAC ───────────────────────────────────────────
      { name: 'Snowflake RBAC & Role Hierarchy',          category: 'Security & RBAC', level: 'Expert'       },
      { name: 'Row-Level Security',                       category: 'Security & RBAC', level: 'Advanced'     },
      { name: 'Column-Level Security & Data Masking',     category: 'Security & RBAC', level: 'Advanced'     },
      { name: 'Network Policies & Private Link',          category: 'Security & RBAC', level: 'Advanced'     },
      { name: 'OAuth & SAML SSO Integration',             category: 'Security & RBAC', level: 'Intermediate' },

      // ── Data Engineering & ETL ────────────────────────────────────
      { name: 'dbt (data build tool)',                    category: 'Data Engineering & ETL', level: 'Advanced'     },
      { name: 'Apache Airflow',                           category: 'Data Engineering & ETL', level: 'Intermediate' },
      { name: 'Fivetran / Airbyte (ELT)',                 category: 'Data Engineering & ETL', level: 'Intermediate' },
      { name: 'Kafka + Snowflake Connector',              category: 'Data Engineering & ETL', level: 'Intermediate' },

      // ── Programming & Query Languages ─────────────────────────────
      { name: 'Advanced SQL',                             category: 'Programming & Query Languages', level: 'Expert'       },
      { name: 'SQL Query Optimisation',                   category: 'Programming & Query Languages', level: 'Expert'       },
      { name: 'Python for Data Engineering',              category: 'Programming & Query Languages', level: 'Advanced'     },
      { name: 'Jinja Templating',                         category: 'Programming & Query Languages', level: 'Intermediate' },

      // ── Cloud Platforms ───────────────────────────────────────────
      { name: 'AWS (S3, IAM, Glue)',                      category: 'Cloud Platforms', level: 'Advanced'     },
      { name: 'Azure (ADLS, Synapse)',                     category: 'Cloud Platforms', level: 'Intermediate' },
      { name: 'GCP (BigQuery, GCS)',                      category: 'Cloud Platforms', level: 'Intermediate' },

      // ── BI & Analytics ────────────────────────────────────────────
      { name: 'Tableau / Power BI / Looker',              category: 'BI & Analytics', level: 'Intermediate' },
      { name: 'Streamlit in Snowflake',                   category: 'BI & Analytics', level: 'Intermediate' },

      // ── AI / ML & Cortex ──────────────────────────────────────────
      { name: 'Snowflake Cortex (LLM functions)',         category: 'AI / ML & Cortex', level: 'Intermediate' },
      { name: 'Snowflake ML Features',                    category: 'AI / ML & Cortex', level: 'Intermediate' },

      // ── DevOps & CI/CD ────────────────────────────────────────────
      { name: 'Git & Version Control',                    category: 'DevOps & CI/CD', level: 'Advanced'     },
      { name: 'Terraform (Snowflake provider)',            category: 'DevOps & CI/CD', level: 'Intermediate' },
      { name: 'CI/CD Pipelines (GitHub Actions)',         category: 'DevOps & CI/CD', level: 'Intermediate' },
      { name: 'SchemaChange / Flyway',                    category: 'DevOps & CI/CD', level: 'Intermediate' },

      // ── Performance Optimization ──────────────────────────────────
      { name: 'Query Profiling & Explain Plans',          category: 'Performance Optimization', level: 'Expert'       },
      { name: 'Warehouse Sizing & Auto-suspend',          category: 'Performance Optimization', level: 'Advanced'     },
      { name: 'Clustering Key Design',                    category: 'Performance Optimization', level: 'Advanced'     },
      { name: 'Materialized Views',                       category: 'Performance Optimization', level: 'Advanced'     },
      { name: 'Search Optimization Service',              category: 'Performance Optimization', level: 'Intermediate' },

      // ── Certifications ────────────────────────────────────────────
      { name: 'SnowPro Core Certification',               category: 'Certifications', level: 'Expert' },
      { name: 'SnowPro Advanced: Architect',              category: 'Certifications', level: 'Expert' },

      // ── Soft Skills ───────────────────────────────────────────────
      { name: 'Solution Design & Documentation',          category: 'Soft Skills', level: 'Advanced' },
      { name: 'Stakeholder Communication',                category: 'Soft Skills', level: 'Advanced' },
      { name: 'Cost Optimisation Mindset',                category: 'Soft Skills', level: 'Advanced' },
    ]
  },

  // ── AI Engineer ────────────────────────────────────────────────────
  {
    id          : 'tpl_ai_engineer',
    name        : 'AI Engineer',
    type        : 'Job Role',
    icon        : '🤖',
    description : 'Engineer who designs, builds, and deploys AI/ML systems and LLM-powered applications into production at scale.',
    tags        : ['AI', 'ML', 'LLM', 'Python', 'MLOps'],
    requiredSkills: [

      // ── Core AI / ML ──────────────────────────────────────────────
      { name: 'Machine Learning Fundamentals',            category: 'Core AI / ML', level: 'Expert'       },
      { name: 'Supervised & Unsupervised Learning',       category: 'Core AI / ML', level: 'Expert'       },
      { name: 'Model Evaluation & Metrics',               category: 'Core AI / ML', level: 'Expert'       },
      { name: 'Feature Engineering',                      category: 'Core AI / ML', level: 'Advanced'     },
      { name: 'Hyperparameter Tuning',                    category: 'Core AI / ML', level: 'Advanced'     },
      { name: 'Experiment Tracking (MLflow / W&B)',       category: 'Core AI / ML', level: 'Advanced'     },

      // ── Deep Learning & Neural Networks ───────────────────────────
      { name: 'Neural Networks & Backpropagation',        category: 'Deep Learning & Neural Networks', level: 'Expert'       },
      { name: 'Convolutional Neural Networks (CNN)',       category: 'Deep Learning & Neural Networks', level: 'Advanced'     },
      { name: 'Recurrent Neural Networks / LSTM',         category: 'Deep Learning & Neural Networks', level: 'Intermediate' },
      { name: 'Transformer Architecture',                 category: 'Deep Learning & Neural Networks', level: 'Expert'       },
      { name: 'Attention Mechanisms',                     category: 'Deep Learning & Neural Networks', level: 'Advanced'     },
      { name: 'Transfer Learning & Fine-tuning',          category: 'Deep Learning & Neural Networks', level: 'Advanced'     },

      // ── LLM & Generative AI ───────────────────────────────────────
      { name: 'Prompt Engineering',                       category: 'LLM & Generative AI', level: 'Expert'       },
      { name: 'Retrieval-Augmented Generation (RAG)',     category: 'LLM & Generative AI', level: 'Expert'       },
      { name: 'LLM Fine-tuning (LoRA / QLoRA)',          category: 'LLM & Generative AI', level: 'Advanced'     },
      { name: 'LangChain / LlamaIndex',                  category: 'LLM & Generative AI', level: 'Advanced'     },
      { name: 'OpenAI / Anthropic / Gemini APIs',        category: 'LLM & Generative AI', level: 'Expert'       },
      { name: 'Vector Databases (Pinecone / Weaviate / pgvector)', category: 'LLM & Generative AI', level: 'Advanced' },
      { name: 'Embeddings & Semantic Search',            category: 'LLM & Generative AI', level: 'Advanced'     },
      { name: 'AI Agents & Agentic Workflows',           category: 'LLM & Generative AI', level: 'Advanced'     },

      // ── ML Frameworks & Libraries ─────────────────────────────────
      { name: 'PyTorch',                                  category: 'ML Frameworks & Libraries', level: 'Expert'       },
      { name: 'TensorFlow / Keras',                       category: 'ML Frameworks & Libraries', level: 'Advanced'     },
      { name: 'Hugging Face Transformers',                category: 'ML Frameworks & Libraries', level: 'Expert'       },
      { name: 'Scikit-learn',                             category: 'ML Frameworks & Libraries', level: 'Expert'       },
      { name: 'XGBoost / LightGBM',                      category: 'ML Frameworks & Libraries', level: 'Advanced'     },

      // ── Programming & Data ────────────────────────────────────────
      { name: 'Python (Advanced)',                        category: 'Programming & Data', level: 'Expert'       },
      { name: 'NumPy & Pandas',                           category: 'Programming & Data', level: 'Expert'       },
      { name: 'SQL for ML Data Prep',                     category: 'Programming & Data', level: 'Advanced'     },
      { name: 'Data Wrangling & EDA',                     category: 'Programming & Data', level: 'Advanced'     },
      { name: 'REST API Development (FastAPI / Flask)',   category: 'Programming & Data', level: 'Advanced'     },

      // ── MLOps & Deployment ────────────────────────────────────────
      { name: 'Model Serving (TorchServe / TF Serving)', category: 'MLOps & Deployment', level: 'Advanced'     },
      { name: 'Docker & Containerisation',                category: 'MLOps & Deployment', level: 'Advanced'     },
      { name: 'Kubernetes for ML Workloads',              category: 'MLOps & Deployment', level: 'Intermediate' },
      { name: 'CI/CD for ML Pipelines',                  category: 'MLOps & Deployment', level: 'Advanced'     },
      { name: 'Model Monitoring & Drift Detection',       category: 'MLOps & Deployment', level: 'Advanced'     },
      { name: 'Feature Stores (Feast / Tecton)',          category: 'MLOps & Deployment', level: 'Intermediate' },
      { name: 'Model Registry & Versioning',              category: 'MLOps & Deployment', level: 'Advanced'     },

      // ── Cloud AI Platforms ────────────────────────────────────────
      { name: 'AWS SageMaker',                            category: 'Cloud AI Platforms', level: 'Advanced'     },
      { name: 'Google Vertex AI',                         category: 'Cloud AI Platforms', level: 'Intermediate' },
      { name: 'Azure Machine Learning',                   category: 'Cloud AI Platforms', level: 'Intermediate' },
      { name: 'Cloud Storage & Compute (S3, GCS, ADLS)', category: 'Cloud AI Platforms', level: 'Advanced'     },
      { name: 'GPU Instance Management',                  category: 'Cloud AI Platforms', level: 'Intermediate' },

      // ── Data Engineering for AI ───────────────────────────────────
      { name: 'Data Pipeline Design',                     category: 'Data Engineering for AI', level: 'Advanced'     },
      { name: 'Apache Spark (PySpark)',                   category: 'Data Engineering for AI', level: 'Intermediate' },
      { name: 'Streaming Data (Kafka / Kinesis)',         category: 'Data Engineering for AI', level: 'Intermediate' },
      { name: 'Data Labelling & Annotation Workflows',    category: 'Data Engineering for AI', level: 'Advanced'     },

      // ── AI Safety & Ethics ────────────────────────────────────────
      { name: 'Model Explainability (SHAP / LIME)',       category: 'AI Safety & Ethics', level: 'Advanced'     },
      { name: 'Bias Detection & Fairness',                category: 'AI Safety & Ethics', level: 'Intermediate' },
      { name: 'Responsible AI Principles',                category: 'AI Safety & Ethics', level: 'Intermediate' },
      { name: 'AI Governance & Compliance',               category: 'AI Safety & Ethics', level: 'Intermediate' },

      // ── Certifications ────────────────────────────────────────────
      { name: 'AWS Certified Machine Learning – Specialty', category: 'Certifications', level: 'Advanced'   },
      { name: 'Google Professional ML Engineer',          category: 'Certifications', level: 'Advanced'     },
      { name: 'TensorFlow Developer Certificate',         category: 'Certifications', level: 'Intermediate' },

      // ── Soft Skills ───────────────────────────────────────────────
      { name: 'Research Paper Reading & Implementation',  category: 'Soft Skills', level: 'Advanced'     },
      { name: 'Cross-functional Collaboration',           category: 'Soft Skills', level: 'Advanced'     },
      { name: 'Communicating AI Results to Stakeholders', category: 'Soft Skills', level: 'Advanced'     },
    ]
  },

  // ── ML Engineer ────────────────────────────────────────────────────
  {
    id          : 'tpl_ml_engineer',
    name        : 'ML Engineer',
    type        : 'Job Role',
    icon        : '⚙️',
    description : 'Engineer who builds scalable machine learning systems — from data pipelines and model training to production deployment and monitoring.',
    tags        : ['ML', 'Python', 'MLOps', 'Data Pipelines', 'Statistics'],
    requiredSkills: [

      // ── Mathematics & Statistics ──────────────────────────────────
      { name: 'Linear Algebra',                           category: 'Mathematics & Statistics', level: 'Advanced'     },
      { name: 'Probability & Statistics',                 category: 'Mathematics & Statistics', level: 'Advanced'     },
      { name: 'Calculus & Gradient Descent',              category: 'Mathematics & Statistics', level: 'Advanced'     },
      { name: 'Statistical Inference & Hypothesis Testing', category: 'Mathematics & Statistics', level: 'Advanced'  },
      { name: 'Bayesian Methods',                         category: 'Mathematics & Statistics', level: 'Intermediate' },

      // ── Core ML Algorithms ────────────────────────────────────────
      { name: 'Regression (Linear / Logistic / Ridge)',   category: 'Core ML Algorithms', level: 'Expert'       },
      { name: 'Decision Trees & Ensemble Methods',        category: 'Core ML Algorithms', level: 'Expert'       },
      { name: 'Support Vector Machines',                  category: 'Core ML Algorithms', level: 'Advanced'     },
      { name: 'Clustering (K-Means, DBSCAN, Hierarchical)', category: 'Core ML Algorithms', level: 'Advanced'   },
      { name: 'Dimensionality Reduction (PCA, t-SNE, UMAP)', category: 'Core ML Algorithms', level: 'Advanced'  },
      { name: 'Recommendation Systems',                   category: 'Core ML Algorithms', level: 'Intermediate' },
      { name: 'Anomaly Detection',                        category: 'Core ML Algorithms', level: 'Intermediate' },

      // ── Deep Learning ─────────────────────────────────────────────
      { name: 'Neural Networks & Backpropagation',        category: 'Deep Learning', level: 'Expert'       },
      { name: 'CNNs for Computer Vision',                 category: 'Deep Learning', level: 'Advanced'     },
      { name: 'RNNs / LSTMs / GRUs',                     category: 'Deep Learning', level: 'Advanced'     },
      { name: 'Transformer & Attention Mechanisms',       category: 'Deep Learning', level: 'Advanced'     },
      { name: 'Transfer Learning',                        category: 'Deep Learning', level: 'Advanced'     },
      { name: 'GANs & Diffusion Models',                  category: 'Deep Learning', level: 'Intermediate' },

      // ── ML Frameworks & Libraries ─────────────────────────────────
      { name: 'Scikit-learn',                             category: 'ML Frameworks & Libraries', level: 'Expert'       },
      { name: 'PyTorch',                                  category: 'ML Frameworks & Libraries', level: 'Expert'       },
      { name: 'TensorFlow / Keras',                       category: 'ML Frameworks & Libraries', level: 'Advanced'     },
      { name: 'XGBoost / LightGBM / CatBoost',           category: 'ML Frameworks & Libraries', level: 'Expert'       },
      { name: 'Hugging Face Transformers',                category: 'ML Frameworks & Libraries', level: 'Advanced'     },
      { name: 'Optuna / Ray Tune (HPO)',                  category: 'ML Frameworks & Libraries', level: 'Intermediate' },

      // ── Programming & Data ────────────────────────────────────────
      { name: 'Python (Advanced)',                        category: 'Programming & Data', level: 'Expert'       },
      { name: 'NumPy, Pandas, Polars',                    category: 'Programming & Data', level: 'Expert'       },
      { name: 'SQL (Advanced)',                           category: 'Programming & Data', level: 'Advanced'     },
      { name: 'Exploratory Data Analysis (EDA)',          category: 'Programming & Data', level: 'Expert'       },
      { name: 'Data Visualisation (Matplotlib, Seaborn, Plotly)', category: 'Programming & Data', level: 'Advanced' },
      { name: 'REST API Development (FastAPI / Flask)',   category: 'Programming & Data', level: 'Advanced'     },

      // ── MLOps & Production ────────────────────────────────────────
      { name: 'MLflow (Experiment Tracking & Registry)', category: 'MLOps & Production', level: 'Advanced'     },
      { name: 'Weights & Biases (W&B)',                  category: 'MLOps & Production', level: 'Intermediate' },
      { name: 'Model Versioning & Registry',              category: 'MLOps & Production', level: 'Advanced'     },
      { name: 'Model Serving & Inference Optimisation',  category: 'MLOps & Production', level: 'Advanced'     },
      { name: 'A/B Testing for ML Models',               category: 'MLOps & Production', level: 'Advanced'     },
      { name: 'Model Monitoring & Data Drift Detection', category: 'MLOps & Production', level: 'Advanced'     },
      { name: 'Continuous Training Pipelines',           category: 'MLOps & Production', level: 'Advanced'     },
      { name: 'Feature Stores',                          category: 'MLOps & Production', level: 'Intermediate' },

      // ── Data Engineering for ML ───────────────────────────────────
      { name: 'Data Pipeline Design (Airflow / Prefect)', category: 'Data Engineering for ML', level: 'Advanced'     },
      { name: 'Apache Spark / PySpark',                  category: 'Data Engineering for ML', level: 'Advanced'     },
      { name: 'Data Versioning (DVC)',                    category: 'Data Engineering for ML', level: 'Intermediate' },
      { name: 'Data Labelling & Annotation',              category: 'Data Engineering for ML', level: 'Intermediate' },
      { name: 'Handling Imbalanced Datasets',             category: 'Data Engineering for ML', level: 'Advanced'     },

      // ── Infrastructure & DevOps ───────────────────────────────────
      { name: 'Docker & Containerisation',                category: 'Infrastructure & DevOps', level: 'Advanced'     },
      { name: 'Kubernetes',                               category: 'Infrastructure & DevOps', level: 'Intermediate' },
      { name: 'Git & Version Control',                    category: 'Infrastructure & DevOps', level: 'Expert'       },
      { name: 'CI/CD for ML (GitHub Actions / GitLab)',  category: 'Infrastructure & DevOps', level: 'Advanced'     },
      { name: 'GPU / Distributed Training',               category: 'Infrastructure & DevOps', level: 'Intermediate' },

      // ── Cloud Platforms ───────────────────────────────────────────
      { name: 'AWS SageMaker',                            category: 'Cloud Platforms', level: 'Advanced'     },
      { name: 'Google Vertex AI',                         category: 'Cloud Platforms', level: 'Intermediate' },
      { name: 'Azure Machine Learning',                   category: 'Cloud Platforms', level: 'Intermediate' },

      // ── Model Evaluation & Ethics ─────────────────────────────────
      { name: 'Cross-validation & Model Selection',       category: 'Model Evaluation & Ethics', level: 'Expert'       },
      { name: 'Model Explainability (SHAP, LIME)',        category: 'Model Evaluation & Ethics', level: 'Advanced'     },
      { name: 'Bias, Fairness & Responsible ML',          category: 'Model Evaluation & Ethics', level: 'Intermediate' },

      // ── Certifications ────────────────────────────────────────────
      { name: 'AWS Certified ML – Specialty',             category: 'Certifications', level: 'Advanced'     },
      { name: 'Google Professional ML Engineer',          category: 'Certifications', level: 'Advanced'     },

      // ── Soft Skills ───────────────────────────────────────────────
      { name: 'Research Paper Reading & Implementation',  category: 'Soft Skills', level: 'Advanced'     },
      { name: 'Communicating Results to Non-technical Stakeholders', category: 'Soft Skills', level: 'Advanced' },
    ]
  },

  // ── Add more common goals here ──────────────────────────────────────

];
