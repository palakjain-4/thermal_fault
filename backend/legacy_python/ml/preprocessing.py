import io
import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as T
from typing import Tuple, Optional, Dict, Any
from pathlib import Path
from ml.config import (
    IMAGE_SIZE,
    NORM_MEAN,
    NORM_STD,
    HOTSPOT_PERCENTILE,
    HOTSPOT_MIN_PIXEL_AREA,
    EQUIPMENT_MIN_AREA_RATIO,
)

def validate_thermal_image(file_bytes: bytes) -> Tuple[bool, Optional[str], Optional[np.ndarray]]:
    """
    Validate uploaded image buffer.
    Checks:
    - Non-empty buffer
    - Valid decodable image format (PNG, JPG, TIFF, BMP)
    - Valid dimensions (at least 32x32)
    - Returns decoded BGR numpy array.
    """
    if not file_bytes or len(file_bytes) == 0:
        return False, "Uploaded image file is empty.", None

    try:
        # Check with PIL first to verify headers
        pil_img = Image.open(io.BytesIO(file_bytes))
        pil_img.verify()
        
        # Reload buffer for actual decoding
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            return False, "Failed to decode image data. Unsupported or corrupt format.", None
            
        h, w = img_bgr.shape[:2]
        if h < 32 or w < 32:
            return False, f"Image resolution too small ({w}x{h}). Minimum required is 32x32.", None
            
        return True, None, img_bgr
    except Exception as e:
        return False, f"Image validation error: {str(e)}", None


def extract_thermal_intensity(img_bgr: np.ndarray) -> np.ndarray:
    """
    Convert thermal image to a single-channel thermal intensity representation.
    Handles false-color palettes (ironbow, rainbow, jet) by converting to Lab/HSV luminance
    or standard weighted grayscale.
    """
    # Convert to YCrCb or Lab to capture thermal brightness/luminance
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    y_channel = ycrcb[:, :, 0]
    
    # Also compute max RGB channel to account for saturated white/yellow/red hotspots
    max_rgb = np.max(img_bgr, axis=2)
    
    # Weighted fusion
    intensity = cv2.addWeighted(y_channel, 0.6, max_rgb, 0.4, 0)
    return intensity


def denoise_thermal_image(intensity_map: np.ndarray) -> np.ndarray:
    """
    Apply edge-preserving bilateral filtering to eliminate sensor noise
    without blurring critical high-temperature gradient boundaries.
    """
    denoised = cv2.bilateralFilter(intensity_map, d=7, sigmaColor=50, sigmaSpace=50)
    return denoised


def enhance_contrast(intensity_map: np.ndarray) -> np.ndarray:
    """
    Apply Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to reveal subtle thermal gradients across cold and warm equipment surfaces.
    """
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(intensity_map)
    return enhanced


