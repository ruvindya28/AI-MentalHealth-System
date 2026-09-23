"""Reproducible Training Pipeline: Mental Health Risk Classifier (7 Classes)

Datasets: research/datasets/raw/Combined_Data.csv
Target: 7 Mental Health Risk Categories:
  - Normal, Depression, Suicidal, Anxiety, Bipolar, Stress, Personality disorder
"""
import pickle
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from common import clean_text, evaluate_classifier

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "datasets" / "raw" / "Combined_Data.csv"
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
EVAL_DIR = BASE_DIR / "evaluation" / "mental-health"


def run_pipeline():
    print(f"Loading raw dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    df = df.rename(columns={"statement": "text", "status": "label"})
    df = df[["text", "label"]].dropna(subset=["text", "label"])

    print("Preprocessing text...")
    df["text"] = df["text"].apply(clean_text)
    df = df.drop_duplicates(subset=["text"])
    df = df[df["text"].str.len() > 0]

    print(f"Cleaned dataset: {len(df)} records.")
    print("Class distribution:")
    print(df["label"].value_counts())

    print("Performing stratified 80/20 train/test split...")
    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["label"]
    )

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_csv(PROCESSED_DIR / "mh_train.csv", index=False)
    test_df.to_csv(PROCESSED_DIR / "mh_test.csv", index=False)

    print("Fitting TF-IDF Vectorizer...")
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

    print("Training Logistic Regression (class_weight='balanced', C=1.0)...")
    model = LogisticRegression(max_iter=1000, class_weight="balanced", C=1.0, random_state=42)
    model.fit(X_train, y_train)

    print("Evaluating model on held-out test split...")
    y_pred = model.predict(X_test)
    labels = sorted(y_train.unique().tolist())
    metrics = evaluate_classifier(y_test, y_pred, labels, EVAL_DIR, "mh_logistic_regression")

    print(f"Test Accuracy: {metrics['accuracy']:.4f}")
    print(f"Macro F1-Score: {metrics['macro_f1']:.4f}")
    suicidal_metrics = metrics["classification_report"].get("Suicidal", {})
    print(f"Suicidal Recall: {suicidal_metrics.get('recall', 0.0):.4f}")

    # Serialize artifacts
    output_model_dir = BASE_DIR.parent / "ml-service" / "models"
    output_model_dir.mkdir(parents=True, exist_ok=True)

    with open(output_model_dir / "mh_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(output_model_dir / "mh_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"Successfully saved artifacts to {output_model_dir}")


if __name__ == "__main__":
    run_pipeline()
