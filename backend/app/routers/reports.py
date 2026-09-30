"""Reports router for supervisor querying and filtering with pagination."""

import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Report, User, OverrideRecord
from ..schemas import ReportSummaryResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[ReportSummaryResponse])
def list_reports(
    centre: Optional[str] = None,
    farmer_phone: Optional[str] = None,
    variety: Optional[str] = None,
    has_override: Optional[bool] = None,
    is_disputed: Optional[bool] = None,
    min_grade_a: Optional[float] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List reports with rich filters for supervisor dashboard."""
    query = db.query(Report)

    if centre:
        query = query.filter(Report.centre_name.ilike(f"%{centre}%"))
    if farmer_phone:
        query = query.filter(Report.farmer_phone.contains(farmer_phone))
    if variety:
        query = query.filter(Report.variety == variety)
    if has_override is not None:
        query = query.filter(Report.has_overrides == has_override)
    if is_disputed is not None:
        query = query.filter(Report.is_disputed == is_disputed)
    if min_grade_a is not None:
        query = query.filter(Report.grade_a_pct >= min_grade_a)

    reports = query.order_by(Report.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for r in reports:
        inspector_name = r.inspector.full_name if r.inspector else "Official Inspector"
        results.append(
            ReportSummaryResponse(
                id=r.id,
                report_id=r.report_id,
                lot_id=r.lot_id,
                centre_name=r.centre_name,
                inspector_name=inspector_name,
                farmer_name=r.farmer_name,
                farmer_phone=r.farmer_phone,
                variety=r.variety,
                sample_weight_kg=r.sample_weight_kg,
                total_lot_weight_kg=r.total_lot_weight_kg,
                total_onions_count=r.total_onions_count,
                grade_a_pct=r.grade_a_pct,
                urs_pct=r.urs_pct,
                rejected_pct=r.rejected_pct,
                average_diameter_mm=r.average_diameter_mm,
                lot_verdict=r.lot_verdict,
                report_hash=r.report_hash,
                has_overrides=r.has_overrides,
                is_disputed=r.is_disputed,
                created_at=r.created_at,
            )
        )
    return results


@router.get("/{report_id}")
def get_report_detail(report_id: str, db: Session = Depends(get_db)):
    """Fetch complete report data including parsed canonical JSON and override audit trail."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

    overrides = db.query(OverrideRecord).filter(OverrideRecord.report_id == report_id).all()
    canonical_data = json.loads(report.raw_canonical_json) if report.raw_canonical_json else {}

    return {
        "report_id": report.report_id,
        "lot_id": report.lot_id,
        "centre_name": report.centre_name,
        "inspector": {
            "id": report.inspector_id,
            "name": report.inspector.full_name if report.inspector else "Unknown",
        },
        "farmer_name": report.farmer_name,
        "farmer_phone": report.farmer_phone,
        "variety": report.variety,
        "summary": {
            "total_onions_count": report.total_onions_count,
            "sample_weight_kg": report.sample_weight_kg,
            "total_lot_weight_kg": report.total_lot_weight_kg,
            "grade_a_pct": report.grade_a_pct,
            "urs_pct": report.urs_pct,
            "rejected_pct": report.rejected_pct,
            "average_diameter_mm": report.average_diameter_mm,
            "lot_verdict": report.lot_verdict,
        },
        "crypto": {
            "report_hash": report.report_hash,
            "signature_hex": report.signature_hex,
            "device_id": report.device_id,
            "model_version": report.model_version,
            "rules_version": report.rules_version,
            "app_version": report.app_version,
        },
        "canonical_data": canonical_data,
        "overrides": [
            {
                "onion_id": o.onion_id,
                "original_class": o.original_class,
                "overridden_class": o.overridden_class,
                "original_grade": o.original_grade,
                "overridden_grade": o.overridden_grade,
                "reason": o.reason,
                "created_at": o.created_at.isoformat(),
            }
            for o in overrides
        ],
        "is_disputed": report.is_disputed,
        "created_at": report.created_at.isoformat(),
    }


@router.post("/analyze-image")
async def analyze_onion_images(
    front_image: UploadFile = File(...),
    back_image: Optional[UploadFile] = File(None),
    sample_weight_kg: Optional[float] = Form(None),
    total_lot_weight_kg: Optional[float] = Form(None),
):
    """Directly grades onion photo(s) using best.pt YOLO segmentation and AGMARK engine."""
    import cv2
    import numpy as np
    from ml.pipeline.run import OnionLotProcessor

    front_bytes = await front_image.read()
    front_np = np.frombuffer(front_bytes, np.uint8)
    front_img = cv2.imdecode(front_np, cv2.IMREAD_COLOR)
    if front_img is None:
        raise HTTPException(status_code=400, detail="Invalid front image file format")

    back_img = None
    if back_image is not None:
        back_bytes = await back_image.read()
        if back_bytes:
            back_np = np.frombuffer(back_bytes, np.uint8)
            back_img = cv2.imdecode(back_np, cv2.IMREAD_COLOR)

    processor = OnionLotProcessor()
    result = processor.process_lot(
        front_image=front_img,
        back_image=back_img,
        sample_weight_kg=sample_weight_kg,
        total_lot_weight_kg=total_lot_weight_kg,
    )
    return result

