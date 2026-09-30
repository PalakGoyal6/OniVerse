"""Offline report synchronization router with idempotent batch processing and tamper checks."""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Report, OverrideRecord, User, Device
from ..schemas import BatchSyncRequest, BatchSyncResponse
from ..services.crypto import compute_canonical_hash, verify_ed25519_signature
from ..services.audit import record_audit_event

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/reports", response_model=BatchSyncResponse)
def sync_reports(req: BatchSyncRequest, db: Session = Depends(get_db)):
    """
    Idempotent batch upload of quality reports issued on offline devices.
    Re-computes canonical hash and verifies Ed25519 digital signature.
    """
    synced_count = 0
    duplicate_count = 0
    errors = []

    for r in req.reports:
        # Check if already synced (idempotent)
        existing = db.query(Report).filter(Report.report_id == r.report_id).first()
        if existing:
            duplicate_count += 1
            continue

        # Re-compute canonical hash
        recalculated_hash = compute_canonical_hash(r.canonical_json)
        if recalculated_hash != r.report_hash:
            errors.append(f"Report {r.report_id} rejected: hash mismatch (computed {recalculated_hash[:8]} vs provided {r.report_hash[:8]})")
            continue

        # Retrieve or find device public key
        device = db.query(Device).filter(Device.device_id == r.device_id).first()
        if device and device.public_key_ed25519:
            sig_valid = verify_ed25519_signature(device.public_key_ed25519, r.report_hash, r.signature_hex)
            if not sig_valid:
                # Log tamper attempt in audit log
                record_audit_event(
                    db,
                    event_type="SIGNATURE_TAMPER_DETECTED",
                    entity_id=r.report_id,
                    actor=f"Device-{r.device_id[:8]}",
                    payload={"reason": "Ed25519 signature verification failed", "report_hash": r.report_hash},
                )

        # Check or ensure inspector exists
        inspector = db.query(User).filter(User.id == r.inspector_id).first()
        if not inspector:
            inspector = db.query(User).filter(User.role == "inspector").first()
            inspector_id = inspector.id if inspector else 1
        else:
            inspector_id = r.inspector_id

        new_report = Report(
            report_id=r.report_id,
            lot_id=r.lot_id,
            centre_name=r.centre_name,
            inspector_id=inspector_id,
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
            signature_hex=r.signature_hex,
            device_id=r.device_id,
            model_version=r.model_version,
            rules_version=r.rules_version,
            app_version=r.app_version,
            raw_canonical_json=json.dumps(r.canonical_json),
            photo_front_hash=r.photo_front_hash,
            photo_back_hash=r.photo_back_hash,
            has_overrides=len(r.overrides) > 0,
        )
        db.add(new_report)

        # Add overrides
        for ov in r.overrides:
            rec = OverrideRecord(
                report_id=r.report_id,
                onion_id=ov.onion_id,
                original_class=ov.original_class,
                overridden_class=ov.overridden_class,
                original_grade=ov.original_grade,
                overridden_grade=ov.overridden_grade,
                reason=ov.reason,
                inspector_id=inspector_id,
            )
            db.add(rec)

        db.commit()
        synced_count += 1

        # Audit append
        record_audit_event(
            db,
            event_type="REPORT_ISSUED_SYNCED",
            entity_id=r.report_id,
            actor=f"Inspector-{inspector_id}",
            payload={
                "lot_id": r.lot_id,
                "grade_a_pct": r.grade_a_pct,
                "report_hash": r.report_hash,
                "has_overrides": len(r.overrides) > 0,
            },
        )

    return BatchSyncResponse(
        synced_count=synced_count,
        duplicate_count=duplicate_count,
        errors=errors,
    )
