## 17. UI/UX and presentation additions

### 17.1 Visual identity (apply to the mobile app AND the web dashboard)
- Premium government-tech / agri-tech look: clean, trustworthy, data-driven,
  agricultural but not rustic. Must NOT look like a basic student CRUD app.
- Light theme: white/off-white backgrounds, deep green primary brand colour,
  subtle onion purple/red accents, neutral grey text.
- Status colours used consistently everywhere: green = Grade A / healthy,
  amber = URS / warning, red = rejected / rotten / damaged,
  grey = needs manual check, blue = informational.
- Rounded cards, soft shadows, large statistics, progress bars, donut charts,
  badges, status indicators, image overlays. Minimal gradients, subtle animations.
- Clear typography hierarchy, generous spacing, accessible contrast, large touch
  targets. Loading, empty and error states on every screen. Toasts for key actions.
- Simple onion-inspired SVG logo (no external assets) and a small label:
  "Department of Consumer Affairs • AI Quality Intelligence".

### 17.2 Onboarding (mobile)
- 3 short intro screens before first login: the problem (subjective grading →
  disputes), how it works (Capture → Detect → Grade → Verify → Report), and
  "Transparent by design" (AI result + confidence + reason + officer verification).
- A "Why [App name]?" card reachable from the profile/about screen listing the USPs:
  objective grading, explainable detection, human-AI verification, instant signed
  reports, QR verification, traceability, offline-first, multilingual, analytics,
  continuous improvement from verified corrections.

### 17.3 Inspector home dashboard (replaces the simple S3 home)
- Header: greeting, centre name, sync status pill ("✓ Synced" / "● Offline,
  3 pending"), notifications bell, profile.
- KPI cards: inspections today, lots graded, average Grade A %, flagged/disputed lots.
- "Today's quality overview" donut: Grade A / URS / Rejected, plus defect split.
- Recent inspections list (card per lot: lot ID, time, onions, Grade A %, status,
  open report).
- 7-day Grade A trend line.
- "Insight" card computed from REAL stored data (e.g. "Sprouting is today's most
  common defect", "Grade A is 8% above this week's average"). Never canned text.

### 17.4 Inspection flow as a visible stepper
- Stepper at the top of the flow: 1 Lot details → 2 Capture → 3 Analysis →
  4 Verification → 5 Report. User can go back to earlier steps before issuing.
- Lot details: show a sample-size hint ("Recommended sample: 50–100 onions,
  across multiple trays").
- MULTI-TRAY SAMPLES: a lot sample can span several trays. Each tray gets its own
  front/back capture; results are aggregated into one lot result. Show tray
  thumbnails with retake/remove and "Add another tray".
- Capture: tips card ("good lighting, onions separated, avoid shadows, whole
  sheet in frame") alongside the live quality checks. Also allow picking from
  the gallery as a fallback (same quality checks run on the picked image).
- Analysis: animated stage list that maps to the REAL pipeline steps as they run:
  image checks → marker & scale → onion detection → defect classification →
  size & weight → two-view fusion → grading.

### 17.5 Richer results screen
- Batch result card: big donut of Grade A / URS / Rejected (by weight, toggle
  by count), overall model confidence, count of onions needing manual check.
  Keep URS and Rejected as SEPARATE categories per the official rules.
- Defect breakdown bar chart with count, %, and a real example crop per category
  from this lot.
- Size analysis: average / min / max diameter, size-band bar chart
  (large / medium / small / undersized using the configured cutoffs).
- Batch-level "AI Reasoning" card generated from the grading engine output:
  "Why this lot received this result" (✓ points) and "Detected issues" (⚠ points
  with percentages). Plus a clear note: "AI-assisted assessment. Final result is
  certified by the authorised officer."

### 17.6 Human verification screen
- Visual pipeline banner: AI Assessment → Officer Review → Final Certified Result.
- List of onions needing attention (manual-check ones first, then any others the
  officer taps): crop, AI label, confidence bar, [Confirm] [Change].
  Change → pick new class/grade + required reason (existing rule).
- Officer notes field. "Finalize assessment" only enabled when all manual-check
  onions are resolved. Final numbers update live as changes are made.

### 17.7 Report additions
- Report layout sections: header with logo, lot info, quality summary, defect
  summary, size summary, AI reasoning, officer verification status + overrides,
  image evidence thumbnails, report ID, timestamp, QR "Scan to verify".
- Report ID format: e.g. KP-2026-000184 (use the app's prefix).
- Actions: Download PDF, Print, Share (WhatsApp/SMS), Read aloud.

### 17.8 Verification page (public web)
- Heading "Verify Digital Quality Report". Two ways: scan QR, or type the
  report ID manually.
- Result shows the real signature/hash check (GENUINE / MODIFIED / UNKNOWN) plus:
  lot ID, date, centre, Grade A %, URS %, rejected %, officer, status.
- Line of copy: "Digital verification reduces disputes and improves traceability."
- Do NOT claim blockchain.

### 17.9 Offline and sync UX
- Sync status pill in the header everywhere.
- Sync screen: queue of reports with Pending / Synced / Failed states, retry,
  and a "Sync now" button.

### 17.10 Notifications
- In-app notification list, e.g. "Lot KP-184 analysis complete",
  "Lot KP-182 needs manual verification", "Report KP-000184 issued",
  "Dispute raised on KP-000171".

### 17.11 History and reports
- History as searchable cards on mobile (table on web): search by lot ID or
  farmer; filters for date, centre, grade range, status (issued / disputed /
  pending sync).
- Web dashboard Reports page: daily quality report, weekly procurement report,
  supplier/farmer quality report, centre performance report (view / download).

### 17.12 Analytics additions (web dashboard)
- Time filters: Today / 7 days / 30 days / Custom.
- KPIs: average Grade A, average URS, total inspections, total lots, most common
  defect.
- Charts: Grade A trend, URS trend, defect distribution, supplier comparison,
  centre comparison, size distribution.
- Insights generated from real data (never hardcoded).

### 17.13 Settings
- Profile, centre, language (Hindi / Marathi / English), notification preferences,
  offline sync options, data privacy note.
- AI confidence threshold (this is the same NEEDS_MANUAL_CHECK threshold from
  8.5, supervisor-controlled).
- "AI model information" card: model name, version, classes, rules version,
  last updated. Show accuracy ONLY from our real evaluation results.

### 17.14 Demo Mode (presentation safety net)
- A toggle that loads a preloaded sample lot (real images from our own dataset,
  processed by our real pipeline and saved), so judges can walk the full flow
  without placing onions. Clearly badged "Demo Mode" on every screen.
- Live grading with real onions remains the primary demo.

### 17.15 Web dashboard extras
- A polished landing page: hero ("Make onion quality assessment objective"),
  the problem, the solution pipeline, how it works timeline, "Transparent by
  design", call to action.
- Use Lucide icons and Framer Motion for subtle transitions.
