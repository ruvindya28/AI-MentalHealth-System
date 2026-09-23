# MindCare Research Directory

This directory contains research datasets, exploratory notebooks, training pipelines, and evaluation metrics for the MindCare emotional intelligence and crisis-risk classification system.

---

## Directory Structure

* **[`datasets/`](datasets/README.md)**
  * `raw/`: Source datasets ([`Combined_Data.csv`](datasets/raw/Combined_Data.csv), [`Emotion_classify_Data.csv`](datasets/raw/Emotion_classify_Data.csv)).
  * `processed/`: Stratified 80/20 train/test splits (`mh_train.csv`, `mh_test.csv`, `emotion_train.csv`, `emotion_test.csv`).
  * Detailed class distributions and schemas documented in [`datasets/README.md`](datasets/README.md).

* **`notebooks/`**
  * `01_mental_health_risk_training.ipynb`: Dedicated notebook for 7-class mental health risk classifier (EDA, TF-IDF, Logistic Regression vs LinearSVC, GridSearchCV, evaluation).
  * `02_emotion_classification_training.ipynb`: Dedicated notebook for 6-class emotion classifier (EDA, TF-IDF, LinearSVC, CalibratedClassifierCV, temperature softmax calibration).
  * `03_crisis_detection_rules.ipynb`: Dedicated notebook for deterministic crisis detection, harm-type distinction (self-harm vs violence), and affective polarity suppression.
  * `original_cleaning.ipynb`: Preserved historical notebook documenting preliminary exploratory data cleaning.

* **[`training/`](training/README.md)**
  * `common.py`: Shared text preprocessing (`clean_text`) and evaluation utilities (`evaluate_classifier`).
  * `train_mental_health.py`: Reproducible pipeline for the 7-class mental health risk classifier.
  * `train_emotion.py`: Model comparison framework (LinearSVC, CalibratedClassifierCV, LogisticRegression) for 6 emotion classes.
  * Execution instructions documented in [`training/README.md`](training/README.md).

* **`evaluation/`**
  * `mental-health/`: Precision, recall, F1 metrics, and classification reports for mental health risk screening (`mh_logistic_regression_metrics.json`, `mh_logistic_regression_report.txt`).
  * `emotion/`: Output destination for emotion model comparison evaluations.

---

## Quick Start: Running the Training Pipeline

Using the project virtual environment from the repository root:

* **macOS & Linux**:
  ```bash
  ./ml-service/.venv/bin/python research/training/train_mental_health.py
  ```
* **Windows**:
  ```cmd
  ml-service\.venv\Scripts\python.exe research\training\train_mental_health.py
  ```
