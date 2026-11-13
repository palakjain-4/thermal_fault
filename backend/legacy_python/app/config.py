import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Deep Learning-Based Thermal Fault Detection"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Storage paths
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    MODELS_DIR: Path = BASE_DIR / "ml" / "weights"
    DATA_DIR: Path = PROJECT_ROOT / "data"
    
    # File limits
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]
    
    # Database
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "thermal_fault_db")
    COLLECTION_NAME: str = "analyses"
    MONGODB_TIMEOUT_MS: int = 2500
    
    # ML & Inference configuration
    DEFAULT_MODEL_NAME: str = "ResNet18-ThermalTransfer"
    MODEL_VERSION: str = "v1.2.0"
    DEVICE: str = "cpu"
    CONFIDENCE_THRESHOLD: float = 0.60
    
    # Supported fault categories
    SUPPORTED_CLASSES: List[str] = [
        "Normal",
        "Overheating",
        "Electrical Fault",
        "Insulation Fault",
        "Abnormal Hotspot"
    ]
    
    # Hotspot analysis parameters
    HOTSPOT_THRESHOLD_PERCENTILE: float = 85.0
    HOTSPOT_MIN_CONTOUR_AREA: int = 40
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure required runtime directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "raw").mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "annotated").mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
