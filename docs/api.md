# Backend API Specification

All backend endpoints are hosted with FastAPI and documented via OpenAPI `/docs`.

## 1. Authentication
- `POST /auth/inspector/login`: PIN login for mobile devices (`{"pin": "1234", "device_id": "..."}`)
- `POST /auth/supervisor/login`: JWT login for dashboard (`{"username": "admin", "password": "..."}`)

## 2. Device Registration & Keys
- `POST /devices/register-key`: Register Ed25519 public key hex for device signing.

## 3. Report Sync & Query
- `POST /sync/reports`: Idempotent batch upload of offline generated reports.
- `GET /reports`: Filterable query endpoint (`centre`, `farmer_phone`, `variety`, `has_override`, `is_disputed`).
- `GET /reports/{id}`: Detailed report breakdown with canonical JSON and overrides.

## 4. Public QR Verification
- `GET /verify/{report_id}`: Public verification endpoint. Serves styled HTML for browser scans or JSON for API clients.

## 5. Disputes Management
- `POST /disputes`: Farmer appeals against issued quality certificates.
- `GET /disputes`: List open disputes for supervisor workbench.
- `PATCH /disputes/{id}`: Supervisor resolves dispute (`RESOLVED_UPHELD` or `RESOLVED_OVERTURNED`).

## 6. Statistics & Oversight
- `GET /stats/overview`: KPI tiles (totals, yields, active centres).
- `GET /stats/centres`: Mandi comparison & regional baseline anomaly flags.
- `GET /stats/inspectors`: Inspector override frequency and direction of bias analysis.
- `GET /stats/trends`: 7-day quality trend.

## 7. Rules & Model OTA
- `GET /rules`: Active versioned grading rules.
- `PUT /rules`: Update grading rules with audit trail logging.
- `GET /models/latest`: Latest TFLite model weights and sha256 checksum for mobile OTA.

## 8. Cryptographic Audit Chain
- `GET /audit/verify-chain`: Traverses and verifies entire SHA-256 block ledger.
- `GET /audit/log`: List audit ledger blocks.

## 9. Mandi Commodity Prices
- `GET /prices?commodity=Onion&market=Lasalgaon`: Cached daily indicative Agmarknet pricing.
