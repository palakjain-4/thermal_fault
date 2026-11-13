import json
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
from ml.config import CLASSES, MODEL_METADATA_PATH

def evaluate_predictions(
    y_true: List[int],
    y_pred: List[int],
    class_names: List[str] = CLASSES
) -> Dict[str, Any]:
    """
    Calculate comprehensive evaluation metrics:
    - Overall accuracy
    - Precision, Recall, F1 (macro and weighted)
    - Per-class breakdown
    - Confusion matrix
    """
    accuracy = float(accuracy_score(y_true, y_pred))
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    precision_weighted, recall_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names)))).tolist()

    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        output_dict=True,
        zero_division=0
    )

    per_class = {}
    for cls in class_names:
        if cls in report_dict:
            per_class[cls] = {
                "precision": round(report_dict[cls]["precision"], 4),
                "recall": round(report_dict[cls]["recall"], 4),
                "f1_score": round(report_dict[cls]["f1-score"], 4),
                "support": int(report_dict[cls]["support"]),
            }

    metrics = {
        "accuracy": round(accuracy, 4),
        "macro_precision": round(float(precision_macro), 4),
        "macro_recall": round(float(recall_macro), 4),
        "macro_f1": round(float(f1_macro), 4),
        "weighted_f1": round(float(f1_weighted), 4),
        "per_class": per_class,
        "confusion_matrix": cm,
        "class_names": class_names,
        "total_test_samples": len(y_true),
    }

    return metrics


def save_model_metadata(metadata: Dict[str, Any], path: Path = MODEL_METADATA_PATH):
    """Save model evaluation metrics, configuration, and labels to disk."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(metadata, f, indent=2)


def load_model_metadata(path: Path = MODEL_METADATA_PATH) -> Dict[str, Any]:
    """Load model evaluation metrics and info from disk if present."""
    if not path.exists():
        return {
            "modelName": "ResNet18-ThermalTransfer",
            "version": "v1.2.0-demo",
            "isTrainedWeightsAvailable": False,
            "isDemoMode": True,
            "architecture": "ResNet18 (PyTorch)",
            "device": "cpu",
            "supportedClasses": CLASSES,
            "datasetInfo": {
                "status": "Untrained / Demo Mode",
                "notice": "No trained weights found in ml/weights. Train via ml/train.py to calibrate real metrics."
            },
            "evaluationMetrics": {
                "status": "No trained model weights evaluated yet.",
                "accuracy": None,
                "macro_f1": None
            },
            "limitations": [
                "Requires radiometric sensor calibration for absolute temperature values in degrees Celsius.",
                "Ambient solar radiation or reflective surfaces can produce false-positive thermal gradients.",
                "Inspection angles greater than 60 degrees can reduce apparent thermal contrast.",
                "Ensure high resolution thermal cameras (>=320x240) for fine-pitch terminal inspections."
            ]
        }
    with open(path, "r") as f:
        return json.load(f)
