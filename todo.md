# USP FEATURE PACK: "Trust-First Grading" (add-on to the main project brief)

Context: the base app from the main brief is being built. The model is DONE:
a YOLO11n DETECTION model (bounding boxes, not segmentation), imgsz 640,
5 classes:
  0 healthy, 1 mechanical_damage, 2 rotten, 3 sprouting, 4 mould
Current results: mAP50 ≈ 71.5%, precision 75%, recall 70%.
"Undersized" is NOT a model class: it comes from marker-based mm measurement
(section 8.2 of the main brief), using bounding-box width/height converted to mm
through the marker homography (onions are near-round, so use the box's shorter
side as diameter, then apply the calibrated height-correction factor).

Our USP: TRUST-FIRST GRADING.
"AI that knows when it's unsure, results nobody can secretly change, capture
that can't be faked, and proof that it's fairer than human graders."
Every feature below must serve that story. Build them in the order given.
For each feature: implement, test against the acceptance criteria, update
CHANGELOG.md, and do not break existing flows.

=================================================================================
FEATURE 1 — CONFIDENCE-ROUTED GRADING (selective prediction)       [~0.5 day]
=================================================================================
Goal: the AI auto-grades onions it is confident about and routes uncertain ones
to the officer. We turn a moderate model into a trustworthy system by measuring
accuracy on the confident subset.

ML side (Python, ml/selective/):
1. Run the model on the VALIDATION set. For every detected onion matched to a
   ground-truth box (IoU ≥ 0.5), record: predicted class, confidence, true class.
   Unmatched predictions = false positives; unmatched ground truths = misses.
2. For each class, sweep confidence thresholds 0.05–0.95 and compute:
   - coverage = share of detections at or above the threshold
   - precision/accuracy on that covered subset
3. Choose a PER-CLASS threshold that reaches a target accuracy (config,
   default 0.90) while keeping coverage as high as possible. If a class can't
   reach the target at any threshold, set its threshold so all its predictions
   go to manual review, and report that honestly.
4. Output config/confidence_thresholds.json (per class) with the version of the
   model it was computed for.
5. Plot a risk–coverage curve (accuracy vs coverage) overall and per class →
   docs/evaluation/selective_prediction.png.
6. Evaluate on the TEST set (never tune on it) and report:
   "AI auto-grades X% of onions at Y% accuracy; the remaining Z% are routed to
   the officer." These are the numbers for the pitch — they must be real.

App side:
- After inference, each onion gets status AUTO (conf ≥ its class threshold) or
  NEEDS_MANUAL_CHECK.
- Also mark NEEDS_MANUAL_CHECK when:
  a) the front and back views disagree (feature 6), or
  b) the top-2 class confidences are within 0.10 of each other (ambiguous).
- Results screen: badge per onion ("AI-certain" vs "Needs your check"),
  summary line "38 of 45 auto-graded • 7 need your check".
- Report cannot be issued until every NEEDS_MANUAL_CHECK onion is resolved.
- Settings (supervisor only): target accuracy slider → shows the resulting
  coverage from the stored curve. Thresholds are never editable by inspectors.

Acceptance:
- Thresholds JSON generated from real validation data.
- Test-set numbers written to docs/evaluation.md.
- Low-confidence onions reliably appear in the manual-check list.

=================================================================================
FEATURE 2 — TAMPER-PROOF SIGNED REPORTS + QR VERIFICATION           [~1 day]
=================================================================================
Implement section 10 of the main brief fully. Specifics:
- Canonical report JSON (sorted keys, UTF-8, no whitespace) containing: report
  ID, lot details, per-onion results (class, confidence, AUTO/MANUAL status,
  box, diameter, est. weight, grade, reasons), overrides with before/after and
  reason, lot summary, storage risk (feature 5), photo SHA-256 hashes, photo
  perceptual hashes (feature 3), capture metadata, model version, thresholds
  version, rules version, app version, inspector ID, device ID, timestamps.
- report_hash = SHA-256(canonical JSON). Signature = Ed25519 over report_hash
  using the device key generated at first inspector login (private key stored
  in Android Keystore-backed secure storage; public key registered with backend).
- QR payload: compact string with report_id, report_hash (base64url),
  signature (base64url), verify URL.
- Backend GET /verify/{report_id}: recompute hash from the stored canonical JSON,
  verify signature with the registered public key, compare with the QR hash if
  provided. Return GENUINE / MODIFIED / UNKNOWN.
