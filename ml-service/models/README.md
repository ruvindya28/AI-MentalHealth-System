# MindCare Model Artifacts & Training Lineage

This directory maintains the 6 active inference artifacts used by the MindCare ML service:
* **4 `.pkl` files**: Pre-trained vectorizers and classifiers for mental health risk and emotion recognition.
* **1 `.npy` file**: The normalized geometric centroid vector of the affective training distribution.
* **1 `.json` file**: The deterministic clinical crisis and de-escalation keyword taxonomy.

---

## Model Artifacts Mapping Table

| File | Type | Algorithm / Method | Dataset Source | Corresponding Notebook / Script |
| :--- | :--- | :--- | :--- | :--- |
| **`mh_vectorizer.pkl`** | `.pkl` | Sublinear `TfidfVectorizer` (1–2 n-grams, max 20,000 features) | `Combined_Data.csv` (51,017 posts) | [`01_mental_health_risk_training.ipynb`](../../research/notebooks/01_mental_health_risk_training.ipynb) <br> *(or `train_mental_health.py`)* |
| **`mh_model.pkl`** | `.pkl` | `LogisticRegression(max_iter=1000, class_weight='balanced')` | `Combined_Data.csv` (7 risk classes) | [`01_mental_health_risk_training.ipynb`](../../research/notebooks/01_mental_health_risk_training.ipynb) <br> *(or `train_mental_health.py`)* |
| **`emotion_vectorizer.pkl`** | `.pkl` | Sublinear `TfidfVectorizer` (1–2 n-grams, max 20,000 features) | 6-class emotion corpus (53k+ sentences) | [`02_emotion_classification_training.ipynb`](../../research/notebooks/02_emotion_classification_training.ipynb) <br> *(or `train_emotion.py`)* |
| **`emotion_model.pkl`** | `.pkl` | `LinearSVC(class_weight='balanced')` with temperature-scaled softmax | 6 emotion classes (`Angry`, `Anxious`, `Calm`, `Hopeful`, `Neutral`, `Sad`) | [`02_emotion_classification_training.ipynb`](../../research/notebooks/02_emotion_classification_training.ipynb) <br> *(or `train_emotion.py`)* |
| **`affective_centroid.npy`** | `.npy` | **Statistical Mean Centroid** (L2-normalized 20,000-D mean vector) | 53,000+ affective training utterances | [`02_emotion_classification_training.ipynb`](../../research/notebooks/02_emotion_classification_training.ipynb) & `app/ood.py` |
| **`crisis_keywords.json`** | `.json` | **Deterministic Clinical Safety Taxonomy** (regex phrases) | Expert clinical crisis & de-escalation terms (40 phrases) | [`03_crisis_detection_rules.ipynb`](../../research/notebooks/03_crisis_detection_rules.ipynb) <br> *(or `original_cleaning.ipynb` Cell 24)* |

---

## How Each Component Was Trained / Computed

### 1. Mental Health Pipeline (`mh_vectorizer.pkl` & `mh_model.pkl`)
* **How it trains**:
  1. Loads 51,017 records from `research/datasets/raw/Combined_Data.csv`.
  2. Runs text cleaning (lowercasing, URL removal, punctuation cleaning).
  3. Computes TF-IDF matrices across 7 categories: `Normal`, `Depression`, `Suicidal`, `Anxiety`, `Bipolar`, `Stress`, `Personality disorder`.
  4. Trains `LogisticRegression` with balanced class weights.
  5. Serializes to `mh_vectorizer.pkl` (772 KB) and `mh_model.pkl` (1.1 MB).
* **Notebook**: Covered step-by-step in [`research/notebooks/01_mental_health_risk_training.ipynb`](../../research/notebooks/01_mental_health_risk_training.ipynb) and [`research/training/train_mental_health.py`](../../research/training/train_mental_health.py).

---

### 2. Emotion Pipeline (`emotion_vectorizer.pkl` & `emotion_model.pkl`)
* **How it trains**:
  1. Fits sublinear TF-IDF features on the 6 emotional categories.
  2. Trains a `LinearSVC` with balanced weighting to find the maximum-margin hyperplanes separating emotions.
  3. Serializes to `emotion_vectorizer.pkl` (766 KB) and `emotion_model.pkl` (960 KB).
  4. At runtime, decision scores are calibrated into probabilities via temperature softmax.
* **Notebook**: Covered in [`research/notebooks/02_emotion_classification_training.ipynb`](../../research/notebooks/02_emotion_classification_training.ipynb) and [`research/training/train_emotion.py`](../../research/training/train_emotion.py).

---

### 3. Statistical Centroid (`affective_centroid.npy`)
* **How it is computed**:
  1. All 53,000+ affective training sentences are transformed through `emotion_vectorizer`.
  2. The mathematical average vector (the "geometric center" of emotional human language) is computed:
     $$\mathbf{c} = \frac{1}{N}\sum_{i=1}^N \mathbf{v}_i, \quad \mathbf{c}_{\text{norm}} = \frac{\mathbf{c}}{\|\mathbf{c}\|_2}$$
  3. Saved as a 20,000-dimensional float64 array (`affective_centroid.npy`, 160 KB).
* **Runtime use**: In `app/ood.py`, it computes the cosine similarity $\mathbf{x} \cdot \mathbf{c}_{\text{norm}}$ of user input. If similarity $< 0.020$, it gates out non-emotional words (`"table"`, `"microchip"`).

---

### 4. Safety Guardrails (`crisis_keywords.json`)
* **How it is created**:
  1. Curated list of high-risk self-harm phrases (`"want to die"`, `"kill myself"`) and violence phrases (`"kill someone"`, `"shoot someone"`).
  2. Dumped as JSON array (`crisis_keywords.json`, 763 bytes).
  3. Used by `app/crisis.py` to trigger immediate emergency safety routing.
* **Notebook**: Covered in [`research/notebooks/03_crisis_detection_rules.ipynb`](../../research/notebooks/03_crisis_detection_rules.ipynb).
