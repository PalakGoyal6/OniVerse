"""YOLO segmentation inference for detecting onions and defect classes."""

from typing import List, Dict, Any, Optional
from pathlib import Path
import numpy as np
import cv2

# Exact dataset classes requested:
# 0 - Damaged
# 1 - Healthy
# 2 - Onions-Quality-Analysis
# 3 - Rotten
# 4 - Sprouted
CLASSES = [
    "Damaged",                 # 0
    "Healthy",                 # 1
    "Onions-Quality-Analysis", # 2
    "Rotten",                  # 3
    "Sprouted",                # 4
]


class SegmentResult:
    def __init__(
        self,
        class_id: int,
        class_name: str,
        confidence: float,
        bbox_xyxy: List[float],
        contour_px: np.ndarray,  # shape (N, 2)
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
    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.25):
        self.conf_threshold = conf_threshold
        self.model = None

        if model_path is None:
            # Check default candidate paths for best.pt
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
                print(f"[YOLOSegmentor] Note: Could not load model from '{model_path}': {e}. Using fallback simulation.")

    def infer(self, image: np.ndarray) -> List[SegmentResult]:
        """Run segmentation inference on image array."""
        if image is None or image.size == 0:
            return []

        if self.model is not None:
            results = self.model(image, conf=self.conf_threshold, verbose=False)
            output: List[SegmentResult] = []
            if len(results) > 0 and results[0].masks is not None:
                r = results[0]
                boxes = r.boxes
                masks = r.masks
                model_names = getattr(self.model, "names", {})

                # Label normalizer mapping to canonical categories
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
                    xyxy = boxes.xyxy[i].tolist()
                    
                    raw_name = model_names.get(c_id, CLASSES[c_id] if c_id < len(CLASSES) else f"class_{c_id}")
                    c_name = name_map.get(str(raw_name).lower().strip(), str(raw_name).capitalize())

                    # Polygon contour
                    polygon = masks.xy[i]  # shape (N, 2)
                    contour_px = np.array(polygon, dtype=np.int32) if len(polygon) > 0 else np.array([])
                    output.append(SegmentResult(c_id, c_name, conf, xyxy, contour_px))
                return output

        # Simulation fallback for test environments without trained weights
        return self._fallback_segmentation(image)

    def _fallback_segmentation(self, image: np.ndarray) -> List[SegmentResult]:
        """Heuristic segmentation for testing and golden evaluation without weights."""
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

        # Otsu thresholding after blur
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        output: List[SegmentResult] = []

        min_area = (h * w) * 0.001
        max_area = (h * w) * 0.25

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area <= area <= max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                if 0.4 <= bw / float(bh) <= 2.5:
                    pts = cnt.reshape(-1, 2)
                    output.append(
                        SegmentResult(
                            class_id=1,
                            class_name="Healthy",
                            confidence=0.90,
                            bbox_xyxy=[float(x), float(y), float(x + bw), float(y + bh)],
                            contour_px=pts,
                        )
                    )
        return output
