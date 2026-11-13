import os
import sys
import time
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from datetime import datetime

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from ml.config import (
    CLASSES,
    IMAGE_SIZE,
    NORM_MEAN,
    NORM_STD,
    MODEL_WEIGHTS_PATH,
    MODEL_METADATA_PATH,
)
from ml.model import build_model, save_model_weights
from ml.evaluation import evaluate_predictions, save_model_metadata

def get_data_transforms():
    train_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=NORM_MEAN, std=NORM_STD),
    ])

    eval_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=NORM_MEAN, std=NORM_STD),
    ])

    return train_transform, eval_transform


def train_model(
    data_dir: Path,
    epochs: int = 8,
    batch_size: int = 16,
    lr: float = 0.0005,
    device: str = "cpu"
):
    print(f"=== Starting Thermal Fault Detection Model Training ===")
    print(f"Data directory: {data_dir}")
    print(f"Device: {device}")
    print(f"Target classes: {CLASSES}")

    train_path = data_dir / "train"
    val_path = data_dir / "val"
    test_path = data_dir / "test"

    if not train_path.exists() or not any(train_path.iterdir()):
        print(f"Training dataset not found in {train_path}.")
        print("Generating synthetic benchmark thermal dataset for training...")
        from ml.dataset_generator import generate_benchmark_dataset
        generate_benchmark_dataset(data_dir, samples_per_class=30)

    train_trans, eval_trans = get_data_transforms()

    train_dataset = datasets.ImageFolder(str(train_path), transform=train_trans)
    val_dataset = datasets.ImageFolder(str(val_path), transform=eval_trans)
    test_dataset = datasets.ImageFolder(str(test_path), transform=eval_trans)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    print(f"Loaded: {len(train_dataset)} train, {len(val_dataset)} val, {len(test_dataset)} test samples.")

    # Build model with ResNet18 transfer learning
    model = build_model(num_classes=len(CLASSES), pretrained=True, device=device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=4, gamma=0.5)

    best_val_acc = 0.0
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        scheduler.step()
        train_loss = running_loss / total
        train_acc = correct / total

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)

                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_loss = val_loss / val_total
        val_acc = val_correct / val_total

        print(
            f"Epoch {epoch:02d}/{epochs:02d} | "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}"
        )

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            save_model_weights(model, MODEL_WEIGHTS_PATH)

    elapsed = round(time.time() - start_time, 2)
    print(f"\nTraining completed in {elapsed}s. Best Val Accuracy: {best_val_acc:.4f}")

    # Evaluate on Test Set
    print("\nEvaluating on Test Set...")
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.numpy().tolist())

    metrics = evaluate_predictions(all_targets, all_preds, class_names=CLASSES)
    print(f"Test Accuracy: {metrics['accuracy']:.4f}")
    print(f"Test Macro F1: {metrics['macro_f1']:.4f}")

    # Save comprehensive metadata
    metadata = {
        "modelName": "ResNet18-ThermalTransfer",
        "version": "v1.2.0-trained",
        "trainedAt": datetime.utcnow().isoformat(),
        "trainingDurationSeconds": elapsed,
        "epochs": epochs,
        "isTrainedWeightsAvailable": True,
        "isDemoMode": False,
        "architecture": "ResNet18 with Custom 2-Layer Classification Head",
        "device": device,
        "supportedClasses": CLASSES,
        "datasetInfo": {
            "totalSamples": len(train_dataset) + len(val_dataset) + len(test_dataset),
            "trainSamples": len(train_dataset),
            "valSamples": len(val_dataset),
            "testSamples": len(test_dataset),
            "splits": "70% Train / 15% Validation / 15% Test",
            "augmentation": "RandomHorizontalFlip, RandomRotation(10 deg), ColorJitter"
        },
        "evaluationMetrics": metrics,
        "limitations": [
            "Requires radiometric sensor calibration for absolute temperature values in degrees Celsius.",
            "Ambient solar radiation or reflective metallic surfaces can produce false-positive thermal gradients.",
            "Inspection angles greater than 60 degrees can reduce apparent thermal contrast.",
            "Ensure high resolution thermal cameras (>=320x240) for fine-pitch terminal inspections."
        ]
    }

    save_model_metadata(metadata, MODEL_METADATA_PATH)
    print(f"Saved weights to: {MODEL_WEIGHTS_PATH}")
    print(f"Saved evaluation metadata to: {MODEL_METADATA_PATH}")
    return metadata


if __name__ == "__main__":
    from app.config import settings
    train_model(settings.DATA_DIR, epochs=5)
