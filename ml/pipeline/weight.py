"""Ellipsoidal volume calculation and weight estimation module."""

import math
from typing import List, Dict, Any, Optional


class WeightEstimator:
    def __init__(
        self,
        density_k: float = 0.000982,
        power_a: float = 0.00115,
        power_b: float = 0.988,
        model_type: str = "linear_ellipsoid",
    ):
        """
        density_k: empirical density constant (g/mm^3) for linear ellipsoid formula
        V = (pi / 6) * length_mm * width_mm^2
        weight_g = density_k * V
        """
        self.density_k = density_k
        self.power_a = power_a
        self.power_b = power_b
        self.model_type = model_type

    def estimate_single_weight(self, length_mm: float, width_mm: float) -> float:
        """Calculate estimated weight in grams from dimensions in mm."""
        if length_mm <= 0 or width_mm <= 0:
            return 0.0

        # Ellipsoidal volume in mm^3
        volume_mm3 = (math.pi / 6.0) * length_mm * (width_mm ** 2)

        if self.model_type == "power_model":
            weight = self.power_a * (volume_mm3 ** self.power_b)
        else:
            weight = self.density_k * volume_mm3

        return max(0.1, float(weight))

    def calibrate_sample_weights(
        self,
        estimated_weights: List[float],
        actual_sample_weight_kg: Optional[float] = None,
    ) -> List[float]:
        """
        If inspector provided actual sample weight from physical weighing scale,
        scale all per-onion weights proportionally so their sum equals actual sample weight.
        """
        if not estimated_weights:
            return []

        total_est_g = sum(estimated_weights)
        if actual_sample_weight_kg is None or actual_sample_weight_kg <= 0 or total_est_g <= 0:
            return [round(w, 2) for w in estimated_weights]

        actual_sample_g = actual_sample_weight_kg * 1000.0
        scaling_ratio = actual_sample_g / total_est_g

        return [round(w * scaling_ratio, 2) for w in estimated_weights]
