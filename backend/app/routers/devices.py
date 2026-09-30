"""Device registration router for inspector mobile phones and cryptographic public keys."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Device, User
from ..schemas import DeviceRegisterRequest
from ..services.audit import record_audit_event

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post("/register-key")
def register_device_key(req: DeviceRegisterRequest, db: Session = Depends(get_db)):
    """Registers or updates an Ed25519 public key associated with an inspector device."""
    device = db.query(Device).filter(Device.device_id == req.device_id).first()
    if device:
        device.public_key_ed25519 = req.public_key_ed25519
        device.device_name = req.device_name
        if req.inspector_id:
            device.user_id = req.inspector_id
        db.commit()
        db.refresh(device)
        record_audit_event(
            db,
            event_type="DEVICE_KEY_ROTATED",
            entity_id=req.device_id,
            actor=f"Device-{req.device_id[:8]}",
            payload={"public_key": req.public_key_ed25519},
        )
        return {"status": "updated", "device_id": device.device_id}

    new_device = Device(
        device_id=req.device_id,
        user_id=req.inspector_id,
        public_key_ed25519=req.public_key_ed25519,
        device_name=req.device_name,
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    record_audit_event(
        db,
        event_type="DEVICE_REGISTERED",
        entity_id=req.device_id,
        actor=f"Device-{req.device_id[:8]}",
        payload={"public_key": req.public_key_ed25519, "device_name": req.device_name},
    )

    return {"status": "registered", "device_id": new_device.device_id}
