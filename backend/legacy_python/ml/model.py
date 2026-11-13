import torch
import torch.nn as nn
from torchvision import models
from typing import List, Optional
from pathlib import Path
from ml.config import CLASSES, MODEL_WEIGHTS_PATH

class ThermalResNet(nn.Module):
    """
    Thermal Fault Classification Model based on ResNet-18 Transfer Learning.
    Features a custom classification head designed for infrared & thermal feature classification.
    """
    def __init__(self, num_classes: int = len(CLASSES), pretrained: bool = False):
        super().__init__()
        weights = None
        if pretrained:
            try:
                weights = models.ResNet18_Weights.DEFAULT
                self.backbone = models.resnet18(weights=weights)
            except Exception:
                self.backbone = models.resnet18(weights=None)
        else:
            self.backbone = models.resnet18(weights=None)
        
        # Replace the final fully connected layer with a robust classification head
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(p=0.30),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.20),
            nn.Linear(256, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

def build_model(
    num_classes: int = len(CLASSES),
    pretrained: bool = True,
    device: str = "cpu"
) -> ThermalResNet:
    """Instantiate model and move to appropriate device."""
    model = ThermalResNet(num_classes=num_classes, pretrained=pretrained)
    model.to(device)
    return model

def save_model_weights(model: nn.Module, path: Path = MODEL_WEIGHTS_PATH):
    """Save model weights state dictionary."""
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), str(path))

def load_model_weights(
    model: nn.Module,
    path: Path = MODEL_WEIGHTS_PATH,
    device: str = "cpu"
) -> bool:
    """Load model weights if available on disk."""
    if not path.exists():
        return False
    try:
        state_dict = torch.load(str(path), map_location=device)
        model.load_state_dict(state_dict)
        model.eval()
        return True
    except Exception as e:
        print(f"Warning: Failed to load weights from {path}: {e}")
        return False
