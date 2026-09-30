"""Audit log inspection and full cryptographic chain verification router."""

import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog
from ..services.audit import verify_entire_audit_chain

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get("/verify-chain")
def check_chain_integrity(db: Session = Depends(get_db)):
    """Verifies complete SHA-256 block chain linkage from genesis to latest event."""
    return verify_entire_audit_chain(db)


@router.get("/log")
def get_audit_trail(
    limit: int = Query(50, le=200),
    offset: int = 0,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lists audit entries with prev_hash and current_hash proofs."""
    query = db.query(AuditLog)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)

    entries = query.order_by(AuditLog.sequence_num.desc()).offset(offset).limit(limit).all()

    return [
        {
            "sequence_num": e.sequence_num,
            "event_type": e.event_type,
            "entity_id": e.entity_id,
            "actor": e.actor,
            "payload": json.loads(e.payload_json),
            "prev_entry_hash": e.prev_entry_hash,
            "current_entry_hash": e.current_entry_hash,
            "timestamp": e.timestamp.isoformat(),
        }
        for e in entries
    ]
