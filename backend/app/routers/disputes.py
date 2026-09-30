"""Disputes router for farmer appeals and supervisor resolution queue."""

import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dispute, Report
from ..schemas import DisputeCreateRequest, DisputeResolveRequest
from ..services.audit import record_audit_event

router = APIRouter(prefix="/disputes", tags=["Disputes"])


@router.post("")
def create_dispute(req: DisputeCreateRequest, db: Session = Depends(get_db)):
    """Allows a farmer to file a dispute against a generated report."""
    report = db.query(Report).filter(Report.report_id == req.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    dispute = Dispute(
        report_id=req.report_id,
        farmer_phone=req.farmer_phone,
        reason=req.reason,
        status="OPEN",
    )
    report.is_disputed = True
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    record_audit_event(
        db,
        event_type="DISPUTE_RAISED",
        entity_id=str(dispute.id),
        actor=f"Farmer-{req.farmer_phone[-4:]}",
        payload={"report_id": req.report_id, "reason": req.reason},
    )

    return {"status": "created", "dispute_id": dispute.id, "report_id": dispute.report_id}


@router.get("")
def list_disputes(
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """Lists disputes for supervisor dispute resolution workbench."""
    query = db.query(Dispute)
    if status:
        query = query.filter(Dispute.status == status)

    disputes = query.order_by(Dispute.created_at.desc()).limit(limit).all()

    results = []
    for d in disputes:
        report = db.query(Report).filter(Report.report_id == d.report_id).first()
        results.append({
            "id": d.id,
            "report_id": d.report_id,
            "farmer_phone": d.farmer_phone,
            "farmer_name": report.farmer_name if report else "Farmer",
            "centre_name": report.centre_name if report else "Mandi",
            "reason": d.reason,
            "status": d.status,
            "supervisor_notes": d.supervisor_notes,
            "re_scan_report_id": d.re_scan_report_id,
            "created_at": d.created_at.isoformat(),
            "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
            "original_grade_a_pct": report.grade_a_pct if report else 0.0,
            "original_urs_pct": report.urs_pct if report else 0.0,
        })
    return results


@router.patch("/{dispute_id}")
def resolve_dispute(dispute_id: int, req: DisputeResolveRequest, db: Session = Depends(get_db)):
    """Supervisor resolves an open dispute with notes or links a re-scan report."""
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    dispute.status = req.status
    dispute.supervisor_notes = req.supervisor_notes
    dispute.resolved_at = datetime.datetime.utcnow()
    if req.re_scan_report_id:
        dispute.re_scan_report_id = req.re_scan_report_id

    db.commit()
    db.refresh(dispute)

    record_audit_event(
        db,
        event_type="DISPUTE_RESOLVED",
        entity_id=str(dispute.id),
        actor="Supervisor",
        payload={
            "status": req.status,
            "notes": req.supervisor_notes,
            "re_scan_id": req.re_scan_report_id,
        },
    )

    return {"status": "resolved", "dispute_id": dispute.id, "resolution": dispute.status}
