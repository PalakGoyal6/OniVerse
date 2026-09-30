"""Append-only cryptographic hash-chain audit log service."""

import json
import hashlib
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import AuditLog


GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def record_audit_event(
    db: Session,
    event_type: str,
    entity_id: str,
    actor: str,
    payload: Dict[str, Any],
) -> AuditLog:
    """Appends an event to the cryptographic audit chain."""
    # Find the latest audit entry
    latest_entry = db.query(AuditLog).order_by(AuditLog.sequence_num.desc()).first()

    if latest_entry is None:
        seq_num = 1
        prev_hash = GENESIS_HASH
    else:
        seq_num = latest_entry.sequence_num + 1
        prev_hash = latest_entry.current_entry_hash

    payload_str = json.dumps(payload, sort_keys=True)
    raw_to_hash = f"{seq_num}:{event_type}:{entity_id}:{actor}:{prev_hash}:{payload_str}"
    current_hash = hashlib.sha256(raw_to_hash.encode("utf-8")).hexdigest()

    entry = AuditLog(
        sequence_num=seq_num,
        event_type=event_type,
        entity_id=str(entity_id),
        actor=str(actor),
        payload_json=payload_str,
        prev_entry_hash=prev_hash,
        current_entry_hash=current_hash,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_entire_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Traverses the entire audit log table from sequence 1 to N,
    re-computing each SHA-256 hash and verifying block-to-block linkage.
    """
    entries = db.query(AuditLog).order_by(AuditLog.sequence_num.asc()).all()

    if not entries:
        return {
            "status": "VALID",
            "total_entries": 0,
            "chain_intact": True,
            "broken_at_sequence": None,
            "message": "Audit log is empty (Genesis state)",
        }

    expected_prev = GENESIS_HASH

    for entry in entries:
        if entry.prev_entry_hash != expected_prev:
            return {
                "status": "TAMPERED",
                "total_entries": len(entries),
                "chain_intact": False,
                "broken_at_sequence": entry.sequence_num,
                "message": f"Linkage broken at sequence {entry.sequence_num}: prev_hash mismatch",
            }

        # Recompute hash
        raw_to_hash = f"{entry.sequence_num}:{entry.event_type}:{entry.entity_id}:{entry.actor}:{entry.prev_entry_hash}:{entry.payload_json}"
        recalculated = hashlib.sha256(raw_to_hash.encode("utf-8")).hexdigest()

        if recalculated != entry.current_entry_hash:
            return {
                "status": "TAMPERED",
                "total_entries": len(entries),
                "chain_intact": False,
                "broken_at_sequence": entry.sequence_num,
                "message": f"Data alteration detected at sequence {entry.sequence_num}: hash signature invalid",
            }

        expected_prev = entry.current_entry_hash

    return {
        "status": "VALID",
        "total_entries": len(entries),
        "chain_intact": True,
        "broken_at_sequence": None,
        "latest_block_hash": expected_prev,
        "message": "Entire cryptographic audit chain is verified and 100% intact.",
    }
