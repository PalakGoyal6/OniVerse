"""Real-world metric size measurement using homography warping and height correction."""

from typing import Dict, Any, Optional
import numpy as np
import cv2


class OnionMeasurement:
    def __init__(
        self,
        length_mm: float,
        width_mm: float,
        diameter_mm: float,
        area_mm2: float,
        centroid_mm: np.ndarray,
        box_mm: np.ndarray,
    ):
        self.length_mm = float(length_mm)
        self.width_mm = float(width_mm)
        self.diameter_mm = float(diameter_mm)
        self.area_mm2 = float(area_mm2)
        self.centroid_mm = centroid_mm  # shape (2,)
        self.box_mm = box_mm            # shape (4, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "length_mm": round(self.length_mm, 2),
            "width_mm": round(self.width_mm, 2),
            "diameter_mm": round(self.diameter_mm, 2),
            "area_mm2": round(self.area_mm2, 2),
            "centroid_mm": [round(float(c), 2) for c in self.centroid_mm],
        }


class SizeMeasurer:
    def __init__(self, height_correction_factor: float = 0.965):
        """
        height_correction_factor accounts for the 3D elevation of onions above the paper plane,
        which causes perspective parallax enlargement.
        """
        self.height_correction_factor = height_correction_factor

    def measure_contour(
        self,
        contour_px: np.ndarray,
        H_px_to_mm: np.ndarray,
    ) -> Optional[OnionMeasurement]:
        """
        Transforms contour points from pixel space to mm space using homography H,
        fits a minAreaRect in mm coordinates, and applies height correction.
        """
        if contour_px is None or len(contour_px) < 3 or H_px_to_mm is None:
            return None

        # Convert to float32 Nx1x2 for perspectiveTransform
        pts_px = contour_px.reshape(-1, 1, 2).astype(np.float32)
        pts_mm = cv2.perspectiveTransform(pts_px, H_px_to_mm).reshape(-1, 2)

        # Apply height correction scaling around the centroid of the contour
        centroid_raw = np.mean(pts_mm, axis=0)
        pts_mm_corrected = centroid_raw + (pts_mm - centroid_raw) * self.height_correction_factor

        # Fit minimum area bounding rectangle in mm space
        pts_for_rect = pts_mm_corrected.astype(np.float32)
        rect = cv2.minAreaRect(pts_for_rect)
        (center_x, center_y), (dim1, dim2), angle = rect

        # Order dimensions: length is major axis, width is minor axis
        length = max(dim1, dim2)
        width = min(dim1, dim2)

        # Diameter for commercial grading is typically the maximum equatorial cross section (width across bulb)
        diameter = width

        area_mm2 = cv2.contourArea(pts_mm_corrected.astype(np.float32))
        box_mm = cv2.boxPoints(rect)

        return OnionMeasurement(
            length_mm=length,
            width_mm=width,
            diameter_mm=diameter,
            area_mm2=area_mm2,
            centroid_mm=np.array([center_x, center_y], dtype=np.float32),
            box_mm=box_mm,
        )
