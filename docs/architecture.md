# System Architecture — AI Onion Quality Grading Platform

## 1. High-Level Architecture Overview

The system architecture bridges edge mobile devices operating offline in mandi procurement bays with a centralized, immutable supervisory cloud hub.

```
+-------------------------------------------------------------------------------+
|                             FARMER & INSPECTOR APP                            |
|                            (Flutter / Android First)                          |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  | Guided Camera Feed  |-->|  ArUco 4x4 Detector |--->|  YOLO-Seg Inference |  |
|  | (Luminance, Sharp)  |   |  & Homography (mm)  |   |  (5-Class Polygon)  |  |
|  +---------------------+   +---------------------+   +---------------------+  |
|                                                                 |             |
|  +---------------------+   +---------------------+              v             |
|  | Cryptographic Sign  |<--| AGMARK Explainable  |<--+---------------------+  |
|  | (SHA-256 + Ed25519) |   |    Grading Engine   |   | Hungarian Two-View  |  |
|  +---------------------+   +---------------------+   |    Defect Fusion    |  |
|             |                                        +---------------------+  |
|             v                                                                 |
|  +---------------------+                                                      |
|  | QR Code & PDF Cert  |                                                      |
|  | (Offline / Online)  |                                                      |
|  +---------------------+                                                      |
+-------------------------------------------------------------------------------+
                                      |
                      (Idempotent Sync over REST API)
                                      v
+-------------------------------------------------------------------------------+
|                            FASTAPI BACKEND & LEDGER                           |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  | /sync/reports Batch |   | /verify/{report_id} |   |  /disputes Appeals  |  |
|  | Idempotent Receiver |   | Public Verification |   |   Adjudication Desk |  |
|  +---------------------+   +---------------------+   +---------------------+  |
|             |                         |                         |             |
|             +-------------------------+-------------------------+             |
|                                       v                                       |
|                    +-------------------------------------+                    |
|                    | Append-Only SHA-256 Hash Chain      |                    |
|                    | Cryptographic Audit Ledger (SQLite) |                    |
|                    +-------------------------------------+                    |
+-------------------------------------------------------------------------------+
                                      ^
                                      | (REST / JWT)
+-------------------------------------------------------------------------------+
|                      SUPERVISOR WEB DASHBOARD (React + Vite)                  |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  | Consistency Monitor |   | Centre Anomaly Flag |   | Rules Configuration |  |
|  | & Bias Surveillance |   |  (Regional Baseline)|   |  Editor & Bumping   |  |
|  +---------------------+   +---------------------+   +---------------------+  |
+-------------------------------------------------------------------------------+
```

## 2. Key Modules & Parity Guarantees

1. **Spatial Homography (Real-world mm scale)**:
   The physical 50mm ArUco marker provides an exact reference coordinate frame, transforming pixel dimensions into millimeters. An empirical height correction factor ($0.965$) counteracts 3D parallax.
2. **5-Class YOLO Segmentation**:
   - `0: Damaged`
   - `1: Healthy`
   - `2: Onions-Quality-Analysis`
   - `3: Rotten`
   - `4: Sprouted`
3. **Ellipsoidal Volume & Weight Model**:
   $V = \frac{\pi}{6} \times \text{Length} \times \text{Width}^2$. Scaled proportionally when actual sample scale weights are input.
4. **Hungarian Defect Fusion**:
   Fuses front and back views based on warped mm centroids. Applies worst-defect priority rule.
5. **Cryptographic Tamper-Proofing**:
   Every report generates a canonical SHA-256 hash and Ed25519 digital signature.
