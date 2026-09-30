"""Explainable grading engine driven entirely by config/grading_rules.json."""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional


class GradingEngine:
    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            root = Path(__file__).resolve().parents[2]
            config_path = str(root / "config" / "grading_rules.json")

        self.config_path = config_path
        with open(config_path, "r", encoding="utf-8") as f:
            self.rules = json.load(f)

        self.version = self.rules.get("version", "1.0.0")
        self.grades_config = self.rules.get("grades", {})
        self.defect_labels = self.rules.get("defect_labels", {})
        self.lot_tolerances = self.rules.get("lot_tolerances", {})

    def grade_single_onion(self, onion: Dict[str, Any]) -> Dict[str, Any]:
        """
        Grades a single onion instance based on AGMARK size standards and defect classification.
        Assigns physical grade (GRADE_A, URS, REJECTED) and selective prediction routing (AUTO vs NEEDS_MANUAL_CHECK).
        """
        diameter = float(onion.get("diameter_mm", 0.0))
        raw_class_name = str(onion.get("class_name", "Healthy"))
        class_name_lower = raw_class_name.lower().strip()
        confidence = float(onion.get("confidence", 1.0))
        view_conflict = bool(onion.get("view_conflict", False))

        reasons = []

        # 1. Determine physical AGMARK grade based on defect and size
        if class_name_lower in ["rotten", "damaged", "sprouted", "mould"]:
            physical_grade = "REJECTED"
            defect_desc = self.defect_labels.get(raw_class_name, raw_class_name)
            reasons.append(f"Severe defect: {defect_desc}")
        elif diameter < 35.0:
            physical_grade = "REJECTED"
            reasons.append(f"Undersized for procurement ({diameter:.1f}mm < 35.0mm cutoff)")
        elif diameter > 95.0:
            physical_grade = "REJECTED"
            reasons.append(f"Oversized bulb ({diameter:.1f}mm > 95.0mm cutoff)")
        elif 35.0 <= diameter < 45.0:
            physical_grade = "URS"
            reasons.append(f"Under-sized bulb ({diameter:.1f}mm in URS range 35–44.9mm)")
        else:
            physical_grade = "GRADE_A"
            reasons.append(f"Standard Grade A size ({diameter:.1f}mm) and sound quality")

        # 2. Determine selective prediction routing status (AUTO vs NEEDS_MANUAL_CHECK)
        min_auto_conf = 0.50
        is_auto = (confidence >= min_auto_conf) and (not view_conflict)
        routing_status = "AUTO" if is_auto else "NEEDS_MANUAL_CHECK"

        if not is_auto:
            if confidence < min_auto_conf:
                reasons.append(f"Flagged for review: AI confidence ({confidence*100:.1f}%) < {min_auto_conf*100:.0f}%")
            if view_conflict:
                reasons.append("Flagged for review: Multi-view conflict")

        return {
            "onion_id": onion.get("onion_id", 1),
            "grade": physical_grade,
            "status": routing_status,
            "class_name": raw_class_name,
            "class_display": self.defect_labels.get(raw_class_name, raw_class_name),
            "diameter_mm": round(diameter, 1),
            "length_mm": round(float(onion.get("length_mm", diameter)), 1),
            "width_mm": round(float(onion.get("width_mm", diameter)), 1),
            "weight_g": round(float(onion.get("weight_g", 0.0)), 1),
            "confidence": round(confidence, 3),
            "reasons": reasons,
            "fused_views": onion.get("fused_views", ["front"]),
            "centroid_mm": onion.get("centroid_mm", [0.0, 0.0]),
        }

    def grade_lot(
        self,
        onions: List[Dict[str, Any]],
        sample_weight_kg: Optional[float] = None,
        total_lot_weight_kg: Optional[float] = None,
    ) -> Dict[str, Any]:
        if not onions:
            return {
                "rules_version": self.version,
                "total_count": 0,
                "total_weight_g": 0.0,
                "grade_breakdown_count": {"GRADE_A": 0, "URS": 0, "REJECTED": 0, "NEEDS_MANUAL_CHECK": 0},
                "grade_breakdown_weight": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0, "NEEDS_MANUAL_CHECK": 0.0},
                "percentages_by_count": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0, "NEEDS_MANUAL_CHECK": 0.0},
                "percentages_by_weight": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0, "NEEDS_MANUAL_CHECK": 0.0},
                "defect_breakdown_count": {},
                "size_distribution": {"<35mm": 0, "35-45mm": 0, "45-60mm": 0, "60-75mm": 0, ">75mm": 0},
                "average_diameter_mm": 0.0,
                "lot_verdict": "REJECTED",
                "onions": [],
            }

        graded_onions = [self.grade_single_onion(o) for o in onions]

        total_count = len(graded_onions)
        total_weight_g = sum(o["weight_g"] for o in graded_onions)

        counts = {"GRADE_A": 0, "URS": 0, "REJECTED": 0, "NEEDS_MANUAL_CHECK": 0}
        weights = {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0, "NEEDS_MANUAL_CHECK": 0.0}
        defect_counts: Dict[str, int] = {}
        size_bins = {"<35mm": 0, "35-45mm": 0, "45-60mm": 0, "60-75mm": 0, ">75mm": 0}

        auto_count = 0
        for o in graded_onions:
            g = o["grade"]
            w = o["weight_g"]
            d = o["diameter_mm"]
            c = o["class_name"]
            st = o.get("status", "AUTO")

            counts[g] = counts.get(g, 0) + 1
            weights[g] = weights.get(g, 0.0) + w

            if st == "AUTO":
                auto_count += 1
            else:
                counts["NEEDS_MANUAL_CHECK"] = counts.get("NEEDS_MANUAL_CHECK", 0) + 1

            defect_counts[c] = defect_counts.get(c, 0) + 1

            if d < 35.0:
                size_bins["<35mm"] += 1
            elif d < 45.0:
                size_bins["35-45mm"] += 1
            elif d < 60.0:
                size_bins["45-60mm"] += 1
            elif d < 75.0:
                size_bins["60-75mm"] += 1
            else:
                size_bins[">75mm"] += 1

        pct_count = {
            "GRADE_A": round((counts["GRADE_A"] / total_count) * 100.0, 1),
            "URS": round((counts["URS"] / total_count) * 100.0, 1),
            "REJECTED": round((counts["REJECTED"] / total_count) * 100.0, 1),
            "NEEDS_MANUAL_CHECK": round((counts["NEEDS_MANUAL_CHECK"] / total_count) * 100.0, 1),
        }
        pct_weight = {
            k: round((v / total_weight_g) * 100.0, 1) if total_weight_g > 0 else 0.0
            for k, v in weights.items()
        }

        avg_diameter = round(sum(o["diameter_mm"] for o in graded_onions) / total_count, 1)

        if pct_count["REJECTED"] > 15.0:
            lot_verdict = "REJECTED"
        elif pct_count["URS"] > 25.0:
            lot_verdict = "URS_LOT"
        else:
            lot_verdict = "GRADE_A_LOT"

        return {
            "rules_version": self.version,
            "total_count": total_count,
            "auto_graded_count": auto_count,
            "needs_check_count": total_count - auto_count,
            "total_weight_g": round(total_weight_g, 1),
            "sample_weight_kg": sample_weight_kg,
            "total_lot_weight_kg": total_lot_weight_kg,
            "grade_breakdown_count": counts,
            "grade_breakdown_weight": {k: round(v, 1) for k, v in weights.items()},
            "percentages_by_count": pct_count,
            "percentages_by_weight": pct_weight,
            "defect_breakdown_count": defect_counts,
            "size_distribution": size_bins,
            "average_diameter_mm": avg_diameter,
            "lot_verdict": lot_verdict,
            "onions": graded_onions,
        }
