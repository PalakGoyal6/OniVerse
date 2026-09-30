"""Full reference execution pipeline for processing front and back images into a graded lot."""

import json
from pathlib import Path
import sys
from typing import Dict, Any, Optional
import numpy as np
import cv2

try:
    from .marker import MarkerDetector
    from .segment import YOLOSegmentor
    from .measure import SizeMeasurer
    from .weight import WeightEstimator
    from .match_views import TwoViewMatcher
    from .grade import GradingEngine
except ImportError:
    # Handle direct script execution
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from ml.pipeline.marker import MarkerDetector
    from ml.pipeline.segment import YOLOSegmentor
    from ml.pipeline.measure import SizeMeasurer
    from ml.pipeline.weight import WeightEstimator
    from ml.pipeline.match_views import TwoViewMatcher
    from ml.pipeline.grade import GradingEngine


class OnionLotProcessor:
    def __init__(self, config_path: Optional[str] = None, model_path: Optional[str] = None):
        if config_path is None:
            root = Path(__file__).resolve().parents[2]
            config_path = str(root / "config" / "grading_rules.json")

        with open(config_path, "r", encoding="utf-8") as f:
            rules = json.load(f)

        m_conf = rules.get("marker_config", {})
        w_conf = rules.get("weight_model", {})
        f_conf = rules.get("two_view_fusion", {})

        self.marker_detector = MarkerDetector(
            dictionary_name=m_conf.get("dictionary", "DICT_4X4_50"),
            marker_id=m_conf.get("marker_id", 0),
            physical_size_mm=m_conf.get("physical_size_mm", 50.0),
            height_correction_factor=m_conf.get("height_correction_factor", 0.965),
        )

        self.segmentor = YOLOSegmentor(model_path=model_path)
        self.measurer = SizeMeasurer(height_correction_factor=m_conf.get("height_correction_factor", 0.965))
        self.weight_estimator = WeightEstimator(
            density_k=w_conf.get("density_k", 0.000982),
            power_a=w_conf.get("power_model_a", 0.00115),
            power_b=w_conf.get("power_model_b", 0.988),
            model_type=w_conf.get("selected_model", "linear_ellipsoid"),
        )
        self.matcher = TwoViewMatcher(
            max_centroid_dist_mm=f_conf.get("max_centroid_distance_mm", 35.0),
            max_size_diff_ratio=f_conf.get("max_size_difference_ratio", 0.35),
        )
        self.grading_engine = GradingEngine(config_path=config_path)

    def _process_single_view(self, image: np.ndarray, view_name: str) -> Dict[str, Any]:
        """Runs marker detection, homography, segmentation and sizing on one photo."""
        quality = self.marker_detector.validate_camera_quality(image)
        H_px_to_mm, marker_corners, marker_meta = self.marker_detector.detect_and_compute_homography(image)

        if H_px_to_mm is None:
            # Fallback when marker is missing or obstructed
            return {
                "view": view_name,
                "camera_quality": quality,
                "marker_detected": False,
                "onions": [],
                "error": "Marker not found",
            }

        segments = self.segmentor.infer(image)
        onions_raw = []

        for idx, seg in enumerate(segments):
            measurement = self.measurer.measure_contour(seg.contour_px, H_px_to_mm)
            if measurement is None:
                continue

            est_weight = self.weight_estimator.estimate_single_weight(
                measurement.length_mm, measurement.width_mm
            )

            onions_raw.append({
                "view_idx": idx + 1,
                "class_name": seg.class_name,
                "confidence": seg.confidence,
                "diameter_mm": measurement.diameter_mm,
                "length_mm": measurement.length_mm,
                "width_mm": measurement.width_mm,
                "area_mm2": measurement.area_mm2,
                "centroid_mm": measurement.centroid_mm.tolist(),
                "weight_g": est_weight,
                "bbox_xyxy": seg.bbox_xyxy,
            })

        return {
            "view": view_name,
            "camera_quality": quality,
            "marker_detected": True,
            "marker_meta": marker_meta,
            "onions": onions_raw,
        }

    def process_lot(
        self,
        front_image: np.ndarray,
        back_image: Optional[np.ndarray] = None,
        sample_weight_kg: Optional[float] = None,
        total_lot_weight_kg: Optional[float] = None,
    ) -> Dict[str, Any]:
        """End-to-end multi-view analysis and grading."""
        front_res = self._process_single_view(front_image, "front")

        back_res = None
        if back_image is not None and back_image.size > 0:
            back_res = self._process_single_view(back_image, "back")

        # Fuse front and back views
        back_onions = back_res["onions"] if back_res and back_res.get("marker_detected") else []
        fused_onions = self.matcher.fuse_views(front_res["onions"], back_onions)

        # Apply proportional sample weight scaling if sample weight provided
        raw_weights = [
            self.weight_estimator.estimate_single_weight(o["length_mm"], o["width_mm"])
            for o in fused_onions
        ]
        calibrated_weights = self.weight_estimator.calibrate_sample_weights(
            raw_weights, sample_weight_kg
        )

        for i, o in enumerate(fused_onions):
            o["weight_g"] = calibrated_weights[i] if i < len(calibrated_weights) else raw_weights[i]

        # Grade the lot
        graded_lot = self.grading_engine.grade_lot(
            fused_onions,
            sample_weight_kg=sample_weight_kg,
            total_lot_weight_kg=total_lot_weight_kg,
        )

        return {
            "front_view_meta": {
                "quality": front_res.get("camera_quality"),
                "marker_detected": front_res.get("marker_detected"),
            },
            "back_view_meta": {
                "quality": back_res.get("camera_quality") if back_res else None,
                "marker_detected": back_res.get("marker_detected") if back_res else False,
            } if back_res else None,
            "lot_summary": graded_lot,
        }


def main():
    """Command line entrypoint for reference pipeline test."""
    print("AI Onion Quality Grading - Reference Pipeline")
    processor = OnionLotProcessor()
    # Test synthetic image
    synthetic_img = np.ones((720, 1280, 3), dtype=np.uint8) * 220
    # Draw simulated marker
    cv2.rectangle(synthetic_img, (100, 100), (250, 250), (0, 0, 0), -1)
    res = processor.process_lot(synthetic_img)
    print("Sample Run Result:", json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
