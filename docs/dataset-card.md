# Dataset Card: Mental Health and Emotion Data

## Datasets Overview

| Dataset | Raw File Path | Records | Features | Target Task | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mental Health Status** | `research/datasets/raw/Combined_Data.csv` | 51,017 | `statement` $\rightarrow$ `text`<br>`status` $\rightarrow$ `label` | 7-Class Mental Health Risk Categorization | **Active Training Corpus** |
| **Historical Emotion Benchmark** | `research/datasets/raw/Emotion_classify_Data.csv` | 5,934 | `Comment` $\rightarrow$ `text`<br>`Emotion` $\rightarrow$ `label` | 3-Class Emotion Classification (`anger`, `joy`, `fear`) | **Archived Exploration Benchmark** |
| **Production Emotion Corpus** | External 6-Class Corpus | 53,000+ | `text`, `label` | 6-Class Emotion Recognition (`Angry`, `Anxious`, `Calm`, `Hopeful`, `Neutral`, `Sad`) | **Active Production Lineage** |

---

## 1. Mental Health Status Dataset Details

* **File**: `research/datasets/raw/Combined_Data.csv`
* **Total Instances**: 51,017 cleaned records (deduplicated, non-empty)
* **Target Classes & Distribution**:
  * `Normal`: 16,003 instances (31.4%)
  * `Depression`: 15,085 instances (29.6%)
  * `Suicidal`: 10,638 instances (20.9%)
  * `Anxiety`: 3,608 instances (7.1%)
  * `Bipolar`: 2,501 instances (4.9%)
  * `Stress`: 2,288 instances (4.5%)
  * `Personality disorder`: 894 instances (1.8%)
* **Target Model**: Trains the balanced multiclass Logistic Regression classifier (`mh_model.pkl`) and sublinear TF-IDF vectorizer (`mh_vectorizer.pkl`).

---

## 2. Emotion Datasets & Lineage Reconciliation

### A. Historical 3-Class Benchmark (Archive)
* **Raw File**: `research/datasets/raw/Emotion_classify_Data.csv`
* **Processed Files**: `research/datasets/processed/emotion_train.csv`, `emotion_test.csv`
* **Classes**: `anger` (2,000), `joy` (2,000), `fear` (1,934) — Total 5,934 records.
* **Context**: Used in preliminary exploratory research notebooks (`original_cleaning.ipynb`). It does not contain `Sad`, `Anxious`, `Calm`, `Hopeful`, or `Neutral`.

### B. Production 6-Class Emotion Corpus
* **Active Production Model**: `ml-service/models/emotion_model.pkl` (960 KB)
* **Target Categories**: `Angry`, `Anxious`, `Calm`, `Hopeful`, `Neutral`, `Sad`
* **Centroid Modeling**: The 53,000+ training utterances were also utilized to compute the 20,000-D normalized geometric mean vector (`ml-service/models/affective_centroid.npy`) for out-of-domain input detection.
* **Reproducibility Pipeline**: Standalone framework provided in [`research/training/train_emotion.py`](../research/training/train_emotion.py) and [`research/notebooks/02_emotion_classification_training.ipynb`](../research/notebooks/02_emotion_classification_training.ipynb).

---

## 3. Data Preprocessing Pipeline

1. **Lowercasing**: Text transformed to lower case to eliminate casing variance.
2. **URL Removal**: Strips hyperlinks and URLs using `http\S+|www\S+`.
3. **Punctuation Filtering**: Preserves sentiment-bearing punctuation (`!?.,'`) while stripping non-informative special characters.
4. **Whitespace Normalization**: Collapses repeated tabs and spaces into single spaces.
5. **Deduplication**: Drops redundant posts to prevent test-set leakage.
6. **Minimum Length Filter**: Excludes empty strings and single-character artifacts.

---

## 4. Partitioning & Splitting Methodology

* **Partition Strategy**: Stratified 80/20 train/test split preserving relative class proportions across both majority and minority categories.
* **Processed Datasets**:
  * `research/datasets/processed/mh_train.csv` (80% — 40,813 records)
  * `research/datasets/processed/mh_test.csv` (20% — 10,204 records)
  * `research/datasets/processed/emotion_train.csv` (80% — 4,747 records)
  * `research/datasets/processed/emotion_test.csv` (20% — 1,187 records)

---

## 5. Ethical, Privacy & Clinical Boundary Considerations

* **Anonymization**: All datasets comprise public online forum and social media discussions where user handles, IPs, and identifiable markers were removed.
* **No Diagnostic Authority**: Classifications represent statistical language pattern indications rather than psychiatric clinical diagnoses.
* **Clinical Safety Net**: Because machine learning models are probabilistic, the system pairs these datasets with a hard deterministic safety net (`crisis_keywords.json`) for immediate crisis routing.
