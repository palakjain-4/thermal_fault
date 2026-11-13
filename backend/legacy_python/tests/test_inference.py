import pytest
import numpy as np
import cv2
from pathlib import Path
from ml.inference import ThermalInferenceEngine

@pytest.fixture
def test_engine():
    return ThermalInferenceEngine(device="cpu")

@pytest.fixture
def sample_image_bytes():
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (180, 180), (200, 100, 50), -1)
    cv2.circle(img, (100, 100), 20, (255, 255, 255), -1)
    _, buf = cv2.imencode('.png', img)
    return buf.tobytes()

def test_inference_execution(test_engine, sample_image_bytes, tmp_path):
    out_annotated = tmp_path / "annotated_out.png"
    result = test_engine.run_inference(
        file_bytes=sample_image_bytes,
        filename="test_scan.png",
        annotated_save_path=out_annotated
    )

    assert result is not None
    assert "predictedCondition" in result
    assert result["predictedCondition"] in ["Normal", "Fault Detected"]
    assert "faultType" in result
    assert "confidence" in result
    assert 0.0 <= result["confidence"] <= 1.0
    assert "inferenceTimeMs" in result
    assert out_annotated.exists()

def test_severity_estimation_rules(test_engine):
    # Test High Severity
    mock_hotspot_high = {"relative_contrast": 1.5, "area_ratio_percent": 16.0}
    sev, expl = test_engine.estimate_severity("Overheating", mock_hotspot_high, 0.85)
    assert sev == "High"
    assert "High-severity" in expl

    # Test Medium Severity
    mock_hotspot_med = {"relative_contrast": 0.6, "area_ratio_percent": 6.0}
    sev, expl = test_engine.estimate_severity("Electrical Fault", mock_hotspot_med, 0.75)
    assert sev == "Medium"

    # Test Normal / No hotspot
    sev, expl = test_engine.estimate_severity("Normal", None, 0.95)
    assert sev is None
    assert "Normal thermal dissipation" in expl
