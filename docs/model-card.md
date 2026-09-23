# Model Card: MindCare Classifiers

## Model Details
* **Developed by**: MindCare Research Team
* **Model Type**: Supervised NLP Text Classification Pipelines & Statistical Guardrails
* **Framework**: scikit-learn & NumPy
* **Serving Runtime**: FastAPI on Python 3.10+ (via `ml-service/`)
* **Artifact Reference**: Documented in [`ml-service/models/README.md`](../ml-service/models/README.md)
* **Training Pipelines**: Documented in [`research/training/README.md`](../research/training/README.md)

---

## Intended Use
* **Primary Intended Uses**:
  * Provide real-time emotional context awareness for generative therapeutic dialogues.
  * Provide early screening signals for crisis, self-harm, and violence to trigger deterministic safety interventions.
* **Out-of-Scope Uses**:
  * Clinical diagnosis of psychiatric conditions (depression, bipolar disorder, anxiety disorders).
  * Automated medical decision-making or therapy replacement.

---

## Architecture Specifications

### 1. Emotion Classifier
* **Vectorizer**: `TfidfVectorizer` (sublinear TF-IDF, `ngram_range=(1,2)`, `max_features=20000`, `min_df=2`)
* **Classifier**: `LinearSVC` with balanced class weights (`emotion_model.pkl`)
* **Target Classes (6)**: `Angry`, `Anxious`, `Calm`, `Hopeful`, `Neutral`, `Sad`
* **Confidence Method**: Calibrated decision confidence using temperature-scaled softmax over decision boundary margins:
  $$P(y_i \mid \mathbf{x}) = \frac{\exp(d_i(\mathbf{x}) / T)}{\sum_j \exp(d_j(\mathbf{x}) / T)}$$
* **Decision Threshold**: `CONFIDENCE_THRESHOLD = 25.0%` (1.5× random 6-class baseline of 16.7%), preventing low-confidence hallucinations while capturing authentic user disclosures.

### 2. Mental Health Risk Classifier
* **Vectorizer**: `TfidfVectorizer` (sublinear TF-IDF, `ngram_range=(1,2)`, `max_features=20000`, `min_df=2`)
* **Classifier**: `LogisticRegression` (`C=1.0`, `max_iter=1000`, `class_weight='balanced'`)
* **Target Classes (7)**: `Normal`, `Depression`, `Suicidal`, `Anxiety`, `Bipolar`, `Stress`, `Personality disorder`
* **Training Dataset**: `research/datasets/raw/Combined_Data.csv` (51,017 cleaned records)

### 3. Statistical Out-Of-Domain (OOD) Gate
* **Artifact**: `ml-service/models/affective_centroid.npy` (20,000-dimensional L2-normalized float64 array)
* **Method**: Computes cosine similarity (dot product) between input TF-IDF vector $\mathbf{x}$ and the normalized centroid of 53,000+ affective training utterances:
  $$\text{Relevance}(\mathbf{x}) = \frac{\mathbf{x} \cdot \mathbf{c}_{\text{norm}}}{\|\mathbf{x}\|_2}$$
* **Threshold**: Inputs with relevance $< 0.020$ lacking explicit emotional disclosure terms are gated as `"uncertain"` / `"Unknown"`, filtering isolated non-affective nouns (e.g. `"laptop"`, `"table"`, `"microchip"`).

### 4. Deterministic Crisis Safety Net
* **Artifact**: `ml-service/models/crisis_keywords.json` (40 clinical & safety regex terms)
* **Harm-Type Branching**:
  * **Self-Harm**: Bypasses generative LLM and returns immediate intervention with the **988 Suicide & Crisis Lifeline** banner.
  * **Harm-to-Others**: Bypasses generative LLM and returns firm, grounded de-escalation boundaries.
* **Affective Polarity Suppression**: Prevents contradictory predictions by overriding positive labels (`"Hopeful"`, `"Joy"`, `"Happy"`) to `"Sad"` if self-harm or threat keywords are detected.

---

## Known Limitations & Guardrails
* **Out-of-Vocabulary & Gibberish**: Low-entropy, repetitive, or empty inputs (e.g. `"ssssss"`) are intercepted by the preprocessor before model inference.
* **Class Imbalance**: Minority classes (such as `Personality disorder` at 1.8% of the training data) exhibit lower precision than majority classes (`Normal` at 31.4%, `Depression` at 29.6%).
* **Contextual Nuance**: Bag-of-words / n-gram TF-IDF representations cannot fully capture complex multi-clause negations or subtle sarcasm.
* **Assistive Boundary**: All classifications represent statistical language indications rather than clinical assessments.
