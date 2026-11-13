import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
import cv2
import numpy as np
import random
from typing import Tuple, List

PALETTES = [
    cv2.COLORMAP_INFERNO,
    cv2.COLORMAP_JET,
    cv2.COLORMAP_HOT,
]

def create_synthetic_thermal_image(
    category: str,
    width: int = 320,
    height: int = 320,
    colormap: int = cv2.COLORMAP_INFERNO
) -> np.ndarray:
    """
    Generate an authentic synthetic thermal infrared image with realistic electrical
    equipment geometries (bushings, conductors, panels) and thermal signatures.
    """
    # 1. Base ambient temperature gradient (cool background)
    ambient_base = np.random.randint(25, 55)
    noise = np.random.normal(0, 4, (height, width))
    thermal_map = np.full((height, width), ambient_base, dtype=np.float32) + noise

    # 2. Draw electrical equipment body (e.g. transformer/busbar/disconnect switch)
    eq_w = int(width * random.uniform(0.60, 0.85))
    eq_h = int(height * random.uniform(0.55, 0.80))
    x0 = (width - eq_w) // 2 + random.randint(-15, 15)
    y0 = (height - eq_h) // 2 + random.randint(-15, 15)
    
    # Equipment ambient operating heat
    eq_operating_temp = ambient_base + random.uniform(40, 75)
    cv2.rectangle(thermal_map, (x0, y0), (x0 + eq_w, y0 + eq_h), eq_operating_temp, -1)

    # Equipment structural details (conductors/fins)
    num_fins = random.randint(3, 6)
    fin_w = eq_w // (num_fins * 2)
    for i in range(num_fins):
        fx = x0 + i * (fin_w * 2) + 10
        cv2.rectangle(thermal_map, (fx, y0 + 10), (fx + fin_w, y0 + eq_h - 10), eq_operating_temp + 15, -1)

    # 3. Inject fault-specific thermal signatures
    if category == "Normal":
        # Even heat dissipation across equipment
        thermal_map = cv2.GaussianBlur(thermal_map, (15, 15), 0)
        
    elif category == "Overheating":
        # Widespread severe thermal saturation on an entire section or phase
        hx = x0 + eq_w // 2 + random.randint(-30, 30)
        hy = y0 + eq_h // 2 + random.randint(-30, 30)
        axes = (int(eq_w * 0.35), int(eq_h * 0.28))
        cv2.ellipse(thermal_map, (hx, hy), axes, random.randint(0, 45), 0, 360, 240, -1)
        thermal_map = cv2.GaussianBlur(thermal_map, (35, 35), 0)

    elif category == "Electrical Fault":
        # Sharp high-intensity contact resistance point / terminal arc
        px = x0 + random.choice([int(eq_w * 0.25), int(eq_w * 0.75)])
        py = y0 + int(eq_h * 0.2)
        cv2.circle(thermal_map, (px, py), random.randint(18, 28), 255, -1)
        # Thermal bloom
        cv2.circle(thermal_map, (px, py), random.randint(38, 55), 210, -1)
        thermal_map = cv2.GaussianBlur(thermal_map, (19, 19), 0)

    elif category == "Insulation Fault":
        # Diffused gradient thermal leakage along the insulator border
        leak_y = y0 + random.randint(20, eq_h - 40)
        cv2.line(thermal_map, (x0 + 10, leak_y), (x0 + eq_w - 10, leak_y + 15), 220, thickness=22)
        thermal_map = cv2.GaussianBlur(thermal_map, (25, 25), 0)

    elif category == "Abnormal Hotspot":
        # Localized severe thermal hotspot at a bolted joint or bushing
        hx = x0 + random.randint(int(eq_w * 0.2), int(eq_w * 0.8))
        hy = y0 + random.randint(int(eq_h * 0.2), int(eq_h * 0.8))
        cv2.circle(thermal_map, (hx, hy), random.randint(14, 24), 250, -1)
        thermal_map = cv2.GaussianBlur(thermal_map, (15, 15), 0)

    # 4. Normalize and apply thermal colormap
    thermal_map = np.clip(thermal_map, 0, 255).astype(np.uint8)
    colored = cv2.applyColorMap(thermal_map, colormap)
    return colored


def generate_benchmark_dataset(
    output_dir: Path,
    samples_per_class: int = 25,
    splits: Tuple[float, float, float] = (0.7, 0.15, 0.15)
):
    """
    Generate complete dataset organized into train, val, test splits.
    """
    from ml.config import CLASSES
    train_pct, val_pct, _ = splits

    for split in ["train", "val", "test"]:
        for cls_name in CLASSES:
            (output_dir / split / cls_name).mkdir(parents=True, exist_ok=True)

    # Also create sample directory for UI demonstration
    samples_dir = output_dir / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    count_by_split = {"train": 0, "val": 0, "test": 0}

    for cls_name in CLASSES:
        for idx in range(samples_per_class):
            cmap = random.choice(PALETTES)
            img = create_synthetic_thermal_image(cls_name, colormap=cmap)

            # Deterministic, guaranteed split distribution
            val_cutoff = int(samples_per_class * 0.70)
            test_cutoff = int(samples_per_class * 0.85)

            if idx < val_cutoff:
                split = "train"
            elif idx < test_cutoff:
                split = "val"
            else:
                split = "test"

            count_by_split[split] += 1
            filename = f"thermal_{cls_name.lower().replace(' ', '_')}_{idx:03d}.png"
            dest_file = output_dir / split / cls_name / filename
            cv2.imwrite(str(dest_file), img)

            # Save 2 samples per class to samples_dir for easy testing in frontend
            if idx < 2:
                sample_file = samples_dir / f"sample_{cls_name.lower().replace(' ', '_')}_{idx+1}.png"
                cv2.imwrite(str(sample_file), img)

    print(f"Generated dataset in {output_dir}: {count_by_split}")
    print(f"Saved quick-test thermal samples to {samples_dir}")


if __name__ == "__main__":
    import sys
    base_data = Path(__file__).resolve().parent.parent.parent / "data"
    generate_benchmark_dataset(base_data, samples_per_class=30)
