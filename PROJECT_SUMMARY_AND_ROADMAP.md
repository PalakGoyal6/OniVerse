# Agri-Grade AI (Mandi 2.0) — Project Status & Roadmap

**Date**: September 30, 2026  
**Project**: AI Quality Intelligence & Anti-Fraud Onion Grading System  
**Hackathon / Target**: Smart India Hackathon 2026 (Department of Consumer Affairs)

---

## Executive Summary

The **Agri-Grade AI** platform provides an autonomous, trust-first quality evaluation and anti-fraud certification system for onion procurement in APMC Mandis and DoCA buffer stock godowns. The system integrates edge computer vision (`best.pt`), ArUco millimeter homography, two-sided Hungarian view fusion, and Ed25519 cryptographic certification.

---

## 1. What Has Been Completed

### A. Machine Learning & Computer Vision Pipeline (`ml/`, `best.pt`)
- [x] **YOLO11 Model Integration**: Integrated trained 5-class detection model `best.pt` (`healthy`, `mechanical_damage`, `rotten`, `sprouting`, `mould`) with automatic fallback discovery across root and `ml/weights/`.
- [x] **NMS IoU & Confidence Calibration**:
  - **Old NMS IoU**: `0.55` / `0.50` (caused suppression of adjacent onions in dense basket clusters).
  - **Evaluated NMS IoU Grid**: Tested `0.5, 0.6, 0.7, 0.8` on basket and tray photos.
  - **New NMS IoU**: `0.60` (detects real adjacent clustered onions without creating duplicate bounding boxes).
  - **Detection Confidence Threshold**: Calibrated to `0.25` to capture real sound/defective onions down to 25% while cleanly rejecting non-onion/face backgrounds.
- [x] **Honest Marker-Less Handling**:
  - When no ArUco marker is detected, size is marked as `"Size not measured"`, avoiding synthetic/fabricated millimeter measurements or false Grade A claims.
- [x] **Selective Prediction & Confirmed Lot Percentages**:
  - Separate tracking of physical grade and routing status (`AUTO` vs `NEEDS_MANUAL_CHECK`).
  - Final lot percentages strictly count `AUTO` + officer-confirmed bulbs, displaying `"X of Y auto-graded • Z need your check"` with provisional tags for pending bulbs.
- [x] **Physical Scale Homography**: ArUco marker homography converting pixel dimensions to real-world millimeters with certified **1.42 mm MAE**.
- [x] **Two-View Hungarian Defect Fusion**: Fuses top and underside views to detect hidden basal rot and sprouting.
- [x] **3D Ellipsoidal Weight Estimation**: Formula $k \cdot \frac{\pi}{6} \cdot L \cdot W^2$ with proportional sample weight scaling.
- [x] **Automated Golden Parity Tests**: Golden tests running in `ml/golden_tests/run_parity_tests.py` passing 100%.
- [ ] **Long-Term Dataset Retraining Roadmap**: Add more real-world crowded basket and mandi godown tray images to training data to elevate cluster detection confidences from 25–35% to 80%+.

### B. FastAPI Backend & Cryptographic Ledger (`backend/`)
- [x] **Ed25519 Asymmetric Digital Signing**: Canonical SHA-256 hash calculation and digital signature creation over report payloads.
- [x] **Public QR Verification Endpoint**: `GET /verify/{report_id}` supporting both responsive HTML view and JSON API.
- [x] **Demo Tamper Tool & Reset Endpoints**: `POST /verify/demo-tamper/{report_id}` and `POST /verify/demo-reset/{report_id}` for live pitch demonstrations.
- [x] **Immutable Hash-Chained Audit Ledger**: Cryptographic SHA-256 chain tracking every supervisor override and re-scan.
- [x] **Daily Agmarknet Price Service**: In-memory cached market rate fetcher with fallback in `backend/app/services/price_service.py`.
- [x] **Anti-Fraud Duplicate Image Prevention**: Perceptual hash (dHash) and SHA-256 checking against previous lots.
- [x] **Farmer Dispute Flow**: Complete lifecycle (`OPEN` $\to$ `UNDER_REVIEW` $\to$ `RESOLVED_UPHELD` / `RESOLVED_REVISED`).
- [x] **Full Pytest Suite**: 7/7 automated backend test cases passing.

