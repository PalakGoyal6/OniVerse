"""Grading rules management router: editable from supervisor dashboard with versioned audit trail."""

import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RulesVersion
from ..schemas import RulesUpdateRequest
from ..services.audit import record_audit_event

router = APIRouter(prefix="/rules", tags=["Grading Rules"])

CONFIG_FILE = Path(__file__).resolve().parents[3] / "config" / "grading_rules.json"


@router.get("")
def get_current_rules(db: Session = Depends(get_db)):
    """Returns currently active grading rules JSON."""
    active_version = db.query(RulesVersion).filter(RulesVersion.is_active == True).order_by(RulesVersion.created_at.desc()).first()
    if active_version:
        return {
            "version": active_version.version,
            "rules": json.loads(active_version.content_json),
            "created_by": active_version.created_by,
            "created_at": active_version.created_at.isoformat(),
        }

    # Fallback to local config file
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "version": data.get("version", "1.0.0"),
            "rules": data,
            "created_by": "System Initialization",
            "created_at": "2026-09-30T00:00:00Z",
        }

    raise HTTPException(status_code=404, detail="No grading rules configured")


@router.put("")
def update_rules(req: RulesUpdateRequest, db: Session = Depends(get_db)):
    """Supervisor updates grading rules, creating a new immutable version in the audit chain."""
    # Deactivate older versions
    db.query(RulesVersion).update({RulesVersion.is_active: False})

    new_version = RulesVersion(
        version=req.version,
        content_json=json.dumps(req.rules, indent=2),
        created_by="Supervisor Admin",
        is_active=True,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    # Also persist to file for local ML pipeline
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(req.rules, f, indent=2)
    except Exception as e:
        print("Warning: could not write to local grading_rules.json:", e)

    record_audit_event(
        db,
        event_type="GRADING_RULES_UPDATED",
        entity_id=req.version,
        actor="Supervisor Admin",
        payload={"version": req.version, "reason": req.reason},
    )

    return {
        "status": "updated",
        "version": new_version.version,
        "message": f"Rules updated to version {req.version} and logged in cryptographic audit chain.",
    }
