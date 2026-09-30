"""Comprehensive Backend API Integration & Cryptographic Parity Tests."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.crypto import generate_dev_keypair, compute_canonical_hash, sign_canonical_hash

client = TestClient(app)


def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "OPERATIONAL"


def test_inspector_login():
    response = client.post("/auth/inspector/login", json={"pin": "1234", "device_id": "TEST_DEVICE"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "inspector"


def test_public_verification_genuine():
    response = client.get("/verify/REP-2026-LAS-00101", headers={"accept": "application/json"})
    assert response.status_code == 200
    data = response.json()
    assert data["report_id"] == "REP-2026-LAS-00101"
    assert data["status"] == "GENUINE"
    assert data["cryptographic_verification"]["hash_matches"] is True


import uuid


def test_sync_reports_idempotent():
    priv_hex, pub_hex = generate_dev_keypair()
    unique_id = f"REP-TEST-{uuid.uuid4().hex[:8]}"

    # Register device
    dev_res = client.post("/devices/register-key", json={
        "device_id": f"DEV_{uuid.uuid4().hex[:8]}",
        "public_key_ed25519": pub_hex,
        "device_name": "Test Device Unit",
    })
    assert dev_res.status_code == 200

    # Build canonical payload
    canonical = {
        "report_id": unique_id,
        "lot_id": f"LOT-{unique_id}",
        "centre_name": "Lasalgaon Mandi",
        "inspector_id": 1,
        "farmer_name": "Sunil Shinde",
        "farmer_phone": "9876543210",
        "variety": "Red Onion",
        "total_onions_count": 10,
        "grade_a_pct": 80.0,
        "urs_pct": 10.0,
        "rejected_pct": 10.0,
        "average_diameter_mm": 52.5,
        "lot_verdict": "GRADE_A_LOT",
    }
    rep_hash = compute_canonical_hash(canonical)
    sig_hex = sign_canonical_hash(priv_hex, rep_hash)

    sync_payload = {
        "reports": [
            {
                "report_id": unique_id,
                "lot_id": f"LOT-{unique_id}",
                "centre_name": "Lasalgaon Mandi",
                "inspector_id": 1,
                "farmer_name": "Sunil Shinde",
                "farmer_phone": "9876543210",
                "variety": "Red Onion",
                "sample_weight_kg": 1.2,
                "total_lot_weight_kg": 2000.0,
                "total_onions_count": 10,
                "grade_a_pct": 80.0,
                "urs_pct": 10.0,
                "rejected_pct": 10.0,
                "average_diameter_mm": 52.5,
                "lot_verdict": "GRADE_A_LOT",
                "report_hash": rep_hash,
                "signature_hex": sig_hex,
                "device_id": f"DEV_{unique_id}",
                "canonical_json": canonical,
                "overrides": [],
            }
        ]
    }

    # 1. First sync
    res1 = client.post("/sync/reports", json=sync_payload)
    print("Sync response:", res1.json())
    assert res1.status_code == 200
    assert res1.json()["synced_count"] == 1

    # 2. Duplicate sync (idempotency check)
    res2 = client.post("/sync/reports", json=sync_payload)
    assert res2.status_code == 200
    assert res2.json()["duplicate_count"] == 1


def test_audit_chain_integrity():
    response = client.get("/audit/verify-chain")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VALID"
    assert data["chain_intact"] is True
    assert data["total_entries"] >= 1


def test_disputes_flow():
    # 1. Create dispute
    create_res = client.post("/disputes", json={
        "report_id": "REP-2026-LAS-00101",
        "farmer_phone": "9890123456",
        "reason": "Farmer disputes the 7.2% rejected defect estimation",
    })
    assert create_res.status_code == 200
    d_id = create_res.json()["dispute_id"]

    # 2. Resolve dispute
    resolve_res = client.patch(f"/disputes/{d_id}", json={
        "status": "RESOLVED_UPHELD",
        "supervisor_notes": "Supervisor verified high-res photo; AI defect detection of premature sprouting confirmed accurate.",
    })
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"


def test_mandi_prices():
    response = client.get("/prices?commodity=Onion&market=Lasalgaon")
    assert response.status_code == 200
    data = response.json()
    assert data["commodity"] == "Onion"
    assert data["market"] == "Lasalgaon"
    assert "modal_price" in data
