import pytest
import torch
from pathlib import Path
from ml.model import build_model, save_model_weights, load_model_weights
from ml.config import CLASSES

def test_build_model_architecture():
    model = build_model(num_classes=len(CLASSES), pretrained=False, device="cpu")
    assert model is not None
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    assert output.shape == (1, len(CLASSES))

def test_save_and_load_weights(tmp_path):
    model = build_model(num_classes=len(CLASSES), pretrained=False, device="cpu")
    weights_file = tmp_path / "test_weights.pt"

    save_model_weights(model, weights_file)
    assert weights_file.exists()

    new_model = build_model(num_classes=len(CLASSES), pretrained=False, device="cpu")
    loaded = load_model_weights(new_model, weights_file, device="cpu")
    assert loaded is True

def test_load_nonexistent_weights(tmp_path):
    model = build_model(num_classes=len(CLASSES), pretrained=False, device="cpu")
    non_existent = tmp_path / "does_not_exist.pt"
    loaded = load_model_weights(model, non_existent, device="cpu")
    assert loaded is False
