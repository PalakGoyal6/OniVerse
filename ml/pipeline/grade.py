"""Explainable grading engine driven entirely by config/grading_rules.json."""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional


class GradingEngine:
    def __init__(self, config_path: Optional[str] = None):
        root = Path(__file__).resolve().parents[2]
        if config_path is None:
            config_path = str(root / "config" / "grading_rules.json")

        self.config_path = config_path
        with open(config_path, "r", encoding="utf-8") as f:
            self.rules = json.load(f)

        conf_file = root / "config" / "confidence_thresholds.json"
        self.conf_thresholds = {}
        if conf_file.exists():
            try:
                with open(conf_file, "r", encoding="utf-8") as f:
                    c_data = json.load(f)
                    self.conf_thresholds = c_data.get("confidence_thresholds", {})
            except Exception:
                pass

        self.version = self.rules.get("version", "1.0.0")
        self.grades_config = self.rules.get("grades", {})
        self.defect_labels = self.rules.get("defect_labels", {})
        self.lot_tolerances = self.rules.get("lot_tolerances", {})

    def grade_single_onion(self, onion: Dict[str, Any]) -> Dict[str, Any]:
        """
        Grades a single onion instance based on AGMARK size standards and defect classification.
        Assigns physical grade (GRADE_A, URS, REJECTED, or PENDING_MEASUREMENT) and routing status (AUTO vs NEEDS_MANUAL_CHECK).
        """
        raw_dia = onion.get("diameter_mm")
        has_size = raw_dia is not None and float(raw_dia) > 0.0
        diameter = float(raw_dia) if has_size else None

        raw_class_name = str(onion.get("class_name", "Healthy"))
        class_name_lower = raw_class_name.lower().strip()
        confidence = float(onion.get("confidence", 1.0))
        view_conflict = bool(onion.get("view_conflict", False))
        marker_detected = bool(onion.get("marker_detected", has_size))

        reasons = []

        # 1. Determine physical AGMARK grade based on defect and real measured size
        if class_name_lower in ["rotten", "mould", "mold"]:
            physical_grade = "REJECTED"
            defect_desc = self.defect_labels.get(raw_class_name, "Rot / Fungal Mould")
            size_txt = f" ({diameter:.1f}mm)" if has_size else " (Size unmeasured)"
            reasons.append(f"Severe defect: {defect_desc}{size_txt}")
        elif class_name_lower in ["damaged", "mechanical_damage"]:
            physical_grade = "REJECTED"
            defect_desc = self.defect_labels.get(raw_class_name, "Mechanical Damage")
            size_txt = f" ({diameter:.1f}mm)" if has_size else " (Size unmeasured)"
            reasons.append(f"Defect: {defect_desc}{size_txt}")
        elif class_name_lower in ["sprouted", "sprouting"]:
            physical_grade = "REJECTED"
            defect_desc = self.defect_labels.get(raw_class_name, "Apical Sprouting")
            size_txt = f" ({diameter:.1f}mm)" if has_size else " (Size unmeasured)"
            reasons.append(f"Defect: {defect_desc}{size_txt}")
        elif not has_size:
            physical_grade = "PENDING_MEASUREMENT"
            reasons.append("Sound bulb. Size not measured (no ArUco reference marker detected in frame)")
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
        # Class-specific confidence threshold (defaults to 0.60 if unspecified)
        class_key = "healthy" if class_name_lower in ["healthy", "onions-quality-analysis"] else (
            "mechanical_damage" if class_name_lower in ["damaged", "mechanical_damage"] else (
                "sprouting" if class_name_lower in ["sprouted", "sprouting"] else class_name_lower
            )
        )
        min_auto_conf = float(self.conf_thresholds.get(class_key, 0.60))

        # Confidence routing applies to ALL classes (defects AND healthy)
        is_confident = confidence >= min_auto_conf
        has_required_measurements = has_size or (physical_grade == "REJECTED" and class_name_lower != "healthy")
        is_auto = is_confident and (not view_conflict) and has_required_measurements
        routing_status = "AUTO" if is_auto else "NEEDS_MANUAL_CHECK"

        if not is_auto:
            if not is_confident:
                reasons.append(f"Provisional / Pending check: AI confidence for {raw_class_name} ({confidence*100:.1f}%) < {min_auto_conf*100:.0f}% threshold")
            if view_conflict:
                reasons.append("Provisional / Pending check: Multi-view conflict")
            if not has_size and physical_grade != "REJECTED":
                reasons.append("Provisional / Pending check: ArUco marker missing, size measurement required")

        raw_wt = onion.get("weight_g")
        est_weight = round(float(raw_wt), 1) if (raw_wt is not None and float(raw_wt) > 0.0 and has_size) else None

        return {
            "onion_id": onion.get("onion_id", 1),
            "grade": physical_grade,
            "status": routing_status,
            "is_auto": is_auto,
            "class_name": raw_class_name,
            "class_display": self.defect_labels.get(raw_class_name, raw_class_name),
            "diameter_mm": round(diameter, 1) if diameter is not None else None,
            "length_mm": round(float(onion.get("length_mm")), 1) if (onion.get("length_mm") is not None and has_size) else None,
            "width_mm": round(float(onion.get("width_mm")), 1) if (onion.get("width_mm") is not None and has_size) else None,
            "weight_g": est_weight,
            "confidence": round(confidence, 3),
            "reasons": reasons,
            "fused_views": onion.get("fused_views", ["front"]),
            "centroid_mm": onion.get("centroid_mm", [0.0, 0.0]),
            "marker_detected": marker_detected,
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
                "auto_graded_count": 0,
                "needs_check_count": 0,
                "summary_status_text": "No onions detected — check photo and retake",
                "total_weight_g": 0.0,
                "grade_breakdown_count": {"GRADE_A": 0, "URS": 0, "REJECTED": 0},
                "grade_breakdown_weight": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0},
                "percentages_by_count": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0},
                "percentages_by_weight": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0},
                "provisional_percentages": {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0, "PENDING_MEASUREMENT": 0.0},
                "defect_breakdown_count": {},
                "size_distribution": {"<35mm": 0, "35-45mm": 0, "45-60mm": 0, "60-75mm": 0, ">75mm": 0, "unmeasured": 0},
                "average_diameter_mm": None,
                "lot_verdict": "NO_ONIONS_DETECTED",
                "onions": [],
            }

        graded_onions = [self.grade_single_onion(o) for o in onions]

        total_count = len(graded_onions)
        auto_onions = [o for o in graded_onions if o["status"] == "AUTO"]
        auto_count = len(auto_onions)
        needs_check_count = total_count - auto_count

        total_weight_g = sum(o["weight_g"] for o in graded_onions if o["weight_g"] is not None)

        # Confirmed counts strictly over AUTO + officer confirmed
        confirmed_counts = {"GRADE_A": 0, "URS": 0, "REJECTED": 0}
        confirmed_weights = {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0}

        for o in auto_onions:
            g = o["grade"]
            w = o["weight_g"] or 0.0
            if g in confirmed_counts:
                confirmed_counts[g] += 1
                confirmed_weights[g] += w

        # Provisional breakdown across all onions
        provisional_counts = {"GRADE_A": 0, "URS": 0, "REJECTED": 0, "PENDING_MEASUREMENT": 0}
        defect_counts: Dict[str, int] = {}
        size_bins = {"<35mm": 0, "35-45mm": 0, "45-60mm": 0, "60-75mm": 0, ">75mm": 0, "unmeasured": 0}

        for o in graded_onions:
            g = o["grade"]
            d = o["diameter_mm"]
            c = o["class_name"]

            if g in provisional_counts:
                provisional_counts[g] += 1
            defect_counts[c] = defect_counts.get(c, 0) + 1

            if d is None:
                size_bins["unmeasured"] += 1
            elif d < 35.0:
                size_bins["<35mm"] += 1
            elif d < 45.0:
                size_bins["35-45mm"] += 1
            elif d < 60.0:
                size_bins["45-60mm"] += 1
            elif d < 75.0:
                size_bins["60-75mm"] += 1
            else:
                size_bins[">75mm"] += 1

        # Percentages only count AUTO onions
        if auto_count > 0:
            pct_count = {
                "GRADE_A": round((confirmed_counts["GRADE_A"] / auto_count) * 100.0, 1),
                "URS": round((confirmed_counts["URS"] / auto_count) * 100.0, 1),
                "REJECTED": round((confirmed_counts["REJECTED"] / auto_count) * 100.0, 1),
            }
            auto_weight_total = sum(confirmed_weights.values())
            pct_weight = {
                k: round((v / auto_weight_total) * 100.0, 1) if auto_weight_total > 0 else 0.0
                for k, v in confirmed_weights.items()
            }
        else:
            pct_count = {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0}
            pct_weight = {"GRADE_A": 0.0, "URS": 0.0, "REJECTED": 0.0}

        provisional_pct = {
            k: round((v / total_count) * 100.0, 1) for k, v in provisional_counts.items()
        }

        measured_dias = [o["diameter_mm"] for o in graded_onions if o["diameter_mm"] is not None]
        avg_diameter = round(sum(measured_dias) / len(measured_dias), 1) if len(measured_dias) > 0 else None

        # Rejection & URS thresholds loaded dynamically from grading_rules.json
        max_rejected_pct = float(self.lot_tolerances.get("max_rejected_pct_for_lot_acceptance", 15.0))
        max_urs_pct = float(self.lot_tolerances.get("max_urs_pct_for_grade_a_lot", 25.0))

        if total_count == 0:
            lot_verdict = "NO_ONIONS_DETECTED"
        elif auto_count == 0:
            lot_verdict = f"PENDING_REVIEW ({needs_check_count} pending review)"
        else:
            if pct_count["REJECTED"] > max_rejected_pct:
                base_verdict = "REJECTED"
            elif pct_count["URS"] > max_urs_pct:
                base_verdict = "URS"
            else:
                base_verdict = "GRADE_A"

            if needs_check_count > 0:
                lot_verdict = f"{base_verdict} (provisional — {needs_check_count} pending review)"
            else:
                lot_verdict = base_verdict

        summary_status = f"{auto_count} of {total_count} auto-graded • {needs_check_count} need your check"

        return {
            "rules_version": self.version,
            "total_count": total_count,
            "auto_graded_count": auto_count,
            "needs_check_count": needs_check_count,
            "summary_status_text": summary_status,
            "total_weight_g": round(total_weight_g, 1),
            "sample_weight_kg": sample_weight_kg,
            "total_lot_weight_kg": total_lot_weight_kg,
            "grade_breakdown_count": confirmed_counts,
            "grade_breakdown_weight": {k: round(v, 1) for k, v in confirmed_weights.items()},
            "percentages_by_count": pct_count,
            "percentages_by_weight": pct_weight,
            "provisional_percentages": provisional_pct,
            "defect_breakdown_count": defect_counts,
            "size_distribution": size_bins,
            "average_diameter_mm": avg_diameter,
            "lot_verdict": lot_verdict,
            "onions": graded_onions,
        }
