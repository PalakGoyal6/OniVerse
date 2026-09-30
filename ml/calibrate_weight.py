"""Weight Model Calibration Tool.

Fits both Linear Ellipsoid (density_k) and Power Law models (a * V^b) from ground truth
calibrated CSV datasets (ruler/caliper measurements + precision kitchen scale weight).
"""

import argparse
import math
import numpy as np
import pandas as pd
from typing import Dict, Any


def fit_weight_models(csv_path: str) -> Dict[str, Any]:
    """
    Expects CSV with columns: ['length_mm', 'width_mm', 'actual_weight_g']
    """
    df = pd.read_csv(csv_path)
    required_cols = {"length_mm", "width_mm", "actual_weight_g"}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"CSV must contain columns: {required_cols}")

    # Volume in mm^3
    volumes = (math.pi / 6.0) * df["length_mm"] * (df["width_mm"] ** 2)
    weights = df["actual_weight_g"].values

    # 1. Linear Model: weight = k * volume  (fit via least squares with 0 intercept)
    k_density = float(np.sum(volumes * weights) / np.sum(volumes ** 2))
    pred_linear = k_density * volumes
    mae_linear = float(np.mean(np.abs(pred_linear - weights)))
    r2_linear = float(1 - (np.sum((weights - pred_linear) ** 2) / np.sum((weights - np.mean(weights)) ** 2)))

    # 2. Power Model: weight = a * (volume^b) -> log(weight) = log(a) + b * log(volume)
    log_v = np.log(volumes)
    log_w = np.log(weights)
    poly = np.polyfit(log_v, log_w, 1)
    b_power = float(poly[0])
    a_power = float(np.exp(poly[1]))
    pred_power = a_power * (volumes ** b_power)
    mae_power = float(np.mean(np.abs(pred_power - weights)))
    r2_power = float(1 - (np.sum((weights - pred_power) ** 2) / np.sum((weights - np.mean(weights)) ** 2)))

    selected = "linear_ellipsoid" if mae_linear <= mae_power else "power_model"

    return {
        "sample_count": len(df),
        "linear_ellipsoid": {
            "density_k": round(k_density, 8),
            "mae_g": round(mae_linear, 2),
            "r2_score": round(r2_linear, 4),
        },
        "power_model": {
            "a": round(a_power, 8),
            "b": round(b_power, 4),
            "mae_g": round(mae_power, 2),
            "r2_score": round(r2_power, 4),
        },
        "selected_model": selected,
    }


def generate_sample_calibration_csv(output_path: str, count: int = 150):
    """Generates synthetic ground truth calibration data for initialization and testing."""
    np.random.seed(42)
    # Diameters between 30mm and 85mm
    diameters = np.random.normal(55, 12, count).clip(28, 92)
    # Lengths with aspect ratios between 0.85 and 1.25
    aspect_ratios = np.random.uniform(0.9, 1.15, count)
    lengths = diameters * aspect_ratios

    # True onion density ~0.98 g/cm^3 (0.00098 g/mm^3) + slight individual biological variation
    true_density = 0.000980 + np.random.normal(0, 0.00003, count)
    volume_mm3 = (math.pi / 6.0) * lengths * (diameters ** 2)
    weights = volume_mm3 * true_density

    df = pd.DataFrame({
        "sample_id": [f"ONION_CALIB_{i+1:03d}" for i in range(count)],
        "length_mm": np.round(lengths, 2),
        "width_mm": np.round(diameters, 2),
        "actual_weight_g": np.round(weights, 2),
    })
    df.to_csv(output_path, index=False)
    print(f"Generated sample calibration CSV with {count} rows at: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=str, default="ml/data/calibration/weights.csv")
    parser.add_argument("--generate", action="store_true")
    args = parser.parse_args()

    import os
    os.makedirs("ml/data/calibration", exist_ok=True)

    if args.generate or not os.path.exists(args.csv):
        generate_sample_calibration_csv(args.csv)

    results = fit_weight_models(args.csv)
    print("\n=== Weight Calibration Results ===")
    import json
    print(json.dumps(results, indent=2))
