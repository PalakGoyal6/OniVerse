"""
Pipeline Verification Script
Runs the exact end-to-end OnionLotProcessor pipeline on all test images in test_images/
Prints raw pre-filter detections, full lot analysis, and saves annotated images to test_images/out/.
"""

import os
import sys
from pathlib import Path
import cv2
import numpy as np

# Add project root to sys.path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

from ml.pipeline.run import OnionLotProcessor


def run_verification():
    test_dir = root / "test_images"
    out_dir = test_dir / "out"
    out_dir.mkdir(parents=True, exist_ok=True)

    processor = OnionLotProcessor()

    # Target specific test files
    valid_extensions = {".jpg", ".jpeg", ".png"}
    test_files = [f for f in sorted(test_dir.iterdir()) if f.is_file() and f.suffix.lower() in valid_extensions and f.name != "out"]

    print("=" * 80)
    print("AGRI-GRADE AI: FULL PIPELINE VERIFICATION RUN")
    print(f"Test Directory: {test_dir}")
    print(f"Output Directory: {out_dir}")
    print(f"Found {len(test_files)} test images.")
    print("=" * 80)

    for img_path in test_files:
        print(f"\n>>> PROCESSING: {img_path.name}")
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"ERROR: Could not read image {img_path.name}")
            continue

        h, w = img.shape[:2]
        print(f"Image Shape: ({h}, {w}, 3)")

        # Print RAW pre-filter YOLO detections
        if processor.segmentor.model is not None:
            raw_res = processor.segmentor.model(img, conf=0.25, iou=0.60, verbose=False)[0]
            raw_boxes = raw_res.boxes
            raw_count = len(raw_boxes) if raw_boxes is not None else 0
            print(f"Raw Pre-Filter Detections (conf >= 0.25, iou=0.60): {raw_count}")
            if raw_boxes is not None and len(raw_boxes) > 0:
                for bi in range(len(raw_boxes)):
                    c_id = int(raw_boxes.cls[bi].item())
                    c_name = processor.segmentor.model.names.get(c_id, f"cls_{c_id}")
                    c_conf = float(raw_boxes.conf[bi].item())
                    b_xyxy = [round(x, 1) for x in raw_boxes.xyxy[bi].tolist()]
                    b_area_pct = ((b_xyxy[2] - b_xyxy[0]) * (b_xyxy[3] - b_xyxy[1])) / (h * w) * 100.0
                    print(f"  Raw Box {bi+1}: {c_name} (conf: {c_conf:.3f}, box: {b_xyxy}, area: {b_area_pct:.1f}% of frame)")
        else:
            print("Raw Pre-Filter Detections: Model not loaded")

        # Run EXACT full lot pipeline (same as reports.py API endpoint)
        pipeline_res = processor.process_lot(front_image=img)

        front_meta = pipeline_res.get("front_view_meta", {})
        marker_detected = front_meta.get("marker_detected", False)
        print(f"Marker Detected: {'YES' if marker_detected else 'NO'}")

        if marker_detected:
            cfg_marker_mm = 50.0
            print(f"  Configured Marker Side: {cfg_marker_mm:.1f} mm")
            meta = front_meta.get("marker_meta", {})
            corners = meta.get("corners_px")
            if corners is not None and len(corners) == 4:
                px_w = np.linalg.norm(np.array(corners[0]) - np.array(corners[1]))
                px_h = np.linalg.norm(np.array(corners[1]) - np.array(corners[2]))
                avg_px_side = (px_w + px_h) / 2.0
                mm_per_px = cfg_marker_mm / avg_px_side if avg_px_side > 0 else 0.0
                print(f"  Detected Marker Pixel Side: {avg_px_side:.1f} px")
                print(f"  Computed Scale: {mm_per_px:.4f} mm/px")

        lot_summary = pipeline_res.get("lot_summary", {})
        onions = lot_summary.get("onions", [])
        total_detections = len(onions)
        print(f"Post-Filter Valid Detections: {total_detections}")

        annotated_img = img.copy()

        if total_detections == 0:
            print(f"  Result Notice: {lot_summary.get('summary_status_text')}")
        else:
            print("-" * 90)
            print(f"{'ID':<11} | {'Class':<10} | {'Conf':<6} | {'Dia(mm)':<9} | {'Weight(g)':<9} | {'Grade':<19} | {'Status':<18} | Reason")
            print("-" * 90)
            for idx, o in enumerate(onions):
                oid = o.get("onion_id", idx + 1)
                cls_name = o.get("class_name", "Unknown")
                conf = o.get("confidence", 0.0)
                dia = o.get("diameter_mm")
                dia_str = f"{dia:.1f} mm" if dia is not None else "null"
                wt = o.get("weight_g")
                wt_str = f"{wt:.1f} g" if wt is not None else "null"
                grade = o.get("grade", "UNGRADED")
                status = o.get("status", "AUTO")
                reasons = o.get("reasons", [])
                reason_str = "; ".join(reasons) if isinstance(reasons, list) else str(reasons)

                print(f"{str(oid):<11} | {cls_name:<10} | {conf:.3f}  | {dia_str:<9} | {wt_str:<9} | {grade:<19} | {status:<18} | {reason_str}")

                # Draw annotation
                bbox = o.get("bbox_xyxy")
                if bbox and len(bbox) == 4:
                    x1, y1, x2, y2 = [int(v) for v in bbox]
                    color = (0, 200, 0) if grade == "GRADE_A" else ((0, 165, 255) if grade == "URS" else (0, 0, 220))
                    cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
                    label = f"{cls_name} {conf*100:.0f}% | {grade} ({status})"
                    cv2.putText(annotated_img, label, (x1, max(15, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

        # Lot summary breakdown
        auto_count = lot_summary.get("auto_graded_count", 0)
        needs_check = lot_summary.get("needs_check_count", 0)
        pct_count = lot_summary.get("percentages_by_count", {})
        verdict = lot_summary.get("lot_verdict", "N/A")

        # Storage risk calculation
        rejected_pct = pct_count.get("REJECTED", 0.0)
        urs_pct = pct_count.get("URS", 0.0)
        if total_detections == 0 or auto_count == 0:
            storage_risk_state = "PENDING (0 confirmed onions - requires review)"
        elif rejected_pct > 25.0:
            storage_risk_state = "HIGH RISK (Score: 78/100) — High spoilage risk"
        elif urs_pct > 30.0 or rejected_pct > 10.0:
            storage_risk_state = "MEDIUM RISK (Score: 42/100) — Moderate risk"
        else:
            storage_risk_state = "LOW RISK (Score: 16/100) — Suitable for buffer stock"

        print("-" * 90)
        print("LOT SUMMARY:")
        print(f"  Auto-Graded Count : {auto_count}")
        print(f"  Pending Count     : {needs_check}")
        print(f"  Confirmed Grade A : {pct_count.get('GRADE_A', 0.0)}%")
        print(f"  Confirmed URS     : {pct_count.get('URS', 0.0)}%")
        print(f"  Confirmed Rejected: {pct_count.get('REJECTED', 0.0)}%")
        print(f"  Lot Verdict       : {verdict}")
        print(f"  Storage Risk State: {storage_risk_state}")
        print(f"  Status Summary    : {lot_summary.get('summary_status_text', 'N/A')}")
        print("-" * 90)

        # Save annotated image
        out_path = out_dir / f"annotated_{img_path.stem}.jpg"
        cv2.imwrite(str(out_path), annotated_img)
        print(f"Saved annotated image to: {out_path}")


if __name__ == "__main__":
    run_verification()
