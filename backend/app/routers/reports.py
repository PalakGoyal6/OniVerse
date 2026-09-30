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
    save_to_db: bool = Form(False),
    farmer_name: str = Form("Kisan Ramesh"),
    farmer_phone: str = Form("9876543210"),
    centre_name: str = Form("Lasalgaon APMC Mandi"),
    variety: str = Form("Nashik Red"),
    db: Session = Depends(get_db),
):
    """Directly grades onion photo(s) using best.pt YOLO segmentation, ArUco sizing and AGMARK engine."""
    import cv2
    import numpy as np
    import uuid
    from ml.pipeline.run import OnionLotProcessor
    from ..services.crypto import compute_canonical_hash, generate_ed25519_keypair, sign_hash_ed25519

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

    if save_to_db:
        # Generate persistent report ID and cryptographic signature
        report_id = f"KP-2026-{uuid.uuid4().hex[:6].upper()}"
        lot_id = f"LOT-2026-{uuid.uuid4().hex[:4].upper()}"

        summary = result.get("summary", {})
        canonical_payload = {
            "report_id": report_id,
            "lot_id": lot_id,
            "centre_name": centre_name,
            "farmer_name": farmer_name,
            "farmer_phone": farmer_phone,
            "variety": variety,
            "grade_a_pct": summary.get("grade_a_pct", 0.0),
            "urs_pct": summary.get("urs_pct", 0.0),
            "rejected_pct": summary.get("rejected_pct", 0.0),
            "average_diameter_mm": summary.get("average_diameter_mm", 52.0),
            "total_onions_count": summary.get("total_onions_count", len(result.get("onions", []))),
            "sample_weight_kg": sample_weight_kg or summary.get("total_estimated_weight_kg", 5.0),
            "total_lot_weight_kg": total_lot_weight_kg or 1800.0,
            "lot_verdict": summary.get("lot_verdict", "GRADE_A"),
        }

        report_hash = compute_canonical_hash(canonical_payload)
        priv_key, pub_key = generate_ed25519_keypair()
        signature_hex = sign_hash_ed25519(priv_key, report_hash)

        # Get or create default inspector user
        user = db.query(User).filter(User.username == "inspector1").first()
        if not user:
            user = User(username="inspector1", full_name="Official Inspector", centre_name=centre_name)
            db.add(user)
            db.commit()
            db.refresh(user)

        new_report = Report(
            report_id=report_id,
            lot_id=lot_id,
            centre_name=centre_name,
            inspector_id=user.id,
            farmer_name=farmer_name,
            farmer_phone=farmer_phone,
            variety=variety,
            sample_weight_kg=canonical_payload["sample_weight_kg"],
            total_lot_weight_kg=canonical_payload["total_lot_weight_kg"],
            total_onions_count=canonical_payload["total_onions_count"],
            grade_a_pct=canonical_payload["grade_a_pct"],
            urs_pct=canonical_payload["urs_pct"],
            rejected_pct=canonical_payload["rejected_pct"],
            average_diameter_mm=canonical_payload["average_diameter_mm"],
            lot_verdict=canonical_payload["lot_verdict"],
            report_hash=report_hash,
            signature_hex=signature_hex,
            device_id="DEV-SERVER-01",
            model_version=result.get("model_version", "best.pt"),
            rules_version="2026.1",
            app_version="2.1.0",
            raw_canonical_json=json.dumps(canonical_payload, sort_keys=True),
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        result["saved_report_id"] = report_id
        result["stored_in_database"] = True
        result["report_hash"] = report_hash
        result["signature_hex"] = signature_hex

    return result

