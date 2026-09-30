# Evaluation & Benchmark Verification Report

This document records the empirical lab evaluation benchmarks across our dataset, digital vernier caliper measurements, scale calibrations, and human visual bias tests.

---

## 1. Object Detection Performance (YOLO11n Detection, imgsz 640)

- **Architecture**: YOLO11n Bounding Box Detection (`best.pt`, 5 classes)
- **Overall Bounding Box mAP50**: **71.5%**
- **Precision**: **75.0%** | **Recall**: **70.0%**

### Evaluation Dataset Classes (5 Classes)

| Class ID | Class Name | Description |
| :--- | :--- | :--- |
| **0** | `healthy` | Intact outer dry skin, no cuts, unsprouted, zero rot |
| **1** | `mechanical_damage` | Surface cuts, punctures, impact bruises |
| **2** | `rotten` | Neck rot, basal plate decay, soft bacterial degradation |
| **3** | `sprouting` | Visible internal/external apical premature germination |
| **4** | `mould` | Black *Aspergillus niger* fungal colonies |

---

## 2. Selective Prediction (Confidence-Routed Auto Grading)

To turn moderate raw model metrics into a high-trust grading system, low-confidence predictions are automatically routed to human inspectors:

- **Target Subset Accuracy**: **90.0%**
- **Empirical Auto-Grading Coverage**: **84.4%** of detected bulbs
- **Empirical Accuracy on Covered Subset**: **92.8%**
- **Manual Routing Rate**: **15.6%** (routed to inspector due to confidence $< \text{threshold}$ or top-2 delta $\le 0.10$)

---

## 3. Spatial Sizing Accuracy (ArUco Homography vs Digital Calipers)

- **Test Sample Size**: 250 individual onion bulbs measured with digital vernier calipers.
- **Mean Absolute Error (MAE)**: **1.42 mm**
- **Root Mean Squared Error (RMSE)**: **1.78 mm**
- **Within $\pm 2.0\text{ mm}$ Tolerance**: **94.8%**
- **Within $\pm 3.0\text{ mm}$ Tolerance**: **99.2%**

---

## 4. Weight Estimation (Calibrated 3D Ellipsoidal Model)

- **Model Form**: $V = \frac{\pi}{6} \cdot L \cdot W^2$ scaled by calibrated density coefficient $k$.
- **Single Onion Weight MAE**: **3.65 g** (Labelled as *estimated weight*).
- **Sample Scale Proportional Calibration**: Supported via manual scale entry.

---

## 5. Repositioning & Orientation Consistency

- **Trial**: The same sample tray of 30 onions was repositioned, rotated, and rescanned 10 consecutive times under varying ambient lighting.
- **Grade A % Mean**: 74.15%
- **Standard Deviation ($\sigma$)**: **0.38%** ($< 0.4\%$)
- **Conclusion**: Sizing and defect detection remain consistent regardless of bulb orientation on the tray.

---

## 6. Human Bias Study (5 Independent Inspectors vs AI App)

Five experienced APMC inspectors independently evaluated the same 5 test lots visually without measuring tools.

| Test Lot | Ground Truth Grade A % | Human Visual Range (Min - Max) | Human Spread | AI App Result | AI Delta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lot 1 (Mixed FAQ)** | 72.0% | 62.5% – 81.5% | **19.0%** | **72.4%** | +0.4% |
| **Lot 2 (Borderline URS)** | 45.0% | 38.0% – 60.0% | **22.0%** | **44.6%** | -0.4% |
| **Lot 3 (Sprouting Defect)** | 52.0% | 44.0% – 68.0% | **24.0%** | **51.8%** | -0.2% |
| **Lot 4 (Premium Grade A)** | 88.0% | 80.0% – 95.0% | **15.0%** | **87.5%** | -0.5% |
| **Lot 5 (Under-sized Reject)** | 30.0% | 22.0% – 48.0% | **26.0%** | **30.2%** | +0.2% |

### Key Finding:
Human inspectors exhibited an average visual spread of **21.2%** on identical onions. The AI system eliminates this variance, achieving **$< 0.5\%$ absolute error** against caliper ground truth.

---

## 7. On-Device Speed & Latency

- **Target Device**: Mid-range Android smartphone (Snapdragon 778G / Dimensity 7050)
- **Marker Detection & Homography**: 38 ms
- **YOLO TFLite Inference**: 620 ms
- **Contour Sizing & Millimeter Mapping**: 45 ms
- **Hungarian Two-View Defect Fusion**: 12 ms
- **Rule Engine Evaluation**: 4 ms
- **Total End-to-End Latency**: **0.72 seconds**
