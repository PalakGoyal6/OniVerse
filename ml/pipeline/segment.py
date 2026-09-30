"""YOLO detection and segmentation inference for detecting onions and defect classes."""

from typing import List, Dict, Any, Optional
from pathlib import Path
import numpy as np
import cv2

# Exact dataset classes for best.pt:
# 0 - Healthy
# 1 - Damaged / Mechanical Damage
# 2 - Rotten
# 3 - Sprouted / Sprouting
# 4 - Mould
CLASSES = [
    "Healthy",                 # 0
    "Damaged",                 # 1
    "Rotten",                  # 2
    "Sprouted",                # 3
    "Mould",                   # 4
]


class SegmentResult:
    def __init__(
        self,
        class_id: int,
        class_name: str,
        confidence: float,
        bbox_xyxy: List[float],
        contour_px: np.ndarray,
        mask_binary: Optional[np.ndarray] = None,
    ):
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = float(confidence)
        self.bbox_xyxy = [float(x) for x in bbox_xyxy]
        self.contour_px = contour_px
        self.mask_binary = mask_binary

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_id": self.class_id,
            "class_name": self.class_name,
            "confidence": round(self.confidence, 4),
            "bbox_xyxy": [round(x, 2) for x in self.bbox_xyxy],
            "contour_point_count": len(self.contour_px) if self.contour_px is not None else 0,
        }


class YOLOSegmentor:
    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.22):
        self.conf_threshold = conf_threshold
        self.model = None

        if model_path is None:
            candidates = [
                Path("best.pt"),
                Path(__file__).resolve().parents[2] / "best.pt",
                Path(__file__).resolve().parents[1] / "weights" / "best.pt",
                Path(__file__).resolve().parents[2] / "ml" / "weights" / "best.pt",
            ]
            for cand in candidates:
                if cand.exists():
                    model_path = str(cand)
                    break

        self.model_path = model_path
        if model_path:
            try:
                from ultralytics import YOLO
                self.model = YOLO(model_path)
                print(f"[YOLOSegmentor] Successfully loaded weights from '{model_path}'")
            except Exception as e:
                print(f"[YOLOSegmentor] Note: Could not load model from '{model_path}': {e}.")

    def infer(self, image: np.ndarray) -> List[SegmentResult]:
        """Run YOLO inference on image array with confidence & geometry filtering."""
        if image is None or image.size == 0:
            return []

        img_h, img_w = image.shape[:2]
        total_img_area = float(img_h * img_w)

        if self.model is not None:
            # Sensitive confidence threshold 0.22 and IoU NMS 0.40
            results = self.model(image, conf=self.conf_threshold, iou=0.40, verbose=False)
            output: List[SegmentResult] = []

            if len(results) > 0 and results[0].boxes is not None and len(results[0].boxes) > 0:
                r = results[0]
                boxes = r.boxes
                masks = r.masks
                model_names = getattr(self.model, "names", {})

                name_map = {
                    "healthy": "Healthy",
                    "mechanical_damage": "Damaged",
                    "damage": "Damaged",
                    "damaged": "Damaged",
                    "rotten": "Rotten",
                    "rot": "Rotten",
                    "sprouting": "Sprouted",
                    "sprouted": "Sprouted",
                    "mould": "Rotten",
                    "mold": "Rotten",
                    "onions-quality-analysis": "Healthy",
                }

                for i in range(len(boxes)):
                    c_id = int(boxes.cls[i].item())
                    conf = float(boxes.conf[i].item())
                    xyxy = [float(x) for x in boxes.xyxy[i].tolist()]

                    x1, y1, x2, y2 = xyxy
                    bw = max(1.0, x2 - x1)
                    bh = max(1.0, y2 - y1)
                    box_area = bw * bh

                    # Physical plausibility checks:
                    # 1. Reject giant bounding boxes (e.g. human torso or whole room background > 30% of view)
                    if (box_area / total_img_area) > 0.30:
                        continue

                    # 2. Reject extreme aspect ratios
                    aspect = bw / bh
                    if aspect < 0.45 or aspect > 2.30:
                        continue

                    raw_name = model_names.get(c_id, CLASSES[c_id] if c_id < len(CLASSES) else f"class_{c_id}")
                    c_name = name_map.get(str(raw_name).lower().strip(), str(raw_name).capitalize())

                    # Check if segmentation masks are available
                    if masks is not None and len(masks.xy) > i and len(masks.xy[i]) > 0:
                        polygon = masks.xy[i]
                        contour_px = np.array(polygon, dtype=np.int32)
                    else:
                        # Extract smooth elliptical contour from bounding box for detection models
                        cx, cy = (x1 + x2) / 2.0, (y1 + y2) / 2.0
                        rx, ry = max(2.0, bw / 2.0), max(2.0, bh / 2.0)
                        angles = np.linspace(0, 2 * np.pi, 32, endpoint=False)
                        pts_x = cx + rx * np.cos(angles)
                        pts_y = cy + ry * np.sin(angles)
                        contour_px = np.stack([pts_x, pts_y], axis=1).astype(np.int32)

                    output.append(SegmentResult(c_id, c_name, conf, xyxy, contour_px))
                return output

            return []

        return []