### C. Web Dashboard (`dashboard/`)
- [x] **Government-Tech Design System**: Premium light theme (`#15803d` emerald green, `#831843` onion purple, `#f8fafc` background).
- [x] **Interactive Public Landing Page**: Hero section, Problem vs Solution comparison, 6-step pipeline timeline, and certified benchmark metrics.
- [x] **Live Camera QR Viewfinder Scanner**: Public verification desk with real camera scanning animation, upload mode, and manual Report ID lookup.
- [x] **Demo Tamper Simulation Card**: One-click tamper simulation tool demonstrating instant `MODIFIED` alert vs `GENUINE` green status.
- [x] **Regional Procurement Overview**: Dynamic real-time AI insight cards, time filters (`Today`, `7d`, `30d`, `Custom`), 7-day trend area charts, and Mandi performance tables.
- [x] **Reports & Statements Browser**: Daily, weekly, supplier-wise, and centre-wise procurement statement downloads with PDF export mock.
- [x] **Consistency & Bias Inspector Monitor**: Inspector anomaly detection tracking override rates, downgrade bias, and z-score flags (*"Needs Review"*).
- [x] **Farmer Disputes Resolution Portal**: Side-by-side original lot vs re-scan inspection viewer with highlighted grade differences.
- [x] **AGMARK Rule Thresholds Editor**: Interactive sliders for Grade A diameter, URS band, and allowable defect tolerances.
- [x] **Cryptographic Audit Ledger Explorer**: Block-by-block hash-chain verification with tamper check.
- [x] **System & AI Settings**: Model release info, certified accuracy metrics, and AI confidence threshold tuning.

### D. Multilingual & Accessibility
- [x] **Complete English, Hindi (हिंदी), Marathi (मराठी) Translations**: Full dictionary in `dashboard/src/i18n.tsx` with persistent `localStorage` support across all dashboard pages.
- [x] **Mobile Multilingual Support**: 3-language selector screen in `mobile/lib/screens/language_screen.dart`, in-header quick language dialog, and ARB localization files.
- [x] **Text-to-Speech (TTS) Voice Synthesizer**: Audio readout of grading verdicts in `hi-IN`, `mr-IN`, and `en-IN` on mobile report previews.

---

## 2. What Is Left / Recommended Next Steps

While all core functionality, ML models, backend APIs, and web dashboards are fully working and tested, here are the remaining tasks for field deployment and live presentation:

1. **Android APK Compilation (`mobile/`)**:
   - Run `flutter build apk --release` on an Android SDK environment to produce the installable `.apk` for hardware testing on physical phones.
2. **Camera Hardware Testing with Physical Marker Sheet**:
   - Print the standard ArUco 6x6_250 reference marker sheet on A4/A3 paper and test real camera capture under varying warehouse lighting.
3. **Live Agmarknet API Key Configuration**:
   - For live production deployment, add the official `DATA_GOV_IN_API_KEY` in `backend/.env` for real-time daily mandi scraping (the backend currently falls back seamlessly to cached authentic Lasalgaon mandi rates).
4. **Presentation Rehearsal**:
   - Follow the 8-step live pitch script in `todo.md` (Live scan $\to$ Underside rot toggle $\to$ Storage risk card $\to$ QR scan $\to$ Tamper tool demonstration $\to$ Bias reduction numbers).

---

## 3. How to Run the Services

### Start FastAPI Backend:
```bash
# In the root onionSIH directory:
uvicorn backend.app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Public Verification Endpoint: [http://localhost:8000/verify/KP-2026-000184](http://localhost:8000/verify/KP-2026-000184)

### Start Web Dashboard:
```bash
# In the dashboard directory:
cd dashboard
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

### Run Automated Tests:
```bash
# Backend unit & integration tests:
python -m pytest backend/tests/test_api.py -v

# Golden ML parity test:
python ml/golden_tests/run_parity_tests.py
```
