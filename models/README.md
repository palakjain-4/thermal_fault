# Deep Learning Model Weights & Architecture

## Overview
Model checkpoints and evaluation metadata are stored in `backend/ml/weights/`:

```text
backend/ml/weights/
├── thermal_resnet18_best.pt   # PyTorch serialized weights state dictionary
└── model_metadata.json         # Evaluation metrics, confusion matrix, and config
```

## Architecture: ResNet-18 Transfer Learning
- **Backbone:** ResNet-18 feature extractor.
- **Classification Head:**
  ```python
  nn.Sequential(
      nn.Dropout(p=0.30),
      nn.Linear(512, 256),
      nn.ReLU(inplace=True),
      nn.Dropout(p=0.20),
      nn.Linear(256, 5) # 5 Classes
  )
  ```
- **Input Size:** $3 \times 224 \times 224$ normalized RGB tensor.
- **Optimization:** Adam optimizer ($\text{lr}=5 \times 10^{-4}$), StepLR scheduler, CrossEntropyLoss.

## Re-training & Calibration
Execute the training pipeline to regenerate weights:
```bash
python backend/ml/train.py
```
The pipeline automatically evaluates the test split and updates `model_metadata.json` with genuine accuracy, F1-scores, precision, recall, and confusion matrix.
