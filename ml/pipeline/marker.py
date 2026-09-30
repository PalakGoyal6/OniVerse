"""ArUco marker detection, perspective transformation to mm plane, and camera quality validation."""

from typing import Tuple, Optional, Dict, Any
import numpy as np
import cv2


class MarkerDetector:
    def __init__(
        self,
        dictionary_name: str = "DICT_4X4_50",
        marker_id: int = 0,
        physical_size_mm: float = 50.0,
        height_correction_factor: float = 0.965,
    ):
        self.marker_id = marker_id
        self.physical_size_mm = physical_size_mm
        self.height_correction_factor = height_correction_factor

        # Map dictionary name to cv2.aruco
        dict_attr = getattr(cv2.aruco, dictionary_name, cv2.aruco.DICT_4X4_50)
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(dict_attr)
        self.aruco_params = cv2.aruco.DetectorParameters()
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)

    def validate_camera_quality(
        self,
        image: np.ndarray,
        min_luminance: float = 40.0,
        max_luminance: float = 230.0,
        min_laplacian_variance: float = 80.0,
    ) -> Dict[str, Any]:
        """Check brightness, sharpness and skew for guided capture."""
        if image is None or image.size == 0:
            return {
                "valid": False,
                "reason": "Empty image provided",
                "brightness_ok": False,
                "sharpness_ok": False,
                "marker_detected": False,
                "skew_ok": False,
                "luminance": 0.0,
                "laplacian_var": 0.0,
                "skew_deg": 90.0,
            }

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

        # 1. Luminance
        mean_luminance = float(np.mean(gray))
        brightness_ok = min_luminance <= mean_luminance <= max_luminance

        # 2. Sharpness (Laplacian variance)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        sharpness_ok = laplacian_var >= min_laplacian_variance

        # 3. Marker & Skew
        corners, ids, _ = self.detector.detectMarkers(image)
        marker_detected = False
        skew_ok = False
        skew_deg = 0.0

        if ids is not None and len(ids) > 0:
            for idx, m_id in enumerate(ids.flatten()):
                if m_id == self.marker_id:
                    marker_detected = True
                    # Check skew from marker corners
                    c = corners[idx][0]  # shape (4, 2)
                    # Vector between top-left and top-right
                    v_top = c[1] - c[0]
                    v_left = c[3] - c[0]
                    # Aspect ratio / angle check
                    angle = np.degrees(np.arctan2(v_top[1], v_top[0]))
                    skew_deg = abs(angle) % 90
                    if skew_deg > 45:
                        skew_deg = 90 - skew_deg
                    skew_ok = skew_deg <= 25.0
                    break

        all_ok = brightness_ok and sharpness_ok and marker_detected and skew_ok
        return {
            "valid": all_ok,
            "brightness_ok": brightness_ok,
            "sharpness_ok": sharpness_ok,
            "marker_detected": marker_detected,
            "skew_ok": skew_ok,
            "luminance": round(mean_luminance, 2),
            "laplacian_var": round(laplacian_var, 2),
            "skew_deg": round(skew_deg, 2),
        }

    def detect_and_compute_homography(
        self, image: np.ndarray
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray], Dict[str, Any]]:
        """
        Detects ArUco marker and calculates Homography matrix from pixel space to mm space.
        Returns:
            H_px_to_mm: 3x3 homography matrix (pixel -> mm plane)
            marker_corners_px: 4x2 array of pixel coordinates
            meta: dictionary with detection metrics
        """
        corners, ids, _ = self.detector.detectMarkers(image)

        if ids is None or len(ids) == 0:
            return None, None, {"status": "no_marker_found"}

        target_idx = None
        for idx, m_id in enumerate(ids.flatten()):
            if m_id == self.marker_id:
                target_idx = idx
                break

        if target_idx is None:
            # Pick first marker if exact ID is not matched
            target_idx = 0

        marker_corners = corners[target_idx][0]  # shape: (4, 2)

        # In mm space, we define marker coordinates at (0,0), (size, 0), (size, size), (0, size)
        s = self.physical_size_mm
        dst_pts_mm = np.array([
            [0.0, 0.0],
            [s, 0.0],
            [s, s],
            [0.0, s]
        ], dtype=np.float32)

        src_pts_px = marker_corners.astype(np.float32)

        # Compute Homography (pixel -> mm)
        H_px_to_mm, _ = cv2.findHomography(src_pts_px, dst_pts_mm)

        return H_px_to_mm, marker_corners, {
            "status": "success",
            "marker_id": int(ids.flatten()[target_idx]),
            "corners_px": marker_corners.tolist(),
            "scale_px_per_mm": float(np.linalg.norm(marker_corners[1] - marker_corners[0]) / s),
        }
