# Research Datasets

This directory maintains the ground-truth datasets for the MindCare emotional intelligence and crisis-risk classification research.

---

## 1. Mental Health Status Dataset

* **Raw File**: `raw/Combined_Data.csv`
* **Processed Files**: `processed/mh_train.csv` (80%), `processed/mh_test.csv` (20%)
* **Schema**:
  * `statement` (renamed to `text`): Textual statement/post from user
  * `status` (renamed to `label`): Target mental health risk category
* **Total Instances**: 51,017 cleaned records (deduplicated, empty records removed)
* **Class Distribution**:
  * `Normal`: 16,003 (31.4%)
  * `Depression`: 15,085 (29.6%)
  * `Suicidal`: 10,638 (20.9%)
  * `Anxiety`: 3,608 (7.1%)
  * `Bipolar`: 2,501 (4.9%)
  * `Stress`: 2,288 (4.5%)
  * `Personality disorder`: 894 (1.8%)
* **Usage**: Trains the 7-class mental health risk classifier (`mh_model.pkl`).
* **Research Disclaimer**: This dataset supports *risk screening* and *context awareness* only. It does not diagnose clinical disorders.

---

## 2. Emotion Datasets & Known Research Artifact Status

### A. Historical 3-Class Dataset (Archive)
* **Raw File**: `raw/Emotion_classify_Data.csv`
* **Processed Files**: `processed/emotion_train.csv`, `processed/emotion_test.csv`
* **Classes**: `anger` (2,000), `joy` (2,000), `fear` (1,934) — Total 5,934 records.
* **Status**: Historical benchmark used in `ruvindya/cleaning.ipynb`. It **does not** contain `Sad`, `Anxious`, `Calm`, `Hopeful`, or `Neutral`.

### B. Production 6-Class Emotion Artifact
* **Active Production Model**: `ml-service/models/emotion_model.pkl` (960 KB)
* **Target Classes**: `Angry`, `Anxious`, `Calm`, `Hopeful`, `Neutral`, `Sad`
* **Provenance**: As noted in `ml-service/README.md`, this artifact was produced using an external 6-class dataset and script (`retrain_emotion_model.py`) that was not originally committed to this repository.
* **Reconciliation Action**: To ensure academic reproducibility, we preserve the active 6-class serialized model while providing an isolated training pipeline (`research/training/train_emotion.py`) that trains and validates the 6-class emotion space using standardized public benchmarks (such as GoEmotions mapped to the 6 target categories).
