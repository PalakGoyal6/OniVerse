# PROJECT BRIEF: AI Onion Quality Grading App (Smart India Hackathon)

You are the lead engineer on a Smart India Hackathon team. We have 5 days to build
and submit a complete, working, demo-ready product. Help us build it end to end.

How to work with us:
- Build ONE phase at a time (section 14). Each phase must run before we move on.
- Never break what already works. Prefer simple, reliable solutions over clever ones.
- Explain key design decisions in 1–2 lines as you go.
- Ask before adding a major dependency or changing the architecture.
- Keep a CHANGELOG.md updated so any teammate can pick up the work.

---------------------------------------------------------------------------------

## 1. Problem

Onion quality grading at procurement centres is done by eye. Different inspectors
give different grades for the same onions, which causes disputes between farmers
and buyers and reduces trust in the process.

Required by the problem statement:
- Use image processing to assess onion quality.
- Identify damaged, rotten, sprouted and undersized onions.
- Estimate Grade A and URS percentages.
- Generate a digital quality report instantly.
- Reduce human bias and improve transparency.

## 2. Our product in one line

A mobile app that grades a sample of onions from a photo in seconds — with real
size measurement, estimated weight, explained decisions and a tamper-proof,
QR-verifiable report — working fully offline in Hindi, Marathi and English,
plus a web dashboard that lets supervisors monitor consistency and disputes.

## 3. Core principles (every feature must serve these)

1. CONSISTENT: the same onions must get the same grade every time.
2. EXPLAINABLE: every decision on every onion can be tapped and explained.
3. TAMPER-PROOF: reports cannot be edited after creation without detection;
   every human override is recorded with a reason.
4. HONEST ABOUT UNCERTAINTY: low-confidence onions are marked
   "needs manual check" instead of guessed.
5. WORKS IN A MANDI: offline, cheap Android phones, poor lighting, local languages,
   minimal typing.

## 4. Users and roles

- INSPECTOR (main user): creates lots, scans samples, reviews results,
  issues reports. Logs in with a 4-digit PIN (shared phones are common).
- FARMER: no login, identified by phone number. Can self-check onions,
  verify a report by QR, view history, raise a dispute.
- SUPERVISOR / ADMIN: web dashboard. Monitors all centres, resolves disputes,
  edits grading rules, views audit log.

## 5. Tech stack

- Mobile: Flutter (Dart), Android first.
  - On-device inference: tflite_flutter
  - Image processing / ArUco detection: opencv_dart
  - Local storage: sqflite (or drift) for lots/reports, app documents dir for images
  - PDF: `pdf` + `printing` packages
  - QR: `qr_flutter`
  - Sharing: `share_plus` (WhatsApp/SMS)
  - Voice readout: `flutter_tts` (hi-IN, mr-IN, en-IN)
  - i18n: flutter_localizations with ARB files (en, hi, mr)
  - Crypto: `cryptography` package (SHA-256, Ed25519)
- ML (training + reference pipeline): Python 3.11, Ultralytics YOLO
  (segmentation model, nano or small), OpenCV, NumPy, scikit-learn, pandas.
  Labelling in Roboflow (export YOLO segmentation format).
- Backend: FastAPI, PostgreSQL, SQLAlchemy, Pydantic, local file storage for
  images/PDFs (S3-compatible optional later), JWT auth for supervisors.
- Web dashboard: React + Vite + TypeScript, TailwindCSS, Recharts,
  Leaflet (centre map), TanStack Query.
- Everything backend-side runs with docker-compose and a Makefile.

## 6. Repository structure

onion-grader/
├── README.md
├── CHANGELOG.md
├── docker-compose.yml
├── Makefile
├── config/
│   └── grading_rules.json        # single source of truth for grading rules
├── ml/
│   ├── data/
│   │   ├── raw/                  # original photos
│   │   ├── labelled/             # Roboflow export
│   │   └── calibration/          # weight + size calibration CSVs
│   ├── docs/labelling_guide.md
│   ├── pipeline/                 # Python REFERENCE implementation
│   │   ├── marker.py             # ArUco detection + homography
│   │   ├── segment.py            # run YOLO-seg
│   │   ├── measure.py            # mm size from masks
│   │   ├── weight.py             # weight estimation
│   │   ├── match_views.py        # front/back matching
│   │   ├── grade.py              # grading engine
│   │   └── run.py                # full pipeline on one lot
│   ├── train.py
│   ├── export_tflite.py
│   ├── calibrate_weight.py
│   ├── evaluate.py
│   └── golden_tests/             # input images + expected JSON outputs
├── mobile/                       # Flutter app
│   └── lib/
│       ├── main.dart
│       ├── l10n/                 # en, hi, mr ARB files
│       ├── models/
│       ├── services/
│       │   ├── camera_quality.dart
│       │   ├── marker_service.dart
│       │   ├── inference_service.dart
│       │   ├── measure_service.dart
│       │   ├── weight_service.dart
│       │   ├── view_matching.dart
│       │   ├── grading_engine.dart
│       │   ├── report_service.dart
│       │   ├── crypto_service.dart
│       │   ├── sync_service.dart
│       │   └── tts_service.dart
│       ├── screens/
│       └── widgets/
├── backend/
│   └── app/
│       ├── main.py
│       ├── routers/              # auth, lots, reports, verify, disputes, stats, rules, sync, models
│       ├── models/
│       ├── schemas/
│       └── services/
├── dashboard/                    # React supervisor web app
└── docs/
    ├── architecture.md
    ├── api.md
    ├── grading_rules.md
    └── evaluation.md

