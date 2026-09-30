"""FastAPI Main Application Entrypoint for AI Onion Quality Grading System."""

import json
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .models import User, Device, Report, OverrideRecord, AuditLog, RulesVersion
from .routers import (
    auth,
    devices,
    sync,
    reports,
    verify,
    disputes,
    stats,
    rules,
    models as models_router,
    audit,
    prices,
)
from .services.crypto import compute_canonical_hash, generate_dev_keypair, sign_canonical_hash
from .services.audit import record_audit_event

# Create database tables
Base.metadata.create_all(bind=engine)


def seed_initial_demo_data():
    """Seeds initial demonstration lots, inspectors, and device keys if database is fresh."""
    db = SessionLocal()
    try:
        # 1. Inspector & Supervisor Users
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                role="supervisor",
                full_name="Dr. Suresh Shinde (Director APMC)",
                centre_name="Headquarters - Nashik Division",
                phone="9822001122",
                password_hash="admin123",
            )
            db.add(admin_user)

        inspector_user = db.query(User).filter(User.username == "inspector_patil").first()
        if not inspector_user:
            inspector_user = User(
                username="inspector_patil",
                role="inspector",
                full_name="Rajesh Patil",
                centre_name="Lasalgaon Mandi",
                phone="9823012345",
                pin_hash="1234",
            )
            db.add(inspector_user)
            db.commit()
            db.refresh(inspector_user)

        # 2. Keypair for Dev Device
        device = db.query(Device).filter(Device.device_id == "DEV_PHONE_LASALGAON_01").first()
        if not device:
            priv_hex, pub_hex = generate_dev_keypair()
            device = Device(
                device_id="DEV_PHONE_LASALGAON_01",
                user_id=inspector_user.id,
                public_key_ed25519=pub_hex,
                device_name="Samsung Galaxy M34 (Mandi Unit 1)",
            )
            db.add(device)
            db.commit()

            # 3. Seed Sample Genuine Graded Report
            canonical_sample = {
                "report_id": "REP-2026-LAS-00101",
                "lot_id": "LOT-2026-MH-9042",
                "centre_name": "Lasalgaon Mandi",
                "inspector_id": inspector_user.id,
                "farmer_name": "Rameshwar Dattatray Borde",
                "farmer_phone": "9890123456",
                "variety": "Red Onion (Nashik Premium)",
                "sample_weight_kg": 2.50,
                "total_lot_weight_kg": 4500.0,
                "summary": {
                    "total_count": 28,
                    "grade_a_pct": 78.5,
                    "urs_pct": 14.3,
                    "rejected_pct": 7.2,
                    "average_diameter_mm": 54.8,
                    "lot_verdict": "GRADE_A_LOT",
                },
                "onions": [
                    {
                        "onion_id": 1,
                        "grade": "GRADE_A",
                        "class_name": "healthy",
                        "diameter_mm": 56.4,
                        "weight_g": 92.5,
                        "confidence": 0.94,
                        "reasons": ["Standard size (56.4mm) and healthy skin quality"],
                    },
                    {
                        "onion_id": 2,
                        "grade": "URS",
                        "class_name": "healthy",
                        "diameter_mm": 41.2,
                        "weight_g": 48.0,
                        "confidence": 0.91,
                        "reasons": ["Small / Under-sized bulb (41.2mm in URS range 35-44.9mm)"],
                    },
                    {
                        "onion_id": 3,
                        "grade": "REJECTED",
                        "class_name": "sprouted",
                        "diameter_mm": 52.0,
                        "weight_g": 85.0,
                        "confidence": 0.92,
                        "reasons": ["Severe defect detected: Sprouted (Premature Germination)"],
                    },
                ],
                "model_version": "1.0.0",
                "rules_version": "1.0.0",
                "app_version": "1.0.0",
                "timestamp_iso": "2026-09-30T00:30:00Z",
            }

            rep_hash = compute_canonical_hash(canonical_sample)
            sig_hex = sign_canonical_hash(priv_hex, rep_hash)

            report = Report(
                report_id=canonical_sample["report_id"],
                lot_id=canonical_sample["lot_id"],
                centre_name=canonical_sample["centre_name"],
                inspector_id=inspector_user.id,
                farmer_name=canonical_sample["farmer_name"],
                farmer_phone=canonical_sample["farmer_phone"],
                variety=canonical_sample["variety"],
                sample_weight_kg=canonical_sample["sample_weight_kg"],
                total_lot_weight_kg=canonical_sample["total_lot_weight_kg"],
                total_onions_count=canonical_sample["summary"]["total_count"],
                grade_a_pct=canonical_sample["summary"]["grade_a_pct"],
                urs_pct=canonical_sample["summary"]["urs_pct"],
                rejected_pct=canonical_sample["summary"]["rejected_pct"],
                average_diameter_mm=canonical_sample["summary"]["average_diameter_mm"],
                lot_verdict=canonical_sample["summary"]["lot_verdict"],
                report_hash=rep_hash,
                signature_hex=sig_hex,
                device_id="DEV_PHONE_LASALGAON_01",
                model_version="1.0.0",
                rules_version="1.0.0",
                app_version="1.0.0",
                raw_canonical_json=json.dumps(canonical_sample),
                has_overrides=False,
            )
            db.add(report)
            db.commit()

            # Record in cryptographic audit chain
            record_audit_event(
                db,
                event_type="GENESIS_REPORT_CREATED",
                entity_id=report.report_id,
                actor="System Initialization",
                payload={"lot_id": report.lot_id, "report_hash": rep_hash},
            )

    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_initial_demo_data()
    yield


app = FastAPI(
    title="AI Onion Quality Grading API",
    description="Smart India Hackathon AI Grading Platform: Real-world mm measurements, explainable grading, and tamper-proof cryptographic audit trail.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Seed synchronously for testing and development
seed_initial_demo_data()

# CORS middleware for mobile and dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(sync.router)
app.include_router(reports.router)
app.include_router(verify.router)
app.include_router(disputes.router)
app.include_router(stats.router)
app.include_router(rules.router)
app.include_router(models_router.router)
app.include_router(audit.router)
app.include_router(prices.router)


@app.get("/")
def root():
    return {
        "app": "AI Onion Quality Grading System",
        "hackathon": "Smart India Hackathon 2026",
        "status": "OPERATIONAL",
        "docs": "/docs",
        "verification_sample": "/verify/REP-2026-LAS-00101",
    }
