import pytest
import numpy as np
import cv2
from pathlib import Path
from app.services.report_service import generate_pdf_report

def test_generate_pdf_report(tmp_path):
    # Create mock raw image and annotated image
    raw_path = tmp_path / "raw.png"
    annotated_path = tmp_path / "annotated.png"
    pdf_out = tmp_path / "test_report.pdf"

    mock_img = np.zeros((100, 100, 3), dtype=np.uint8)
    cv2.imwrite(str(raw_path), mock_img)
    cv2.imwrite(str(annotated_path), mock_img)

    analysis_mock = {
        "_id": "test-uuid-12345",
        "imageFilename": "switchgear_bushing.png",
        "createdAt": "2026-10-14T10:00:00Z",
        "predictedCondition": "Fault Detected",
        "faultType": "Electrical Fault",
        "confidence": 0.88,
        "severity": "High",
        "explanation": "Critical thermal concentration at disconnect blade terminal.",
        "modelName": "ResNet18-Thermal",
        "modelVersion": "v1.2.0",
        "hotspot": {
            "bounding_box": {"x_min": 20, "y_min": 25, "x_max": 75, "y_max": 80, "width": 55, "height": 55},
            "centroid": [47, 52],
            "peak_pixel": [50, 50],
            "peak_intensity": 252.0,
            "relative_contrast": 1.25,
            "area_ratio_percent": 8.4,
        }
    }

    generated_path = generate_pdf_report(
        analysis_data=analysis_mock,
        raw_image_path=raw_path,
        annotated_image_path=annotated_path,
        output_pdf_path=pdf_out
    )

    assert generated_path.exists()
    assert generated_path.stat().st_size > 500  # PDF is populated
    
    # Check PDF Magic Header
    with open(generated_path, "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-"