## 7. Data collection and labelling protocol (Day 1)

Collection:
- Buy onions covering ALL conditions: healthy (various sizes), sprouted, rotten,
  black mould, cut/bruised/damaged, split/double bulbs, very small ones.
- Print ArUco markers (DICT_4X4_50, 50 mm side) on A4 "grading sheets".
  Print a second sheet on a different paper colour for variety.
- Photograph 20–40 onions per photo spread on the sheet, not touching where
  possible. Vary: lighting (daylight, tubelight, dim, harsh shadow), phone model,
  height (30–60 cm), angle (mostly top-down, some tilted up to ~20°),
  background around the sheet. Take front AND flipped photos of each tray.
- Target: 300+ tray photos (roughly 6,000+ onion instances).
- Also start from any public onion/vegetable quality datasets on Roboflow
  Universe or Kaggle for pretraining if useful.

Classes (segmentation masks, one mask per onion):
  0 healthy
  1 sprouted
  2 rotten
  3 black_mould
  4 damaged          (cuts, bruises, crushed, peeled flesh exposed)
  5 split_double     (split or double/twin bulbs)
Priority rule when multiple defects are visible: rotten > black_mould > damaged >
split_double > sprouted. Write ml/docs/labelling_guide.md with example images
for each class so all labellers are consistent.

Split: 70/15/15 train/val/test BY TRAY (never put the same tray in two splits).

## 8. ML pipeline — detailed spec

### 8.1 Segmentation + classification
- Ultralytics YOLO segmentation (nano first; small if accuracy needs it),
  imgsz 640 (try 960 if onions are small in frame).
- Augmentations: brightness/contrast, colour jitter, blur, rotation, scale.
  Do NOT flip colour channels (colour matters for rot/mould).
- If per-class accuracy on defects is weak, add a second-stage classifier
  (e.g. MobileNetV3/EfficientNet-lite) on each cropped onion. Decide based on
  validation results.
- Export to TFLite (FP16 first; INT8 if speed needs it, checking accuracy drop).
- Target: < 3 seconds per photo on a mid-range Android phone.

### 8.2 Marker + real-world scale
- Detect the ArUco marker with OpenCV; compute the homography from its 4 corners
  to a top-down plane in millimetres.
- Warp each onion mask's contour into mm space; fit minAreaRect → length and
  width in mm. Diameter for grading = the smaller of the two (max width across
  the bulb) unless the rules config says otherwise.
- Height correction: onions stand above the sheet, so their tops appear slightly
  larger. Learn a single correction factor from calibration data (ruler/caliper
  measurements vs app measurements) and store it in config.
- If no marker is detected: block capture (guided capture), or in fallback mode
  report counts and defect % only, clearly labelled "size not measured".

### 8.3 Weight estimation
- Model each onion as an ellipsoid: V = (π/6) × L × W × W (mm³ → cm³).
- Fit weight_g = k × V (and compare against weight_g = a × V^b) using
  ml/data/calibration/weights.csv (≥100 onions weighed individually on a
  kitchen scale + measured via the app). Pick the better model by MAE.
- Report per-onion estimated weights, and lot-level percentages BY WEIGHT and
  BY COUNT. Always label as "estimated".
- If the inspector enters the actual sample weight from a scale, scale all
  per-onion estimates proportionally so they sum to the real weight.

### 8.4 Two-view (front/back) fusion
- User is instructed to flip the onions IN PLACE on the sheet.
- Warp both images into the marker's mm plane using their homographies.
- Match onions between views with the Hungarian algorithm on a cost combining
  centroid distance (mm) and size difference. Reject matches beyond a threshold.
- Fused onion status = the WORST status across its views
  (per priority rule in 7). Size = average of both views.
- Unmatched onions: keep, mark "single view" in the explanation.

### 8.5 Confidence and uncertainty
- Each onion gets a class confidence. If max confidence < threshold
  (config, default 0.55), or the two views disagree strongly, mark it
  NEEDS_MANUAL_CHECK. These must be resolved by the inspector before a
  report can be issued.

