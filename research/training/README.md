# Training & Model Reproducibility

This directory contains standalone, reproducible training pipelines for MindCare's machine learning classification models.

---

## Prerequisites & Environment

These scripts require Python with dependencies from `ml-service/requirements.txt` installed (`scikit-learn`, `pandas`, `numpy`).

To run them using the project virtual environment from the repository root:

* **macOS & Linux**:
  ```bash
  ./ml-service/.venv/bin/python research/training/train_mental_health.py
  ```
* **Windows (Command Prompt `cmd.exe`)**:
  ```cmd
  ml-service\.venv\Scripts\python.exe research\training\train_mental_health.py
  ```
* **Windows (PowerShell)**:
  ```powershell
  & .\ml-service\.venv\Scripts\python.exe research\training\train_mental_health.py
  ```

---

## 1. Mental Health Risk Classification Pipeline (`train_mental_health.py`)

* **Dataset**: `research/datasets/raw/Combined_Data.csv` (51,017 cleaned records).
* **Task**: Multiclass classification across 7 risk categories:
  `Normal`, `Depression`, `Suicidal`, `Anxiety`, `Bipolar`, `Stress`, `Personality disorder`.
* **Method**: Sublinear TF-IDF (1-2 grams, max 20,000 features) + Logistic Regression with balanced class weighting (`class_weight='balanced'`, `C=1.0`).
* **Workflow**:
  1. Loads and deduplicates raw text statements.
  2. Generates stratified 80/20 train/test splits saved into `research/datasets/processed/`.
  3. Fits the TF-IDF vectorizer and trains the logistic regression classifier.
  4. Evaluates performance against test data (precision, recall, F1, macro/weighted averages).
* **Generated Outputs**:
  * **Serialized Models**: `ml-service/models/mh_model.pkl`, `ml-service/models/mh_vectorizer.pkl`.
  * **Evaluation Metrics**: `research/evaluation/mental-health/mh_logistic_regression_metrics.json`.
  * **Classification Report**: `research/evaluation/mental-health/mh_logistic_regression_report.txt`.

---

## 2. Emotion Classification Pipeline (`train_emotion.py`)

* **Task**: Multiclass classification across 6 emotional categories:
  `Angry`, `Anxious`, `Calm`, `Hopeful`, `Neutral`, `Sad`.
* **Model Comparison Framework**:
  Trains and compares three classifier variations on emotion text data:
  1. `LinearSVC` (uncalibrated margins)
  2. `CalibratedClassifierCV(LinearSVC)` (Platt scaling via 5-fold cross validation)
  3. `LogisticRegression` (`class_weight='balanced'`)
* **Evaluation Destination**:
  Outputs classification reports and evaluation metrics to `research/evaluation/emotion/`.
* **Active Production Artifact**:
  The production model and vectorizer at `ml-service/models/emotion_model.pkl` and `ml-service/models/emotion_vectorizer.pkl` serve the 6 emotion classes in the live application.