- Public verify web page: big status badge (green GENUINE, red MODIFIED,
  grey UNKNOWN), report summary, photos, officer, centre, timestamp. Also a
  manual "Enter report ID" box.
- DEMO TAMPER TOOL (admin-only, clearly labelled, disabled in production
  builds): edits one number in a stored copy of a report so we can show
  MODIFIED live.
- In-app offline check: if the officer's public key is cached, the app can verify
  a scanned QR's signature without internet.

Acceptance:
- Scanning an issued report's QR with any phone camera opens the verify page
  showing GENUINE.
- After using the demo tamper tool, the same QR shows MODIFIED.

=================================================================================
FEATURE 3 — ANTI-FRAUD CAPTURE                                       [~0.5 day]
=================================================================================
Goal: nobody can grade a bad lot using old photos of good onions.
1. Official inspection mode allows LIVE CAMERA CAPTURE ONLY. Gallery upload is
   available only in farmer self-check mode and Demo Mode, and such results are
   watermarked "Not an official assessment".
2. At capture, record: timestamp (device + server time when online), GPS
   (geolocator; if unavailable, record "no GPS" rather than failing), device ID,
   app version. Store with the photo and include in the signed report.
3. Compute SHA-256 of each photo file (exact integrity) and a 64-bit
   perceptual hash (dHash on a 9x8 grayscale resize, implemented in Dart with the
   `image` package) for similarity.
4. Duplicate check:
   - Locally: compare against all perceptual hashes on the device.
   - On sync: backend compares against all hashes across all centres.
   - Hamming distance ≤ 6 (configurable) → flag:
     "This image closely matches a photo used in lot KP-000142 (12 Sep)."
   - A flagged photo blocks report issue unless a supervisor approves it
     (logged in the audit chain).
5. Show a small "Capture verified: live • GPS • time" badge on the report.
6. Backend endpoint POST /images/check-duplicate {phash} → matches list.

Acceptance:
- Re-photographing a printed/on-screen copy of an earlier tray photo, or reusing
  the same file, triggers the duplicate warning in the demo.

=================================================================================
FEATURE 4 — PROOF OF BIAS REDUCTION (study + consistency test)       [~0.5 day]
=================================================================================
This is mostly a protocol + analysis script. Build ml/bias_study/.

Protocol (write docs/bias_study_protocol.md):
- Prepare 5 lots of 30–50 onions each, mixed quality.
- 4–5 people grade each lot INDEPENDENTLY by eye (they must not see each other's
  answers or the app result): record Grade A %, URS %, rejected %.
- One person does a careful "reference" grading with a ruler/caliper for size and
  close inspection for defects → reference values.
- App consistency: each lot is scanned 10 times, reshuffling the onions on the
  sheet between scans.

Data: bias_study/human_grades.csv, reference.csv, app_runs.csv.

Script (analyse.py) outputs:
- For each lot: human Grade A % spread (min–max, std dev) vs app spread across
  10 runs.
- Mean absolute error vs reference: humans vs app.
- Charts: (a) per-lot dot plot of human grades vs app runs vs reference,
  (b) bar chart of spread: humans vs app.
- A one-line summary for the pitch, e.g. "Human graders disagreed by up to X
  points on the same lot; the app varied by Y points across 10 rescans."
Numbers must come from the real study.

=================================================================================
FEATURE 5 — STORAGE-LIFE RISK SCORE                                  [~0.5–1 day]
=================================================================================
Why: DoCA manages onion buffer stock; procured onions are stored for months.
Officials need to know which lots will store well.

Implementation (grading engine extension; same logic in Python + Dart,
covered by golden tests):
- Inputs from the lot result: % rotten, % mould, % mechanical_damage,
  % sprouting, size distribution (share undersized), share of onions needing
  manual check.
- Transparent rule-based score 0–100 (higher = higher risk), weights in
  config/storage_risk.json, e.g. (PLACEHOLDER weights, tune with the team):
  risk = w_rot*rotten% + w_mould*mould% + w_damage*damage% + w_sprout*sprouting%
         + w_small*undersized% + w_uncertain*manual_check%
  plus hard rules: any rotten or mould presence above a small threshold
  → at least MEDIUM, since rot spreads in storage.
- Bands: LOW (suitable for long-term storage), MEDIUM (short-term storage,
  inspect regularly), HIGH (dispatch/consume soon; do not store).
