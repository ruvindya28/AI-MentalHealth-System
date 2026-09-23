"""Reproducible Training Pipeline: Emotion Classifier (6 Classes)

Target: 6 Emotional Categories:
  - Angry, Anxious, Calm, Hopeful, Neutral, Sad

This script provides the training and evaluation framework for the 6-class emotion model.
"""
import pickle
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression

from common import clean_text, evaluate_classifier

BASE_DIR = Path(__file__).resolve().parent.parent
EVAL_DIR = BASE_DIR / "evaluation" / "emotion"


def train_emotion_models(df: pd.DataFrame):
    """Trains and compares LinearSVC, Calibrated LinearSVC, and Logistic Regression on emotion text."""
    print("Preprocessing emotion text...")
    df["text"] = df["text"].apply(clean_text)
    df = df.drop_duplicates(subset=["text"])
    df = df[df["text"].str.len() > 0]

    print(f"Dataset size: {len(df)} records.")
    print("Class distribution:")
    print(df["label"].value_counts())

    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["label"]
    )

    vectorizer = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True,
    )
    X_train = vectorizer.fit_transform(train_df["text"])
    X_test = vectorizer.transform(test_df["text"])
    y_train = train_df["label"]
    y_test = test_df["label"]
    labels = sorted(y_train.unique().tolist())

    # Model A: LinearSVC (uncalibrated)
    print("Training LinearSVC...")
    svc = LinearSVC(class_weight="balanced", random_state=42)
    svc.fit(X_train, y_train)
    y_pred_svc = svc.predict(X_test)
    evaluate_classifier(y_test, y_pred_svc, labels, EVAL_DIR, "emotion_linear_svc")

    # Model B: Calibrated LinearSVC (Platt scaling)
    print("Training CalibratedClassifierCV(LinearSVC)...")
    calibrated_svc = CalibratedClassifierCV(svc, cv=5)
    calibrated_svc.fit(X_train, y_train)
    y_pred_cal = calibrated_svc.predict(X_test)
    evaluate_classifier(y_test, y_pred_cal, labels, EVAL_DIR, "emotion_calibrated_svc")

    # Model C: Logistic Regression
    print("Training LogisticRegression...")
    logreg = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    logreg.fit(X_train, y_train)
    y_pred_lr = logreg.predict(X_test)
    evaluate_classifier(y_test, y_pred_lr, labels, EVAL_DIR, "emotion_logistic_regression")

    print(f"Evaluation reports written to {EVAL_DIR}")


if __name__ == "__main__":
    print("Run train_emotion_models(df) with a verified 6-class dataset.")