def detect_equipment_roi(enhanced_img: np.ndarray) -> Optional[Dict[str, Any]]:
    """
    Identify and segment the primary electrical equipment boundary from ambient background.
    Uses multi-threshold Otsu and morphological closing to group the equipment body.
    """
    h, w = enhanced_img.shape[:2]
    total_area = h * w
    
    # Otsu thresholding to separate equipment from ambient cooler background
    blur = cv2.GaussianBlur(enhanced_img, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Morphological closing to seal internal equipment contours
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    valid_contours = []
    for c in contours:
        area = cv2.contourArea(c)
        if area >= (total_area * EQUIPMENT_MIN_AREA_RATIO):
            valid_contours.append((area, c))
            
    if not valid_contours:
        # Default full image as ROI if no distinct background segmentation
        return {
            "bounding_box": {"x_min": 0, "y_min": 0, "x_max": w, "y_max": h, "width": w, "height": h},
            "area_pixels": int(total_area),
            "coverage_ratio": 1.0,
            "mask": np.ones((h, w), dtype=np.uint8) * 255,
        }
        
    # Pick the largest bounding contour or merge top contours
    valid_contours.sort(key=lambda x: x[0], reverse=True)
    best_area, best_contour = valid_contours[0]
    bx, by, bw, bh = cv2.boundingRect(best_contour)
    
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(mask, [best_contour], -1, 255, -1)
    
    return {
        "bounding_box": {
            "x_min": int(bx),
            "y_min": int(by),
            "x_max": int(bx + bw),
            "y_max": int(by + bh),
            "width": int(bw),
            "height": int(bh),
        },
        "area_pixels": int(best_area),
        "coverage_ratio": float(best_area / total_area),
        "mask": mask,
    }


def detect_hotspots(
    intensity_map: np.ndarray,
    equipment_roi: Optional[Dict[str, Any]] = None,
    percentile: float = HOTSPOT_PERCENTILE,
    min_pixel_area: int = HOTSPOT_MIN_PIXEL_AREA
) -> Optional[Dict[str, Any]]:
    """
    Detect abnormal thermal hotspots by calculating statistical thermal intensity
    distribution within the equipment region.
    Returns hotspot coordinates, centroid, peak pixel, and thermal contrast metrics.
    """
    h, w = intensity_map.shape[:2]
    
    roi_mask = None
    if equipment_roi and "mask" in equipment_roi:
        roi_mask = equipment_roi["mask"]
    else:
        roi_mask = np.ones((h, w), dtype=np.uint8) * 255

    # Sample intensity within the equipment mask
    masked_pixels = intensity_map[roi_mask > 0]
    if len(masked_pixels) == 0:
        masked_pixels = intensity_map.flatten()

    mean_ambient = float(np.mean(masked_pixels))
    std_ambient = float(np.std(masked_pixels))
    thresh_val = float(np.percentile(masked_pixels, percentile))

    # Threshold for candidate hotspots
    _, binary_hotspots = cv2.threshold(intensity_map, int(thresh_val), 255, cv2.THRESH_BINARY)
    # Restrict to ROI mask
    binary_hotspots = cv2.bitwise_and(binary_hotspots, binary_hotspots, mask=roi_mask)

    # Clean small noise specks
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary_hotspots = cv2.morphologyEx(binary_hotspots, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(binary_hotspots, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    candidates = []
    for c in contours:
        area = cv2.contourArea(c)
        if area >= min_pixel_area:
            candidates.append((area, c))

    if not candidates:
        return None

    # Sort by area
    candidates.sort(key=lambda x: x[0], reverse=True)
    best_area, best_c = candidates[0]
    
    bx, by, bw, bh = cv2.boundingRect(best_c)
    
    # Calculate Moments for centroid
    M = cv2.moments(best_c)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        cx = int(bx + bw // 2)
        cy = int(by + bh // 2)

    # Find peak thermal pixel inside hotspot patch
    hotspot_patch = intensity_map[by:by+bh, bx:bx+bw]
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(hotspot_patch)
    peak_x = int(bx + max_loc[0])
    peak_y = int(by + max_loc[1])

    # Relative thermal contrast ratio
    rel_contrast = float((max_val - mean_ambient) / (mean_ambient + 1e-5))
    area_ratio = float((best_area / (equipment_roi["area_pixels"] if equipment_roi else (h * w))) * 100.0)

    return {
        "bounding_box": {
            "x_min": int(bx),
            "y_min": int(by),
            "x_max": int(bx + bw),
            "y_max": int(by + bh),
            "width": int(bw),
            "height": int(bh),
        },
        "centroid": [cx, cy],
        "peak_pixel": [peak_x, peak_y],
        "peak_intensity": float(max_val),
        "mean_intensity": float(np.mean(hotspot_patch)),
        "area_pixels": int(best_area),
        "area_ratio_percent": round(area_ratio, 2),
        "relative_contrast": round(rel_contrast, 3),
    }


def generate_annotated_overlay(
    original_bgr: np.ndarray,
    equipment_roi: Optional[Dict[str, Any]],
    hotspot_info: Optional[Dict[str, Any]],
    output_path: Path,
    predicted_condition: str,
    fault_type: str,
    severity: Optional[str]
) -> Path:
    """
    Generate professional visual diagnostic overlay on the thermal image:
    - Equipment boundary in cyan
    - Hotspot bounding box in bright red/amber with label
    - Hotspot peak pixel crosshair
    - Information banner at top
    """
    annotated = original_bgr.copy()
    h, w = annotated.shape[:2]

    # Draw Equipment ROI if present and not whole frame
    if equipment_roi and equipment_roi.get("coverage_ratio", 1.0) < 0.95:
        eb = equipment_roi["bounding_box"]
        cv2.rectangle(
            annotated,
            (eb["x_min"], eb["y_min"]),
            (eb["x_max"], eb["y_max"]),
            (255, 200, 0), # Cyan / Sky Blue in BGR
            2,
            lineType=cv2.LINE_AA
        )
        cv2.putText(
            annotated,
            "Equipment ROI",
            (eb["x_min"] + 4, max(eb["y_min"] - 6, 18)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 200, 0),
            1,
            cv2.LINE_AA
        )

    # Draw Hotspot if detected
    if hotspot_info and predicted_condition != "Normal":
        hb = hotspot_info["bounding_box"]
        color = (0, 0, 255) # Red for high/medium
        if severity == "Low":
            color = (0, 165, 255) # Orange in BGR
            
        # Draw bounding box
        cv2.rectangle(
            annotated,
            (hb["x_min"], hb["y_min"]),
            (hb["x_max"], hb["y_max"]),
            color,
            2,
            lineType=cv2.LINE_AA
        )

        # Draw crosshair on peak pixel
        px, py = hotspot_info["peak_pixel"]
        ch_len = 10
        cv2.line(annotated, (px - ch_len, py), (px + ch_len, py), (255, 255, 255), 2, cv2.LINE_AA)
        cv2.line(annotated, (px, py - ch_len), (px, py + ch_len), (255, 255, 255), 2, cv2.LINE_AA)
        cv2.circle(annotated, (px, py), 4, color, -1, cv2.LINE_AA)

        # Label tag above hotspot
        label_text = f"Hotspot ({severity} Sev)"
        cv2.putText(
            annotated,
            label_text,
            (hb["x_min"], max(hb["y_min"] - 8, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            color,
            2,
            cv2.LINE_AA
        )

    # Draw Top Diagnostic Header Banner
    banner_height = 42
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, banner_height), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.8, annotated, 0.2, 0, annotated)

    status_color = (0, 200, 50) if predicted_condition == "Normal" else (0, 50, 255)
    cv2.putText(
        annotated,
        f"STATUS: {predicted_condition.upper()}",
        (12, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        status_color,
        2,
        cv2.LINE_AA
    )

    if predicted_condition != "Normal":
        cv2.putText(
            annotated,
            f"FAULT: {fault_type} | SEV: {severity or 'N/A'}",
            (max(200, int(w * 0.45)), 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (240, 240, 240),
            1,
            cv2.LINE_AA
        )

    # Save to disk
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), annotated)
    return output_path


def prepare_model_tensor(img_bgr: np.ndarray, target_size: Tuple[int, int] = IMAGE_SIZE) -> torch.Tensor:
    """
    Convert OpenCV BGR image to normalized PyTorch tensor ready for CNN inference.
    """
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    
    transform = T.Compose([
        T.Resize(target_size),
        T.ToTensor(),
        T.Normalize(mean=NORM_MEAN, std=NORM_STD)
    ])
    
    tensor = transform(pil_img).unsqueeze(0) # (1, 3, 224, 224)
    return tensor