### 8.6 Grading engine
- All rules live in config/grading_rules.json — NOTHING hardcoded.
  The same JSON is bundled in the app and editable from the dashboard
  (versioned; each report records the rules version used).
- IMPORTANT: the exact Grade A and URS definitions (size cutoffs, allowed defects,
  tolerances) must match the official standard (AGMARK onion grade
  specifications / procurement agency specifications). Use clearly marked
  PLACEHOLDER values until the team confirms the official ones, and list them in
  docs/grading_rules.md with the source.
- Per-onion output: grade (GRADE_A | URS | REJECTED | NEEDS_MANUAL_CHECK)
  plus a list of human-readable reasons.
- Lot output: counts and weight-based percentages per grade, defect breakdown,
  size distribution histogram, average diameter.

### 8.7 Python reference pipeline and parity tests
- ml/pipeline is the reference implementation of 8.2–8.6.
- ml/golden_tests holds ~10 lots (images + expected JSON output).
- The Dart implementation in the app must produce the same results on the
  golden tests (within small numeric tolerance). Add a Flutter integration test
  for this. This prevents the app and the ML team drifting apart.

## 9. Mobile app — screens and behaviour

S1. Onboarding / language picker (Hindi, Marathi, English; switchable anytime).
S2. Role select: Inspector (PIN login) / Farmer (phone number).
S3. Inspector home: "New lot" button, today's lots, pending sync count,
    pending disputes.
S4. New lot form: farmer name, farmer phone, variety (dropdown), total lot
    weight (kg, optional), sample weight (kg, optional), lot ID (auto),
    centre + GPS + timestamp (auto). Big inputs, minimal typing.
S5. Guided capture:
    - Live camera with an overlay showing where the sheet should be.
    - Real-time checks with ticks: marker detected, brightness OK
      (mean luminance in range), sharp (variance of Laplacian above threshold),
      sheet fully in frame, phone roughly parallel (marker not too skewed).
    - Capture button enabled only when all checks pass.
    - Step 1 "Front photo" → Step 2 "Flip onions in place" (short animation)
      → Step 3 "Back photo".
S6. Processing: progress indicator; everything on-device.
S7. Results:
    - Annotated image with colour-coded outlines (green Grade A, yellow URS,
      red Rejected, grey Needs check), toggle front/back view.
    - Tap an onion → bottom sheet: class, confidence, diameter mm, estimated
      weight, grade, reasons, both view crops.
    - Summary cards: Grade A %, URS %, Rejected % (by weight, with by-count
      toggle), defect breakdown, size histogram.
    - Optional estimated lot value (see 11) clearly labelled "indicative".
S8. Inspector review:
    - Resolve every NEEDS_MANUAL_CHECK onion.
    - Override any onion's class/grade; a reason from a list is REQUIRED
      (e.g. "rot visible underneath", "model misread shadow", other + text).
    - Overrides are stored with before/after values and shown on the report.
S9. Report preview + issue:
    - Issuing a report creates the canonical report JSON, hashes it, signs it,
      generates the PDF and QR, and appends to the local audit chain (section 10).
    - Share via WhatsApp/SMS; voice readout of the summary in the chosen language.
S10. Lot history + search; sync status per report.
Farmer screens:
F1. Self-check mode: same capture + results, no report issued, marked
    "self-check, not official".
