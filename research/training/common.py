import re
import json
from pathlib import Path
from typing import Dict, Any
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score


def clean_text(text: str) -> str:
    """Standardizes input text matching the training pipeline preprocessing."""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-z0-9\s!?.,']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def evaluate_classifier(
    y_true,
    y_pred,
    labels: list,
    output_dir: Path,
    model_name: str
) -> Dict[str, Any]:
    """Generates and saves research evaluation metrics and confusion matrix."""
    output_dir.mkdir(parents=True, exist_ok=True)

    report_dict = classification_report(y_true, y_pred, labels=labels, output_dict=True)
    report_text = classification_report(y_true, y_pred, labels=labels)
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    acc = float(accuracy_score(y_true, y_pred))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro"))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted"))

    metrics = {
        "model_name": model_name,
        "accuracy": acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "labels": labels,
        "confusion_matrix": cm,
        "classification_report": report_dict,
    }

    # Save to disk
    with open(output_dir / f"{model_name}_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    with open(output_dir / f"{model_name}_report.txt", "w", encoding="utf-8") as f:
        f.write(report_text)

    return metrics
