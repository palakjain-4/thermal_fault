from pathlib import Path
from typing import List

ML_DIR = Path(__file__).resolve().parent
WEIGHTS_DIR = ML_DIR / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_WEIGHTS_PATH = WEIGHTS_DIR / "thermal_resnet18_best.pt"
MODEL_METADATA_PATH = WEIGHTS_DIR / "model_metadata.json"

CLASSES: List[str] = [
    "Normal",
    "Overheating",
    "Electrical Fault",
    "Insulation Fault",
    "Abnormal Hotspot"
]

IMAGE_SIZE = (224, 224)
NORM_MEAN = [0.485, 0.456, 0.406]
NORM_STD = [0.229, 0.224, 0.225]

# Hotspot and equipment detection parameters
EQUIPMENT_MIN_AREA_RATIO = 0.05
HOTSPOT_PERCENTILE = 88.0
HOTSPOT_MIN_PIXEL_AREA = 30
