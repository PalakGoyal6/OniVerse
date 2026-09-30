"""Model distribution router for mobile over-the-air TFLite model updates."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ModelRelease

router = APIRouter(prefix="/models", tags=["Model Releases"])


@router.get("/latest")
def get_latest_model(db: Session = Depends(get_db)):
    """Provides latest TFLite segmentation model release metadata and checksum for mobile OTA sync."""
    release = db.query(ModelRelease).filter(ModelRelease.is_active == True).order_by(ModelRelease.created_at.desc()).first()

    if release:
        return {
            "version": release.version,
            "model_type": release.model_type,
            "download_url": release.download_url,
            "sha256_hash": release.sha256_hash,
            "release_notes": release.release_notes,
            "released_at": release.created_at.isoformat(),
        }

    return {
        "version": "1.0.0",
        "model_type": "yolov8n-seg-fp16",
        "download_url": "https://storage.googleapis.com/sih-onion-models/releases/best.pt",
        "sha256_hash": "1b1455de1c3d5df56b7abb7bc4473d17023aa63829f06ef672914a6639a80ae9",
        "release_notes": "Official SIH v1 model trained on 5 onion defect classes with ArUco 4x4 spatial calibration.",
        "released_at": "2026-09-30T00:00:00Z",
    }
