"""Two-view (front/back) matching and defect fusion using Hungarian algorithm."""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np

# Defect severity hierarchy (worst to least):
# Rotten > Damaged > Sprouted > Onions-Quality-Analysis > Healthy
DEFECT_PRIORITY = {
    "rotten": 5,
    "damaged": 4,
    "sprouted": 3,
    "onions-quality-analysis": 2,
    "healthy": 1,
}


def _worst_class(c1: str, c2: str) -> str:
    p1 = DEFECT_PRIORITY.get(c1.lower().strip(), 0)
    p2 = DEFECT_PRIORITY.get(c2.lower().strip(), 0)
    return c1 if p1 >= p2 else c2


def _hungarian_matching(cost_matrix: np.ndarray) -> Tuple[List[int], List[int]]:
    """Solve linear sum assignment problem with fallback."""
    try:
        from scipy.optimize import linear_sum_assignment
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        return list(row_ind), list(col_ind)
    except ImportError:
        # Greedy fallback matching
        rows, cols = cost_matrix.shape
        matched_r, matched_c = [], []
        used_cols = set()
        for r in range(rows):
            best_c = -1
            best_cost = float("inf")
            for c in range(cols):
                if c not in used_cols and cost_matrix[r, c] < best_cost:
                    best_cost = cost_matrix[r, c]
                    best_c = c
            if best_c != -1:
                matched_r.append(r)
                matched_c.append(best_c)
                used_cols.add(best_c)
        return matched_r, matched_c


class TwoViewMatcher:
    def __init__(
        self,
        max_centroid_dist_mm: float = 35.0,
        max_size_diff_ratio: float = 0.35,
    ):
        self.max_centroid_dist_mm = max_centroid_dist_mm
        self.max_size_diff_ratio = max_size_diff_ratio

    def fuse_views(
        self,
        front_onions: List[Dict[str, Any]],
        back_onions: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        if not back_onions:
            fused = []
            for i, f in enumerate(front_onions):
                item = dict(f)
                item["onion_id"] = i + 1
                item["fused_views"] = ["front"]
                item["explanation_notes"] = ["Single view (front only)"]
                fused.append(item)
            return fused

        N_f = len(front_onions)
        N_b = len(back_onions)

        cost_matrix = np.zeros((N_f, N_b), dtype=np.float32)

        for i in range(N_f):
            c_f = np.array(front_onions[i]["centroid_mm"])
            d_f = front_onions[i]["diameter_mm"]
            for j in range(N_b):
                c_b = np.array(back_onions[j]["centroid_mm"])
                d_b = back_onions[j]["diameter_mm"]

                dist = np.linalg.norm(c_f - c_b)
                size_diff = abs(d_f - d_b) / max(1.0, (d_f + d_b) / 2.0)
                cost = dist + (size_diff * 40.0)
                cost_matrix[i, j] = cost

        row_ind, col_ind = _hungarian_matching(cost_matrix)

        fused_results: List[Dict[str, Any]] = []
        matched_back_indices = set()

        for r, c in zip(row_ind, col_ind):
            cost = cost_matrix[r, c]
            dist = np.linalg.norm(np.array(front_onions[r]["centroid_mm"]) - np.array(back_onions[c]["centroid_mm"]))
            size_diff = abs(front_onions[r]["diameter_mm"] - back_onions[c]["diameter_mm"]) / max(
                1.0, (front_onions[r]["diameter_mm"] + back_onions[c]["diameter_mm"]) / 2.0
            )

            if dist <= self.max_centroid_dist_mm and size_diff <= self.max_size_diff_ratio:
                matched_back_indices.add(c)
                f_item = front_onions[r]
                b_item = back_onions[c]

                worst_cls = _worst_class(f_item["class_name"], b_item["class_name"])
                avg_diameter = (f_item["diameter_mm"] + b_item["diameter_mm"]) / 2.0
                avg_length = (f_item.get("length_mm", f_item["diameter_mm"]) + b_item.get("length_mm", b_item["diameter_mm"])) / 2.0
                avg_width = (f_item.get("width_mm", f_item["diameter_mm"]) + b_item.get("width_mm", b_item["diameter_mm"])) / 2.0
                avg_conf = (f_item["confidence"] + b_item["confidence"]) / 2.0

                view_conflict = f_item["class_name"].lower() != b_item["class_name"].lower()
                notes = []
                if view_conflict:
                    notes.append(f"Front '{f_item['class_name']}' vs Back '{b_item['class_name']}' -> worst applied: '{worst_cls}'")
                else:
                    notes.append("Front and Back views fully agree")

                fused_results.append({
                    "onion_id": len(fused_results) + 1,
                    "class_name": worst_cls,
                    "confidence": round(avg_conf, 4),
                    "diameter_mm": round(avg_diameter, 2),
                    "length_mm": round(avg_length, 2),
                    "width_mm": round(avg_width, 2),
                    "centroid_mm": [
                        round((f_item["centroid_mm"][0] + b_item["centroid_mm"][0]) / 2.0, 2),
                        round((f_item["centroid_mm"][1] + b_item["centroid_mm"][1]) / 2.0, 2),
                    ],
                    "fused_views": ["front", "back"],
                    "view_conflict": view_conflict,
                    "front_class": f_item["class_name"],
                    "back_class": b_item["class_name"],
                    "explanation_notes": notes,
                })
            else:
                f_item = dict(front_onions[r])
                f_item["onion_id"] = len(fused_results) + 1
                f_item["fused_views"] = ["front"]
                f_item["view_conflict"] = False
                f_item["explanation_notes"] = ["Single view (no back view match)"]
                fused_results.append(f_item)

        for j in range(N_b):
            if j not in matched_back_indices:
                b_item = dict(back_onions[j])
                b_item["onion_id"] = len(fused_results) + 1
                b_item["fused_views"] = ["back"]
                b_item["view_conflict"] = False
                b_item["explanation_notes"] = ["Single view (no front view match)"]
                fused_results.append(b_item)

        return fused_results
