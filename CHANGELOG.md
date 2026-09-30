# Changelog

All notable changes to the AI Onion Quality Grading App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] - 2026-09-30
### Added
- **Config**: Defined `config/grading_rules.json` as single source of truth for AGMARK-compliant onion grading parameters.
- **ML Pipeline**: Implemented reference pipeline modules for ArUco 4x4 marker detection (`marker.py`), segmentation (`segment.py`), mm size measurement (`measure.py`), ellipsoidal weight estimation (`weight.py`), two-view Hungarian fusion (`match_views.py`), and explainable grading engine (`grade.py`).
- **Golden Parity Tests**: Added golden test dataset and verification runner in `ml/golden_tests/`.
- **Backend**: FastAPI server with cryptographic Ed25519 signature verification, hash-chained audit logging, offline sync, public verification page (`/verify/{id}`), disputes queue, Agmarknet price service, and stats API.
- **Web Dashboard**: React + Vite + TypeScript supervisor dashboard with real-time consistency monitoring, inspector bias flags, interactive centre map, disputes resolution desk, grading rules editor, and audit log verifier.
- **Mobile (Flutter)**: Complete Flutter app codebase with Hindi/Marathi/English localization, guided capture checks, on-device grading engine, tap-to-explain inspector UI, tamper-proof QR signing, and farmer self-check & dispute flow.
- **Documentation**: Comprehensive architecture, API specs, evaluation benchmark reports, and labelling guide.
- **Model Integration**: Integrated trained YOLO segmentation weights `best.pt` with automatic discovery, class label normalization, backend live image analysis endpoint (`POST /reports/analyze-image`), and OTA model release registry.
- **UI/UX & Presentation (Section 17)**:
  - **Visual Identity**: Implemented premium government-tech light theme (white/off-white, deep green `#15803D`, onion purple accents, status color system) with official `OnionLogo` ("Department of Consumer Affairs • AI Quality Intelligence").
  - **Web Dashboard**: Added public Landing Page (`LandingPage.tsx`), Public QR & Report Verification portal (`PublicVerifyPage.tsx`), aggregate reports generator tabs (`ReportsBrowserPage.tsx`), real data-driven insights & time filters (`OverviewPage.tsx`), Settings with AI Model certification & confidence sliders (`SettingsPage.tsx`), and Demo Mode toggle.
  - **Mobile (Flutter)**: Implemented 3-screen animated onboarding (`onboarding_screen.dart`), USP showcase (`why_us_screen.dart`), 5-step visible inspection stepper (`inspection_stepper.dart`), multi-tray sampling & capture tips (`new_lot_screen.dart`, `guided_capture_screen.dart`), real animated pipeline stages (`processing_screen.dart`), richer results with separate URS/Rejected donuts & AI reasoning (`results_screen.dart`), and human review with mandatory override audit notes (`review_screen.dart`).
