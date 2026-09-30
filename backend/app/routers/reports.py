"""Reports router for supervisor querying and filtering with pagination."""

import json
import uuid
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
    from ml.pipeline.run import OnionLotProcessor
    from ..services.crypto import compute_canonical_hash, generate_dev_keypair, sign_canonical_hash

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
    pipeline_res = processor.process_lot(
        front_image=front_img,
        back_image=back_img,
        sample_weight_kg=sample_weight_kg,
        total_lot_weight_kg=total_lot_weight_kg,
    )

    lot_summary = pipeline_res.get("lot_summary", {})
    raw_onions = lot_summary.get("onions", [])
    total_count = len(raw_onions)

    pct_by_count = lot_summary.get("percentages_by_count", {})
    grade_a_pct = round(pct_by_count.get("GRADE_A", 0.0), 1)
    urs_pct = round(pct_by_count.get("URS", 0.0), 1)
    rejected_pct = round(pct_by_count.get("REJECTED", 0.0), 1)
    auto_count = lot_summary.get("auto_graded_count", 0)
    needs_check_count = lot_summary.get("needs_check_count", total_count - auto_count)
    summary_status = lot_summary.get("summary_status_text", f"{auto_count} of {total_count} auto-graded • {needs_check_count} need your check")

    lot_verdict = lot_summary.get("lot_verdict", "NO_ONIONS_DETECTED" if total_count == 0 else ("PENDING_REVIEW" if auto_count == 0 else "GRADE_A"))
    avg_dia_raw = lot_summary.get("average_diameter_mm")
    avg_diameter = round(float(avg_dia_raw), 1) if avg_dia_raw is not None else None

    formatted_onions = []
    for idx, o in enumerate(raw_onions):
        conf = float(o.get("confidence", 0.90))
        st = o.get("status", "AUTO" if conf >= 0.50 else "NEEDS_MANUAL_CHECK")
        cls_name = o.get("class_name", "Healthy")
        dia_raw = o.get("diameter_mm")
        dia = round(float(dia_raw), 1) if dia_raw is not None else None
        wt_raw = o.get("weight_g")
        wt = round(float(wt_raw), 1) if (wt_raw is not None and dia is not None) else None
        grade = o.get("grade", "GRADE_A")
        reasons_list = o.get("reasons", [])
        
        size_label = f"Size: {dia}mm" if dia is not None else "Size: Not measured (No ArUco marker)"
        reason_str = "; ".join(reasons_list) if isinstance(reasons_list, list) and len(reasons_list) > 0 else f"{size_label}. Class: {cls_name}."

        formatted_onions.append({
            "onion_id": f"ONION-{idx + 1:03d}",
            "class": cls_name,
            "confidence": conf,
            "status": st,
            "is_auto": o.get("is_auto", st == "AUTO"),
            "diameter_mm": dia,
            "estimated_weight_g": wt,
            "grade": grade,
            "reason": reason_str,
            "bbox_xyxy": o.get("bbox_xyxy"),
            "marker_detected": o.get("marker_detected", dia is not None),
        })

    # Storage Risk calculation
    if total_count == 0 or auto_count == 0:
        risk_score = None
        risk_band = "PENDING"
        risk_rec = "Storage suitability assessment is pending officer review and defect confirmation."
    elif rejected_pct > 25.0:
        risk_score = 78
        risk_band = "HIGH"
        risk_rec = "High spoilage risk (apical sprouting / rot detected). Dispatch immediately for distribution."
    elif urs_pct > 30.0 or rejected_pct > 10.0:
        risk_score = 42
        risk_band = "MEDIUM"
        risk_rec = "Moderate risk. Short-term storage (1–2 months). Inspect bi-weekly."
    else:
        risk_score = 16
        risk_band = "LOW"
        risk_rec = "Suitable for buffer stock storage (3–5 months with active aeration)."

    lot_id = f"LOT-2026-{uuid.uuid4().hex[:4].upper()}"
    calculated_sample_weight = round(float(lot_summary.get("total_weight_g", total_count * 85.0)) / 1000.0, 2)
    if calculated_sample_weight <= 0.0:
        calculated_sample_weight = sample_weight_kg or 5.0

    response_payload = {
        "lot_id": lot_id,
        "model_version": "YOLO11n-v2.1-best.pt",
        "summary": {
            "total_onions": total_count,
            "grade_a_pct": grade_a_pct,
            "urs_pct": urs_pct,
            "rejected_pct": rejected_pct,
            "auto_graded_count": auto_count,
            "needs_check_count": needs_check_count,
            "summary_status_text": summary_status,
            "provisional_percentages": lot_summary.get("provisional_percentages", {}),
            "sample_weight_kg": sample_weight_kg or calculated_sample_weight,
            "total_lot_weight_kg": total_lot_weight_kg or 1800.0,
            "average_diameter_mm": avg_diameter,
            "lot_verdict": lot_verdict,
        },
        "storage_risk": {
            "score": risk_score,
            "band": risk_band,
            "recommendation": risk_rec,
        },
        "onions": formatted_onions,
        "front_view_meta": pipeline_res.get("front_view_meta", {}),
    }

    if save_to_db:
        report_id = f"KP-2026-{uuid.uuid4().hex[:6].upper()}"

        canonical_payload = {
            "report_id": report_id,
            "lot_id": lot_id,
            "centre_name": centre_name,
            "farmer_name": farmer_name,
            "farmer_phone": farmer_phone,
            "variety": variety,
            "grade_a_pct": grade_a_pct,
            "urs_pct": urs_pct,
            "rejected_pct": rejected_pct,
            "average_diameter_mm": avg_diameter,
            "total_onions_count": total_count,
            "sample_weight_kg": response_payload["summary"]["sample_weight_kg"],
            "total_lot_weight_kg": response_payload["summary"]["total_lot_weight_kg"],
            "lot_verdict": lot_verdict,
        }

        report_hash = compute_canonical_hash(canonical_payload)
        priv_key, pub_key = generate_dev_keypair()
        signature_hex = sign_canonical_hash(priv_key, report_hash)

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
            model_version="YOLO11n-v2.1-best.pt",
            rules_version="2026.1",
            app_version="2.1.0",
            raw_canonical_json=json.dumps(canonical_payload, sort_keys=True),
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        response_payload["saved_report_id"] = report_id
        response_payload["stored_in_database"] = True
        response_payload["report_hash"] = report_hash
        response_payload["signature_hex"] = signature_hex

    return response_payload