- Output reasons ("4% mould detected — mould spreads in storage").
- UI: a "Storage suitability" card on results and report with band colour,
  score, reasons, and the label "Indicative — based on visible defects".
- Dashboard: filter/sort lots by storage risk.

Acceptance:
- Every lot gets a band with reasons; weights live in config, not code;
  report shows the "indicative" label.

=================================================================================
FEATURE 6 — TWO-SIDE SCAN FOR HIDDEN DEFECTS                         [~1 day]
=================================================================================
Implement section 8.4 of the main brief with the detection model:
- Capture front → animated instruction "Flip onions in place" → capture back.
- Map both images to the marker's mm plane via homography; transform box centres.
- Match with the Hungarian algorithm (scipy in Python; implement a simple
  Hungarian or greedy nearest-neighbour with max distance in Dart for up to
  ~50 onions) on centre distance (mm) + size difference. Max match distance in
  config (default 25 mm).
- Fused class = worst class across views using priority:
  rotten > mould > mechanical_damage > sprouting > healthy.
- If views disagree on healthy vs any defect → mark "defect found on one side"
  in the reasons; if the defect-side confidence is below threshold →
  NEEDS_MANUAL_CHECK.
- Unmatched onions: keep, reason "single view only".
- Results screen: toggle Front / Back, and a highlight "3 defects found only on
  the underside".

Acceptance:
- Demo tray with one onion rotten only underneath: it's marked healthy in the
  front view but rotten in the final result, with the reason shown.

=================================================================================
FEATURE 7 — WEIGHT-BASED PERCENTAGES                                 [~0.5 day]
=================================================================================
Implement section 8.3 of the main brief:
- Calibration: weigh ≥100 onions individually, photograph them on the marker
  sheet, record measured L and W from the app → ml/data/calibration/weights.csv.
- Fit weight_g = k × V where V = (π/6) × L × W × W (and compare the a × V^b form);
  choose by mean absolute error; store coefficients in config.
- If the officer enters the actual sample weight from a scale, rescale estimates
  to match it.
- Show Grade A / URS / Rejected by weight (default) with a by-count toggle;
  always labelled "estimated weight".
- Report: "Grade A: 18.4 kg of 25.0 kg (73.6%)".

=================================================================================
FEATURE 8 — VISUAL EXPLANATIONS                                      [~0.5 day]
=================================================================================
Because the model is detection-only and runs as TFLite (no gradients on device):
- ON DEVICE (always available): tapping an onion shows an enlarged crop of its
  box from front and back views, with the box outline in the status colour,
  class, confidence bar, diameter, est. weight, grade, reasons.
- SERVER SIDE (when online, for the report and dashboard): generate an
  EigenCAM heatmap (gradient-free, works with YOLO; e.g. the pytorch-grad-cam
  library's EigenCAM on the model's last backbone layer) for each defective onion
  crop. Return a heatmap overlay image; attach to the report's evidence section.
- Label: "Highlighted regions influenced the AI's decision."
- If heatmap generation fails, silently fall back to crops only.

=================================================================================
FEATURE 9 — FAIR PRICE ESTIMATE                                      [~0.5 day]
=================================================================================
- Backend job fetches daily onion prices (min / max / modal) for configured
  markets from the government's Agmarknet data (via the data.gov.in API — API key
  in .env). Cache results in Postgres; refresh daily.
- GET /prices?market=...&date=... returns latest cached values + date.
- Indicative lot value: by-weight grade split × a price per grade. Grade price
  mapping lives in config/price_mapping.json (e.g. Grade A = modal price,
  URS = a configured fraction of modal, rejected = 0) with PLACEHOLDER values.
- App: "Indicative value" card: "≈ ₹X for this lot at today's Lasalgaon modal
  price (date)". Always labelled "Indicative, not a procurement price".
- Offline: show last cached price with its date, or hide the card.
- Grading must never wait on or fail because of pricing.

=================================================================================
FEATURE 10 — INSPECTOR CONSISTENCY MONITORING (dashboard)            [~1 day]
=================================================================================
Data: every override is stored with before/after class and grade, reason,
inspector, centre, lot, timestamp (already required in the main brief).

Metrics per inspector (selectable period):
- override_rate = overridden onions / total graded onions
- downgrade_share = downgrades / all overrides (grade moved worse for farmer)
- net_grade_delta = mean(final Grade A % − AI Grade A %) per lot
- disputes raised against their reports
Metrics per centre:
- mean Grade A %, compared with the average of other centres in the same period
  (z-score); same override metrics aggregated.

