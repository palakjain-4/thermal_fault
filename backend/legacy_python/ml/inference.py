import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import torch
import torch.nn.functional as F
import numpy as np

from ml.config import (
    CLASSES,
    MODEL_WEIGHTS_PATH,
    MODEL_METADATA_PATH,
)
from ml.model import build_model, load_model_weights
from ml.evaluation import load_model_metadata
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

logger = logging.getLogger("thermal_fault.inference")

class ThermalInferenceEngine:
    """
    Modular inference engine orchestrating thermal image validation,
    preprocessing, deep learning classification, hotspot localization,
    and severity estimation.
    """
    def __init__(self, device: str = "cpu"):
        self.device = device
        self.classes = CLASSES
        self.model = build_model(num_classes=len(CLASSES), pretrained=False, device=device)
        self.is_trained = load_model_weights(self.model, MODEL_WEIGHTS_PATH, device=device)
        self.metadata = load_model_metadata(MODEL_METADATA_PATH)
        
        if self.is_trained:
            logger.info("Successfully loaded trained thermal fault detection weights.")
        else:
            logger.info("No trained weights found. Initialized model in Demonstration/Untrained Mode.")

    def reload_weights(self):
        """Reload weights and metadata after fresh training."""
        self.is_trained = load_model_weights(self.model, MODEL_WEIGHTS_PATH, device=self.device)
        self.metadata = load_model_metadata(MODEL_METADATA_PATH)

    def estimate_severity(
        self,
        predicted_class: str,
        hotspot_info: Optional[Dict[str, Any]],
        confidence: float
    ) -> Tuple[Optional[str], str]:
        """
        Estimate severity based on relative thermal contrast, hotspot area ratio,
        and fault category characteristics.
        
        Note: Temperature severity is computed from relative thermal gradients
        since uncalibrated image files (PNG/JPG) do not provide calibrated radiometric
        sensor data in Celsius.
        """
        if predicted_class == "Normal" or not hotspot_info:
            return None, "Normal thermal dissipation observed across equipment body. No abnormal hotspot detected."

        contrast = hotspot_info.get("relative_contrast", 0.0)
        area_ratio = hotspot_info.get("area_ratio_percent", 0.0)

        # High severity criteria
        if contrast >= 1.2 or area_ratio >= 15.0 or (predicted_class == "Electrical Fault" and contrast >= 0.9):
            severity = "High"
            explanation = (
                f"High-severity abnormal thermal concentration detected ({predicted_class}). "
                f"Peak thermal contrast is {round(contrast * 100, 1)}% above ambient equipment temperature. "
                "Immediate inspection and de-energized diagnostic recommended."
            )
        # Medium severity criteria
        elif contrast >= 0.5 or area_ratio >= 5.0 or confidence >= 0.70:
            severity = "Medium"
            explanation = (
                f"Moderate thermal anomaly identified ({predicted_class}). "
                f"Local hotspot exceeds equipment operating baseline by {round(contrast * 100, 1)}%. "
                "Schedule verification within standard maintenance cycle."
            )
        # Low severity criteria
        else:
            severity = "Low"
            explanation = (
                f"Low-severity localized thermal elevation detected ({predicted_class}). "
                "Thermal gradient is within early warning tolerance. Monitor during routine thermographic patrols."
            )

        return severity, explanation

    def run_inference(
        self,
        file_bytes: bytes,
        filename: str,
        annotated_save_path: Path
    ) -> Dict[str, Any]:
        """
        Full inference pipeline:
        1. Validate image format & integrity
        2. Denoise and enhance thermal contrast
        3. Detect equipment ROI
        4. Deep learning feature extraction and classification
        5. Hotspot localization
        6. Severity estimation
        7. Generate annotated overlay
        """
        start_time = time.time()

        # Step 1: Validation
        is_valid, err_msg, img_bgr = validate_thermal_image(file_bytes)
        if not is_valid:
            raise ValueError(err_msg)

        # Step 2: Image Processing (Intensity, Denoise, CLAHE)
        intensity_map = extract_thermal_intensity(img_bgr)
        denoised_map = denoise_thermal_image(intensity_map)
        enhanced_map = enhance_contrast(denoised_map)

        # Step 3: Equipment ROI Detection
        equipment_roi = detect_equipment_roi(enhanced_map)

        # Step 4: Deep Learning Model Prediction
        tensor_input = prepare_model_tensor(img_bgr).to(self.device)
        self.model.eval()

        with torch.no_grad():
            outputs = self.model(tensor_input)
            probs = F.softmax(outputs, dim=1).squeeze(0).cpu().numpy()

        predicted_idx = int(np.argmax(probs))
        predicted_class = self.classes[predicted_idx]
        confidence = float(probs[predicted_idx])

        # Step 5: Hotspot Localization
        hotspot_info = detect_hotspots(denoised_map, equipment_roi=equipment_roi)

        # Handle condition decision logic
        if predicted_class == "Normal" and hotspot_info is None:
            predicted_condition = "Normal"
        elif predicted_class == "Normal" and hotspot_info is not None:
            # If high contrast hotspot physically exists despite normal classification, flag anomaly
            if hotspot_info["relative_contrast"] > 0.8:
                predicted_class = "Abnormal Hotspot"
                predicted_condition = "Fault Detected"
            else:
                predicted_condition = "Normal"
                hotspot_info = None
        else:
            predicted_condition = "Fault Detected"

        # Step 6: Severity & Technical Explanation
        severity, explanation = self.estimate_severity(predicted_class, hotspot_info, confidence)

        # Step 7: Annotated Overlay Generation
        generate_annotated_overlay(
            original_bgr=img_bgr,
            equipment_roi=equipment_roi,
            hotspot_info=hotspot_info,
            output_path=annotated_save_path,
            predicted_condition=predicted_condition,
            fault_type=predicted_class,
            severity=severity
        )

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        all_probabilities = {
            cls_name: round(float(probs[i]), 4)
            for i, cls_name in enumerate(self.classes)
        }

        # Filter mask out of equipment_roi for JSON serialization
        serialized_roi = None
        if equipment_roi:
            serialized_roi = {
                "bounding_box": equipment_roi["bounding_box"],
                "area_pixels": equipment_roi["area_pixels"],
                "coverage_ratio": round(equipment_roi["coverage_ratio"], 3),
            }

        return {
            "imageFilename": filename,
            "predictedCondition": predicted_condition,
            "faultType": predicted_class,
            "confidence": round(confidence, 4),
            "allProbabilities": all_probabilities,
            "severity": severity,
            "hotspot": hotspot_info,
            "equipmentRoi": serialized_roi,
            "explanation": explanation,
            "modelVersion": self.metadata.get("version", "v1.2.0"),
            "modelName": self.metadata.get("modelName", "ResNet18-ThermalTransfer"),
            "inferenceTimeMs": inference_time_ms,
            "isDemoMode": not self.is_trained,
        }

inference_engine = ThermalInferenceEngine()