F2. Scan/verify a report QR (works offline for signature check if the
    inspector's public key is cached; otherwise online verification).
F3. My reports (by phone number, when online).
F4. Raise dispute on a report: reason + optional photo → queued for supervisor.

UX rules: large buttons, icons with text, high contrast, works one-handed,
every string translated, no English-only error messages.

## 10. Transparency and tamper-proofing

- Canonical report JSON: lot details, per-onion results, lot summary, overrides,
  model version, rules version, app version, inspector ID, device ID, timestamps,
  SHA-256 hashes of the original photos.
- report_hash = SHA-256 of the canonical JSON (sorted keys, no whitespace).
- Each inspector device generates an Ed25519 key pair on first login; the public
  key is registered with the backend. The report_hash is signed with the
  private key.
- QR encodes: report_id + report_hash + signature (compact) + verify URL.
- Verification page (backend) recomputes the hash from the stored report and
  checks the signature → shows GENUINE / MODIFIED / UNKNOWN clearly, with the
  report summary and photos.
- Audit log: append-only table where each entry stores the previous entry's
  hash (hash chain), for report issue, override, dispute, resolution, rules
  change. Provide an endpoint that verifies the whole chain.

## 11. Backend (FastAPI)

Endpoints (document all in docs/api.md; OpenAPI auto-generated):
- POST /auth/inspector/login (PIN + device), POST /auth/supervisor/login (JWT)
- POST /devices/register-key
- POST /sync/reports (batch upload from offline phones, idempotent by report_id)
- GET  /reports, GET /reports/{id} (filters: centre, date range, inspector,
  farmer phone, grade range, variety, has_override, disputed)
- GET  /verify/{report_id} (public HTML page + JSON)
- POST /disputes, GET /disputes, PATCH /disputes/{id}
- GET  /stats/overview, /stats/centres, /stats/inspectors, /stats/defects, /stats/trends
- GET/PUT /rules (versioned grading rules)
- GET  /models/latest (model version + download URL for app updates)
- GET  /audit/verify-chain
- GET  /prices?commodity=onion&market=... (cached indicative prices from
  Agmarknet data; must fail gracefully and never block grading)

## 12. Supervisor web dashboard

- Overview: lots today/week, average Grade A %, disputes open, map of centres.
- Reports browser with all filters, report detail with photos and overrides.
- Consistency monitoring:
  - Override rate per inspector, and the direction of overrides
    (do they mostly lower grades?).
  - Centre comparison: flag centres whose average grades deviate strongly
    from nearby centres in the same period.
  - Clear visual flags with explanations.
- Disputes queue: original scan vs re-scan side by side, resolve with note.
- Grading rules editor (versioned, with change history in the audit log).
- Analytics: grade trends over time, defect frequencies by week/region.
- Audit log viewer with chain verification status.

## 13. Evaluation (must produce real numbers → docs/evaluation.md)

- Detection/segmentation mAP on the test split.
- Per-class precision, recall, F1 and a confusion matrix.
- Size accuracy: app vs caliper/ruler, mean absolute error in mm.
- Weight accuracy: per-onion MAE and lot-total % error.
- Grade % error vs careful expert/manual grading on held-out lots.
- Consistency test: same lot scanned 10 times (repositioned) → standard deviation
  of Grade A %.
- Human bias study: 4–5 people independently grade the same 5 lots → spread of
  their Grade A % vs the app's spread. Produce a chart.
- Speed: seconds per scan on a mid-range phone.
Write evaluate.py to generate all tables and charts automatically.

## 14. Build phases

Phase 1 (Day 1) – Foundations:
  repo + docker-compose; data collection + labelling guide; Flutter app skeleton
  with navigation, i18n setup, camera screen; grading_rules.json with placeholders.
  GOAL: photos being collected, app opens and takes a picture.
Phase 2 (Day 2) – First model end to end:
  train YOLO-seg v1; export TFLite; app runs inference and draws outlines;
  ArUco detection + mm measurement in Python and Dart.
  GOAL: photo → coloured outlines with sizes in mm on the phone.
Phase 3 (Day 3) – Grading + report:
  grading engine (Python + Dart) with golden tests; results screen with
  tap-to-explain; guided capture checks; report JSON, hash, signature, PDF, QR,
  share, voice readout; backend verify page.
  GOAL: full scan → signed report → QR verifies as GENUINE.
Phase 4 (Day 4) – Winners + freeze:
  two-view fusion; weight calibration + by-weight percentages; inspector review
  and overrides; offline storage + sync; model v2 retrained on more data;
  evaluation numbers + bias study. Dashboard basics if time.
  FEATURE FREEZE in the evening — bugs only after this.
Phase 5 (Day 5) – Ship:
  dashboard polish (if built), farmer mode (if time), demo rehearsal x3,
  backup demo video, README, architecture diagram, PPT, submit early.

Cut order if behind: price estimate → dashboard analytics → farmer dispute flow
→ farmer self-check → two-view fusion (fall back to single photo).
NEVER cut: accurate defect detection, mm size measurement, grading with reasons,
signed QR report, offline, Hindi.

## 15. Demo scenario

1. Inspector logs in (Hindi UI), creates a lot for a farmer.
2. Guided capture: show the ticks turning green; front photo, flip, back photo.
3. Results in ~3 seconds; tap a sprouted onion and an undersized one to show
   reasons; show an onion that looked fine on top but was rotten underneath,
   caught by the back view.
4. Issue report → WhatsApp share → voice readout in Hindi.
5. Judge scans the QR with their own phone → GENUINE. Then show a modified
   report → MODIFIED.
6. Dashboard: inspector with a suspicious override pattern gets flagged.
7. Evaluation slide: accuracy, size/weight error, consistency, human bias chart.

## 16. Engineering rules

- No hardcoded thresholds, keys or rules — all in config or .env.
- The app must never crash on a bad photo; always show a helpful message.
- All user-facing strings go through i18n.
- Type hints in Python, strong typing in Dart/TypeScript.
- Tests: grading engine unit tests, golden parity tests, API tests for
  sync/verify.
- Store only necessary personal data (farmer name + phone); no photos of people.
- Record model version, rules version and app version in every report.