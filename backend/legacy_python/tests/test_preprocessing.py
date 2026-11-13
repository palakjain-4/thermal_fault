import pytest
import numpy as np
import cv2
from pathlib import Path
from ml.preprocessing import (
    validate_thermal_image,
    extract_thermal_intensity,
    denoise_thermal_image,
    enhance_contrast,
    detect_equipment_roi,
    detect_hotspots,
    generate_annotated_overlay,
    prepare_model_tensor,
)

@pytest.fixture
def sample_thermal_bgr():
    """Create synthetic thermal BGR image with an equipment body and a hotspot."""
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    # Ambient cool background
    img[:, :] = (80, 20, 10)
    # Equipment body (warmer)
    cv2.rectangle(img, (30, 30), (170, 170), (180, 80, 30), -1)
    # Localized hotspot (very hot white/yellow/red)
    cv2.circle(img, (100, 90), 18, (255, 255, 255), -1)
    return img

@pytest.fixture
def sample_valid_bytes(sample_thermal_bgr):
    _, buf = cv2.imencode('.png', sample_thermal_bgr)
    return buf.tobytes()

def test_validate_thermal_image_valid(sample_valid_bytes):
    is_valid, err, img = validate_thermal_image(sample_valid_bytes)
    assert is_valid is True
    assert err is None
    assert img is not None
    assert img.shape[0] == 200
    assert img.shape[1] == 200

def test_validate_thermal_image_empty():
    is_valid, err, img = validate_thermal_image(b"")
    assert is_valid is False
    assert "empty" in err.lower()
    assert img is None

def test_validate_thermal_image_corrupted():
    corrupt_bytes = b"NOT_AN_IMAGE_HEADER_RANDOM_CORRUPT_DATA"
    is_valid, err, img = validate_thermal_image(corrupt_bytes)
    assert is_valid is False
    assert "corrupt" in err.lower() or "error" in err.lower()
    assert img is None

def test_validate_thermal_image_too_small():
    tiny = np.zeros((10, 10, 3), dtype=np.uint8)
    _, buf = cv2.imencode('.png', tiny)
    is_valid, err, img = validate_thermal_image(buf.tobytes())
    assert is_valid is False
    assert "too small" in err.lower()

def test_extract_intensity_and_denoise(sample_thermal_bgr):
    intensity = extract_thermal_intensity(sample_thermal_bgr)
    assert intensity.shape == (200, 200)
    assert intensity.dtype == np.uint8

    denoised = denoise_thermal_image(intensity)
    assert denoised.shape == (200, 200)

    enhanced = enhance_contrast(denoised)
    assert enhanced.shape == (200, 200)

def test_detect_equipment_roi(sample_thermal_bgr):
    intensity = extract_thermal_intensity(sample_thermal_bgr)
    enhanced = enhance_contrast(intensity)
    roi = detect_equipment_roi(enhanced)
    assert roi is not None
    assert "bounding_box" in roi
    assert roi["bounding_box"]["width"] > 50
    assert roi["bounding_box"]["height"] > 50

def test_detect_hotspots(sample_thermal_bgr):
    intensity = extract_thermal_intensity(sample_thermal_bgr)
    denoised = denoise_thermal_image(intensity)
    roi = detect_equipment_roi(denoised)
    hotspot = detect_hotspots(denoised, equipment_roi=roi)
    
    assert hotspot is not None
    assert "bounding_box" in hotspot
    assert "centroid" in hotspot
    assert "peak_pixel" in hotspot
    assert hotspot["relative_contrast"] > 0

def test_generate_annotated_overlay(tmp_path, sample_thermal_bgr):
    intensity = extract_thermal_intensity(sample_thermal_bgr)
    roi = detect_equipment_roi(intensity)
    hotspot = detect_hotspots(intensity, equipment_roi=roi)
    out_file = tmp_path / "test_annotated.png"

    path = generate_annotated_overlay(
        original_bgr=sample_thermal_bgr,
        equipment_roi=roi,
        hotspot_info=hotspot,
        output_path=out_file,
        predicted_condition="Fault Detected",
        fault_type="Electrical Fault",
        severity="High"
    )

    assert path.exists()
    assert path.stat().st_size > 0

def test_prepare_model_tensor(sample_thermal_bgr):
    tensor = prepare_model_tensor(sample_thermal_bgr, target_size=(224, 224))
    assert tensor.shape == (1, 3, 224, 224)
