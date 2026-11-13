import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.config import settings
from app.database import analysis_repository, MongoDBConnectionError
from app.services.report_service import generate_pdf_report
from ml.inference import inference_engine

logger = logging.getLogger("thermal_fault.service")

class ThermalService:
    def __init__(self):
        self.inference = inference_engine
        self.repo = analysis_repository

    def analyze_image(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Execute complete analysis workflow:
        1. Save raw image
        2. Run deep learning inference & hotspot detection
        3. Save annotated image
        4. Generate PDF report
        5. Persist record to MongoDB
        """
        # Generate unique analysis ID
        analysis_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = Path(filename).name
        stem = Path(safe_filename).stem
        ext = Path(safe_filename).suffix.lower() or ".png"

        # Unique file paths
        raw_filename = f"{timestamp}_{analysis_id[:8]}_{stem}{ext}"
        raw_path = settings.UPLOAD_DIR / "raw" / raw_filename

        annotated_filename = f"annotated_{timestamp}_{analysis_id[:8]}_{stem}.png"
        annotated_path = settings.UPLOAD_DIR / "annotated" / annotated_filename

        report_filename = f"report_{timestamp}_{analysis_id[:8]}_{stem}.pdf"
        report_path = settings.REPORTS_DIR / report_filename

        # Save raw image to disk safely
        with open(raw_path, "wb") as f:
            f.write(file_bytes)

        # Run inference
        try:
            inference_result = self.inference.run_inference(
                file_bytes=file_bytes,
                filename=safe_filename,
                annotated_save_path=annotated_path
            )
        except Exception as e:
            # Clean up raw image on inference failure
            if raw_path.exists():
                raw_path.unlink()
            raise e

        # Construct public asset URLs
        raw_url = f"/uploads/raw/{raw_filename}"
        annotated_url = f"/uploads/annotated/{annotated_filename}"
        report_url = f"/reports/{report_filename}"

        # Build complete record data
        record = {
            "_id": analysis_id,
            "imageFilename": safe_filename,
            "rawImagePath": str(raw_path),
            "rawImageUrl": raw_url,
            "annotatedImagePath": str(annotated_path),
            "annotatedImageUrl": annotated_url,
            "reportPath": str(report_path),
            "reportUrl": report_url,
            "predictedCondition": inference_result["predictedCondition"],
            "faultType": inference_result["faultType"],
            "confidence": inference_result["confidence"],
            "allProbabilities": inference_result["allProbabilities"],
            "severity": inference_result["severity"],
            "hotspot": inference_result["hotspot"],
            "equipmentRoi": inference_result["equipmentRoi"],
            "explanation": inference_result["explanation"],
            "modelVersion": inference_result["modelVersion"],
            "modelName": inference_result["modelName"],
            "inferenceTimeMs": inference_result["inferenceTimeMs"],
            "isDemoMode": inference_result["isDemoMode"],
            "createdAt": datetime.utcnow().isoformat(),
        }

        # Generate PDF inspection report
        try:
            generate_pdf_report(
                analysis_data=record,
                raw_image_path=raw_path,
                annotated_image_path=annotated_path,
                output_pdf_path=report_path
            )
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}")
            record["reportUrl"] = None

        # Persist to MongoDB (Strict: will raise MongoDBConnectionError if MongoDB is unavailable)
        saved_record = self.repo.create(record)
        return saved_record

    def get_analysis_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_by_id(analysis_id)

    def list_analyses(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        return self.repo.list_all(limit=limit, skip=skip)

    def delete_analysis(self, analysis_id: str) -> bool:
        record = self.repo.get_by_id(analysis_id)
        if not record:
            return False

        # Attempt to delete physical files
        for key in ["rawImagePath", "annotatedImagePath", "reportPath"]:
            path_str = record.get(key)
            if path_str:
                p = Path(path_str)
                if p.exists():
                    try:
                        p.unlink()
                    except Exception as e:
                        logger.warning(f"Failed to delete file {p}: {e}")

        return self.repo.delete(analysis_id)

    def get_dashboard_stats(self) -> Dict[str, Any]:
        return self.repo.get_stats()

    def get_model_info(self) -> Dict[str, Any]:
        meta = self.inference.metadata
        return {
            "modelName": meta.get("modelName", "ResNet18-ThermalTransfer"),
            "version": meta.get("version", "v1.2.0"),
            "architecture": meta.get("architecture", "ResNet18 with Custom 2-Layer Classification Head"),
            "device": self.inference.device,
            "supportedClasses": self.inference.classes,
            "isTrainedWeightsAvailable": self.inference.is_trained,
            "isDemoMode": not self.inference.is_trained,
            "datasetInfo": meta.get("datasetInfo", {}),
            "evaluationMetrics": meta.get("evaluationMetrics", {}),
            "limitations": meta.get("limitations", []),
        }

thermal_service = ThermalService()
