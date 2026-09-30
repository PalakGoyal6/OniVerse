# Onion Quality Defect Labelling Guide (Roboflow & YOLO-Seg)

This document standardises polygon segmentation labelling for the Smart India Hackathon Onion Quality Grading dataset.

---

## 1. Class Definitions & Guidelines

The dataset consists of **5 classes** indexed 0 through 4:

### Class 0: `Damaged`
- **Criteria**: Mechanical harvest cuts, punctures, flesh exposed due to ruptured scales, crushing, or peeled skin exposing raw bulb tissue.
- **Mask instruction**: Segment the complete visible bulb boundary with polygon points.

### Class 1: `Healthy`
- **Criteria**: Sound, intact dry outer skin, uniform coloration, typical globular shape, free from mold, cuts, green shoots, or soft decay.
- **Coloration**: Typical red, pink, or light brown papery skins without dampness or black dust.

### Class 2: `Onions-Quality-Analysis`
- **Criteria**: General quality assessment / unclassified commercial onion instance tag within sample lot trays.

### Class 3: `Rotten`
- **Criteria**: Soft, watery, sunken, discolored (mushy brown, translucent or decaying flesh), bacterial soft rot, or sour skin.
- **Mask instruction**: Segment the complete bulb boundary.

### Class 4: `Sprouted`
- **Criteria**: Emergence of green/white vegetative shoots from the neck/apical tip (premature internal germination).
- **Mask instruction**: Include both the bulb and the protruding green sprout in the polygon mask.

---

## 2. Priority Hierarchy Rule

When an onion exhibits multiple defects simultaneously, apply the highest priority label:
$$\text{Rotten} > \text{Damaged} > \text{Sprouted} > \text{Onions-Quality-Analysis} > \text{Healthy}$$

---

## 3. Tray & Image Capture Protocol

1. Place **A4 Grading Sheet** with ArUco Marker `DICT_4X4_50` (ID: 0, 50 mm) on a flat, non-reflective surface.
2. Disperse 20–40 onions cleanly inside the sheet boundary, avoiding heavy overlapping.
3. Take **Front Photo** from directly above (30–60 cm).
4. Flip onions in-place and take **Back Photo**.
5. Save in `ml/data/raw/` with naming:
   `tray_<TRAY_ID>_front.jpg` and `tray_<TRAY_ID>_back.jpg`.

---

## 4. Train / Val / Test Partitioning Rule

- **Crucial Rule**: Split 70% Train / 15% Val / 15% Test **strictly by Tray ID**.
- **NEVER** place the front photo of a tray in Train and its flipped back photo in Val/Test.
