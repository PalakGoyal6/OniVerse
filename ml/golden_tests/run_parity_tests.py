"""Golden Test Parity Runner for ML Grading and View Fusion."""

import json
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root_dir))

from ml.pipeline.grade import GradingEngine
from ml.pipeline.match_views import TwoViewMatcher


def run_golden_tests() -> bool:
    golden_path = root_dir / "ml" / "golden_tests" / "golden_lots.json"
    with open(golden_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    engine = GradingEngine()
    matcher = TwoViewMatcher()
    all_passed = True

    print("========================================")
    print("RUNNING ML GOLDEN PARITY TESTS")
    print("========================================\n")

    for test in data.get("golden_lots", []):
        lot_id = test["lot_id"]
        print(f"--> Testing [{lot_id}]: {test['description']}")

        # Case A: Direct grading test
        if "input_onions" in test:
            graded = engine.grade_lot(test["input_onions"])
            exp = test["expected_output"]

            # Verify lot counts
            if "grade_breakdown_count" in exp:
                for grade_key, exp_count in exp["grade_breakdown_count"].items():
                    act_count = graded["grade_breakdown_count"].get(grade_key, 0)
                    if act_count != exp_count:
                        print(f"  [FAIL] Count mismatch for {grade_key}: expected {exp_count}, got {act_count}")
                        all_passed = False
                    else:
                        print(f"  [PASS] Count for {grade_key} == {act_count}")

            # Verify per-onion grades
            if "per_onion_grades" in exp:
                for exp_o in exp["per_onion_grades"]:
                    o_id = exp_o["onion_id"]
                    matching = next((o for o in graded["onions"] if o["onion_id"] == o_id), None)
                    if matching is None:
                        print(f"  [FAIL] Missing onion_id {o_id}")
                        all_passed = False
                    elif matching["grade"] != exp_o["grade"]:
                        print(f"  [FAIL] Onion {o_id} grade mismatch: expected {exp_o['grade']}, got {matching['grade']}")
                        all_passed = False
                    else:
                        print(f"  [PASS] Onion {o_id} assigned grade {matching['grade']} ({matching['reasons'][0]})")

        # Case B: Two-view fusion test
        if "front_view" in test and "back_view" in test:
            fused = matcher.fuse_views(test["front_view"], test["back_view"])
            graded = engine.grade_lot(fused)
            exp_list = test["expected_fused_grades"]

            for exp_item in exp_list:
                o_id = exp_item["onion_id"]
                matching = next((o for o in graded["onions"] if o["onion_id"] == o_id), None)
                if matching is None:
                    print(f"  [FAIL] Missing fused onion_id {o_id}")
                    all_passed = False
                else:
                    if matching["class_name"] != exp_item["fused_class"]:
                        print(f"  [FAIL] Fused class mismatch for onion {o_id}: expected {exp_item['fused_class']}, got {matching['class_name']}")
                        all_passed = False
                    if matching["grade"] != exp_item["grade"]:
                        print(f"  [FAIL] Grade mismatch for fused onion {o_id}: expected {exp_item['grade']}, got {matching['grade']}")
                        all_passed = False
                    print(f"  [PASS] Fused onion {o_id}: Class '{matching['class_name']}' -> Grade '{matching['grade']}'")

        print("")

    if all_passed:
        print("[SUCCESS] All golden parity tests passed without error!")
    else:
        print("[FAILED] One or more golden parity tests failed.")
    return all_passed


if __name__ == "__main__":
    success = run_golden_tests()
    sys.exit(0 if success else 1)
