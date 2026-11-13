# Thermal Fault Detection Dataset Directory

## Overview
This directory stores thermal thermographic datasets for model training, validation, testing, and sample demonstrations.

## Directory Structure
```text
data/
├── train/
│   ├── Normal/
│   ├── Overheating/
│   ├── Electrical Fault/
│   ├── Insulation Fault/
│   └── Abnormal Hotspot/
├── val/
│   ├── Normal/
│   ├── Overheating/
│   ├── Electrical Fault/
│   ├── Insulation Fault/
│   └── Abnormal Hotspot/
├── test/
│   ├── Normal/
│   ├── Overheating/
│   ├── Electrical Fault/
│   ├── Insulation Fault/
│   └── Abnormal Hotspot/
└── samples/
    ├── sample_normal_1.png
    ├── sample_overheating_1.png
    ├── sample_electrical_fault_1.png
    ├── sample_insulation_fault_1.png
    └── sample_abnormal_hotspot_1.png
```

## Supported Classes
1. **Normal:** Baseline thermal dissipation across equipment surfaces.
2. **Overheating:** Widespread thermal saturation over a winding, phase conductor, or housing.
3. **Electrical Fault:** Sharp point contact resistance, loose connector, or high-temperature arc.
4. **Insulation Fault:** Thermal leakage gradient along the insulator dielectric boundary.
5. **Abnormal Hotspot:** Localized anomalous temperature gradient at a joint or bushing.

## Generating Benchmark Synthetic Scans
To populate or regenerate the benchmark dataset:
```bash
python backend/ml/dataset_generator.py
```

## Adding Real Industrial FLIR / Infrared Imagery
To use real infrared camera imagery:
1. Place standard false-color (ironbow, rainbow, or jet) or grayscale thermal images into the appropriate subfolder under `train/`, `val/`, and `test/`.
2. Ensure image resolution is at least $32 \times 32$ pixels.
3. Re-run training:
   ```bash
   python backend/ml/train.py
   ```