Flags (thresholds in config):
- override_rate or downgrade_share with z-score > 2 vs peers → "Unusual override
  pattern".
- centre mean Grade A % z-score < −2 → "Centre grades significantly below peers".
- Each flag shows the evidence: numbers, chart, and links to the lots involved.

Dashboard page "Consistency & Integrity":
- Inspector table with metrics and flag badges; click → detail with override
  history and example photos.
- Centre comparison bar chart.
- Wording must be neutral: "Needs review", never accusatory.

Seed demo data including one inspector with a clearly unusual downgrade pattern.

=================================================================================
FEATURE 11 — DISPUTE RESOLUTION FLOW                                 [~0.5–1 day]
=================================================================================
States: OPEN → UNDER_REVIEW → RESOLVED_UPHELD | RESOLVED_REVISED.
- Farmer (via report link/QR page or app) raises a dispute: reason (list + text),
  optional photo.
- Supervisor queue in dashboard; opening a dispute shows the original report.
- Supervisor (or another inspector) performs a RE-SCAN of the same lot, linked
  to the dispute. Dashboard shows original vs re-scan side by side: photos,
  grade split, differences highlighted.
- Resolution: uphold original, or issue a revised report (new signed report that
  references the original ID; original stays intact and verifiable, marked
  "superseded by KP-…").
- Every step goes into the hash-chained audit log; farmer gets the outcome via
  SMS/WhatsApp share.

=================================================================================
FEATURE 12–14 — ACCESSIBILITY                                        [~1.5 days total]
=================================================================================
12. Hindi / Marathi / English everywhere (ARB files), plus voice readout of the
    result with flutter_tts, e.g. hi-IN: "Aapke pyaaz ka 72 pratishat Grade A hai.
    Storage ke liye upyukt." Readout button on results and report.
13. WhatsApp share: share_plus with the PDF + a short text summary + verify link.
14. Offline: all grading on-device; reports queue locally with Pending / Synced /
    Failed states, auto-retry, "Sync now". Duplicate-photo and price features
    degrade gracefully offline.

=================================================================================
BUILD ORDER AND OWNERS (6 people, parallel)
=================================================================================
ML (2):     F1 thresholds + risk-coverage + test numbers → F8 EigenCAM service
            → support F4 analysis.
App (2):    F6 two-side scan → F7 weight → F1 app routing → F3 anti-fraud capture
            → F12–14.
Trust (1):  F2 signing + verify page + demo tamper tool → F3 backend duplicate
            check → F5 storage risk.
Dashboard + proof (1): F10 consistency → F11 disputes → F9 pricing
            → run F4 bias study with the whole team.

Day plan:
Day 1: F1 (ML), F2 start, F6 start, F4 protocol + collect human grades.
Day 2: F2 done, F6 done, F3, F7 calibration, F10 start.
Day 3: F5, F8, F10 done, F11, F12–13, F4 analysis.
Day 4: F9, F14, full end-to-end testing, all numbers into docs/evaluation.md.
        FEATURE FREEZE in the evening.
Day 5: demo rehearsal (x3), backup video, PPT, README, submit early.

Cut order if behind: F9 price → F11 disputes → F8 EigenCAM (keep crops) → F7 weight.
NEVER cut: F1, F2, F3, F4, F5, F6.

=================================================================================
DEMO SCRIPT FOR THESE FEATURES
=================================================================================
1. Live scan of a tray: "38 of 45 auto-graded, 7 need your check" → officer
   resolves them with reasons.
2. Toggle to back view: "rot found only on the underside" of one onion.
3. Storage card: "MEDIUM risk — 4% mould detected, store short-term only."
4. Issue report → judge scans QR with own phone → GENUINE.
5. Demo tamper tool → rescan → MODIFIED.
6. Try to reuse an old photo → duplicate warning with the original lot ID.
7. Dashboard: flagged inspector with unusual downgrade pattern.
8. Slide: bias study chart + selective-prediction numbers.

=================================================================================
HONESTY RULES
=================================================================================
- Every number shown to judges comes from our real evaluation or study.
- Storage risk, price and weight are always labelled indicative/estimated.
- No blockchain claims; we use cryptographic hashes, digital signatures and a
  hash-chained audit log, and we say exactly that.