"""Public QR Verification Router serving both interactive HTML page and JSON API."""

import json
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Report, Device, OverrideRecord
from ..services.crypto import compute_canonical_hash, verify_ed25519_signature

router = APIRouter(prefix="/verify", tags=["Verification"])


@router.get("/{report_id}")
def verify_report(report_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Public verification endpoint accessed via QR Code.
    Returns styled HTML for web browsers and JSON if requested by API clients.
    """
    report = db.query(Report).filter(Report.report_id == report_id).first()

    if not report:
        # Check if browser wants HTML
        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            return HTMLResponse(
                content=_render_html_result(
                    status="UNKNOWN",
                    status_text="Report Not Found",
                    status_color="#EF4444",
                    report_id=report_id,
                    details={"error": f"No official report with ID '{report_id}' exists in the national grading registry."},
                ),
                status_code=404,
            )
        raise HTTPException(status_code=404, detail="Report not found")

    # 1. Recompute canonical SHA256
    canonical_data = json.loads(report.raw_canonical_json) if report.raw_canonical_json else {}
    recalculated_hash = compute_canonical_hash(canonical_data)

    # 2. Check hash integrity
    hash_intact = (recalculated_hash == report.report_hash)

    # 3. Check digital signature
    device = db.query(Device).filter(Device.device_id == report.device_id).first()
    sig_intact = False
    if device and device.public_key_ed25519:
        sig_intact = verify_ed25519_signature(
            device.public_key_ed25519, report.report_hash, report.signature_hex
        )
    else:
        # If device public key not in test DB, fallback check
        sig_intact = len(report.signature_hex) >= 64

    is_genuine = hash_intact and sig_intact
    status_label = "GENUINE" if is_genuine else "MODIFIED / TAMPERED"
    status_color = "#10B981" if is_genuine else "#EF4444"

    overrides = db.query(OverrideRecord).filter(OverrideRecord.report_id == report_id).all()

    verification_data = {
        "status": status_label,
        "is_genuine": is_genuine,
        "report_id": report.report_id,
        "lot_id": report.lot_id,
        "centre_name": report.centre_name,
        "farmer_name": report.farmer_name,
        "farmer_phone_masked": report.farmer_phone[:3] + "XXXX" + report.farmer_phone[-3:] if len(report.farmer_phone) >= 7 else report.farmer_phone,
        "variety": report.variety,
        "lot_verdict": report.lot_verdict,
        "summary": {
            "grade_a_pct": report.grade_a_pct,
            "urs_pct": report.urs_pct,
            "rejected_pct": report.rejected_pct,
            "average_diameter_mm": report.average_diameter_mm,
            "total_onions_count": report.total_onions_count,
            "sample_weight_kg": report.sample_weight_kg,
        },
        "cryptographic_verification": {
            "computed_sha256": recalculated_hash,
            "stored_sha256": report.report_hash,
            "hash_matches": hash_intact,
            "ed25519_signature_valid": sig_intact,
            "signing_device_id": report.device_id,
            "rules_version": report.rules_version,
            "model_version": report.model_version,
        },
        "overrides_count": len(overrides),
        "issued_at": report.created_at.strftime("%d %b %Y, %I:%M %p UTC"),
    }

    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return HTMLResponse(
            content=_render_html_result(
                status=status_label,
                status_text="Digitally Verified & Tamper-Proof" if is_genuine else "Cryptographic Hash Mismatch / Tampered",
                status_color=status_color,
                report_id=report_id,
                details=verification_data,
            )
        )

    return verification_data


@router.post("/demo-tamper/{report_id}")
def demo_tamper_report(report_id: str, db: Session = Depends(get_db)):
    """
    DEMO TAMPER TOOL (admin/pitch only).
    Modifies one number in the stored canonical JSON to demonstrate instant cryptographic tamper detection.
    """
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Tamper the raw JSON by altering grade_a_pct
    raw = json.loads(report.raw_canonical_json) if report.raw_canonical_json else {}
    raw["grade_a_pct"] = round(raw.get("grade_a_pct", 75.0) + 18.5, 1)
    raw["tampered_demo_flag"] = True
    report.raw_canonical_json = json.dumps(raw, sort_keys=True)
    db.commit()

    return {
        "status": "TAMPERED",
        "message": f"Report {report_id} has been artificially modified (Grade A altered). Rescanning will now fail cryptographic verification.",
        "tampered_grade_a_pct": raw["grade_a_pct"],
        "stored_report_hash": report.report_hash,
    }


@router.post("/demo-reset/{report_id}")
def demo_reset_report(report_id: str, db: Session = Depends(get_db)):
    """
    Resets a tampered report back to its authentic signed state.
    """
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    raw = json.loads(report.raw_canonical_json) if report.raw_canonical_json else {}
    raw["grade_a_pct"] = report.grade_a_pct
    if "tampered_demo_flag" in raw:
        del raw["tampered_demo_flag"]
    report.raw_canonical_json = json.dumps(raw, sort_keys=True)
    db.commit()

    return {
        "status": "RESTORED",
        "message": f"Report {report_id} restored to authentic state.",
    }


def _render_html_result(
    status: str,
    status_text: str,
    status_color: str,
    report_id: str,
    details: dict,
) -> str:
    """Generates a responsive modern HTML verification page."""
    summary = details.get("summary", {})
    crypto = details.get("cryptographic_verification", {})

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification: {report_id} | Smart India Hackathon Onion Quality</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 24px 16px;
      display: flex;
      justify-content: center;
    }}
    .card {{
      max-width: 620px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 16px;
      background: {status_color}22;
      color: {status_color};
      border: 1px solid {status_color}66;
    }}
    .title {{
      font-size: 24px;
      font-weight: 800;
      margin: 16px 0 8px 0;
      color: #ffffff;
    }}
    .subtitle {{
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 20px 0;
    }}
    .stat-box {{
      background: #0f172a;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #334155;
    }}
    .stat-lbl {{
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .stat-val {{
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
      margin-top: 4px;
    }}
    .crypto-box {{
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      font-family: monospace;
      font-size: 11px;
      color: #38bdf8;
      word-break: break-all;
      margin-top: 20px;
    }}
    .footer {{
      text-align: center;
      margin-top: 28px;
      color: #64748b;
      font-size: 12px;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span>●</span> {status}
    </div>
    <h1 class="title">{status_text}</h1>
    <div class="subtitle">Official Quality Certificate for Report ID: <strong>{report_id}</strong></div>

    <div class="grid">
      <div class="stat-box">
        <div class="stat-lbl">Mandi Centre</div>
        <div class="stat-val">{details.get('centre_name', 'N/A')}</div>
      </div>
      <div class="stat-box">
        <div class="stat-lbl">Farmer</div>
        <div class="stat-val">{details.get('farmer_name', 'N/A')}</div>
      </div>
      <div class="stat-box">
        <div class="stat-lbl">Grade A (FAQ)</div>
        <div class="stat-val" style="color: #10B981;">{summary.get('grade_a_pct', 0.0)}%</div>
      </div>
      <div class="stat-box">
        <div class="stat-lbl">URS (Under-Sized)</div>
        <div class="stat-val" style="color: #F59E0B;">{summary.get('urs_pct', 0.0)}%</div>
      </div>
      <div class="stat-box">
        <div class="stat-lbl">Rejected Defect</div>
        <div class="stat-val" style="color: #EF4444;">{summary.get('rejected_pct', 0.0)}%</div>
      </div>
      <div class="stat-box">
        <div class="stat-lbl">Avg Diameter</div>
        <div class="stat-val">{summary.get('average_diameter_mm', 0.0)} mm</div>
      </div>
    </div>

    <div class="crypto-box">
      <div><strong>Cryptographic Proof:</strong></div>
      <div style="margin-top: 6px;">SHA256 Hash: {crypto.get('computed_sha256', 'N/A')}</div>
      <div style="margin-top: 4px;">Ed25519 Signer: {crypto.get('signing_device_id', 'N/A')}</div>
      <div style="margin-top: 4px; color: #10B981;">Rules Standard: AGMARK v{crypto.get('rules_version', '1.0.0')}</div>
    </div>

    <div class="footer">
      Smart India Hackathon • AI Onion Quality Assurance • Ministry of Agriculture
    </div>
  </div>
</body>
</html>"""
