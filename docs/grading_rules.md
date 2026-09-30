# AGMARK Onion Quality Grading Specifications

## 1. Regulatory Standard
- **Reference**: AGMARK Rules 1985 & DAC&FW Operational Guidelines for Onion Procurement.
- **Source of Truth**: `config/grading_rules.json`.

---

## 2. Commercial Grades

| Grade | Equatorial Diameter (mm) | Allowed Defects | Action / Allocation |
| :--- | :--- | :--- | :--- |
| **Grade A (FAQ / Premium)** | $45.0\text{ mm} \le \text{Diameter} \le 90.0\text{ mm}$ | None (Skin sound and intact) | Full Procurement Price |
| **URS (Under-Sized)** | $35.0\text{ mm} \le \text{Diameter} \le 44.9\text{ mm}$ | None | Sub-standard / Discounted |
| **Rejected / Non-Procureable** | $< 35.0\text{ mm}$, $> 95.0\text{ mm}$, or Severe Defect | Rotten, Damaged, Sprouted | Rejected from procurement |
| **Needs Manual Check** | Any with confidence $< 0.60$ or view conflict | Discrepancy flagged | Mandatory inspector resolution |

---

## 3. Five Core Dataset Classes

- `0: Damaged` (Harvest cuts, bruising, peel damage)
- `1: Healthy` (Sound skin, standard coloration)
- `2: Onions-Quality-Analysis` (Sample tray context / general evaluation)
- `3: Rotten` (Flesh decay, soft rot)
- `4: Sprouted` (Vegetative shoot emergence)
