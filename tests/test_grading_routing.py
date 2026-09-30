"""
Unit Tests for Grading & Routing Engine (grade.py)
Tests all individual routing, provisional status, and lot percentage rules without needing YOLO.
"""

import pytest
from ml.pipeline.grade import GradingEngine


@pytest.fixture
def engine():
    return GradingEngine()


def test_case_a_healthy_60mm_marker_auto_grade_a(engine):
    """a. healthy, conf 0.90, marker, 60 mm -> AUTO, GRADE_A"""
    onion = {
        "onion_id": 1,
        "class_name": "Healthy",
        "confidence": 0.90,
        "diameter_mm": 60.0,
        "length_mm": 62.0,
        "width_mm": 60.0,
        "weight_g": 95.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "GRADE_A"
    assert result["status"] == "AUTO"
    assert result["is_auto"] is True
    assert result["diameter_mm"] == 60.0


def test_case_b_healthy_30mm_marker_auto_undersized(engine):
    """b. healthy, conf 0.90, marker, 30 mm -> AUTO, undersized category per rules (<35mm -> REJECTED)"""
    onion = {
        "onion_id": 2,
        "class_name": "Healthy",
        "confidence": 0.90,
        "diameter_mm": 30.0,
        "length_mm": 32.0,
        "width_mm": 30.0,
        "weight_g": 25.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "REJECTED"
    assert result["status"] == "AUTO"
    assert result["is_auto"] is True
    assert "Undersized" in result["reasons"][0]


def test_case_c_healthy_low_conf_pending_not_in_lot_pct(engine):
    """c. healthy, conf 0.23, marker, 76.8 mm -> NEEDS_MANUAL_CHECK, provisional GRADE_A, NOT counted in lot %"""
    onion = {
        "onion_id": 3,
        "class_name": "Healthy",
        "confidence": 0.23,
        "diameter_mm": 76.8,
        "length_mm": 78.0,
        "width_mm": 76.8,
        "weight_g": 180.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "GRADE_A"
    assert result["status"] == "NEEDS_MANUAL_CHECK"
    assert result["is_auto"] is False

    # Check that in a lot with only this onion, confirmed lot % is 0.0%
    lot_res = engine.grade_lot([onion])
    assert lot_res["auto_graded_count"] == 0
    assert lot_res["needs_check_count"] == 1
    assert lot_res["percentages_by_count"]["GRADE_A"] == 0.0
    assert lot_res["provisional_percentages"]["GRADE_A"] == 100.0


def test_case_d_rotten_high_conf_auto_rejected(engine):
    """d. rotten, conf 0.90 -> AUTO, category from rules file (REJECTED)"""
    onion = {
        "onion_id": 4,
        "class_name": "Rotten",
        "confidence": 0.90,
        "diameter_mm": 55.0,
        "length_mm": 56.0,
        "width_mm": 55.0,
        "weight_g": 85.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "REJECTED"
    assert result["status"] == "AUTO"
    assert result["is_auto"] is True


def test_case_e_rotten_low_conf_pending_check(engine):
    """e. rotten, conf 0.27 -> NEEDS_MANUAL_CHECK, provisional rejected, NOT counted in lot %"""
    onion = {
        "onion_id": 5,
        "class_name": "Rotten",
        "confidence": 0.27,
        "diameter_mm": 52.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "REJECTED"
    assert result["status"] == "NEEDS_MANUAL_CHECK"
    assert result["is_auto"] is False

    lot_res = engine.grade_lot([onion])
    assert lot_res["auto_graded_count"] == 0
    assert lot_res["percentages_by_count"]["REJECTED"] == 0.0
    assert lot_res["provisional_percentages"]["REJECTED"] == 100.0


def test_case_f_sprouting_high_conf_rules_category(engine):
    """f. sprouting, conf 0.90 -> AUTO, category FROM THE RULES FILE (REJECTED)"""
    onion = {
        "onion_id": 6,
        "class_name": "Sprouted",
        "confidence": 0.90,
        "diameter_mm": 58.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "REJECTED"
    assert result["status"] == "AUTO"
    assert result["is_auto"] is True


def test_case_g_mechanical_damage_high_conf_rules_category(engine):
    """g. mechanical_damage, conf 0.90 -> AUTO, category from rules file (REJECTED)"""
    onion = {
        "onion_id": 7,
        "class_name": "Damaged",
        "confidence": 0.90,
        "diameter_mm": 54.0,
        "marker_detected": True,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "REJECTED"
    assert result["status"] == "AUTO"
    assert result["is_auto"] is True


def test_case_h_healthy_no_marker_pending_measurement(engine):
    """h. healthy, conf 0.90, NO marker -> PENDING_MEASUREMENT, no mm value"""
    onion = {
        "onion_id": 8,
        "class_name": "Healthy",
        "confidence": 0.90,
        "diameter_mm": None,
        "length_mm": None,
        "width_mm": None,
        "marker_detected": False,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "PENDING_MEASUREMENT"
    assert result["status"] == "NEEDS_MANUAL_CHECK"
    assert result["diameter_mm"] is None
    assert result["is_auto"] is False


def test_case_i_rotten_no_marker_category_from_rules(engine):
    """i. rotten, conf 0.90, NO marker -> category from rules (REJECTED), no mm value"""
    onion = {
        "onion_id": 9,
        "class_name": "Rotten",
        "confidence": 0.90,
        "diameter_mm": None,
        "marker_detected": False,
    }
    result = engine.grade_single_onion(onion)
    assert result["grade"] == "REJECTED"
    assert result["status"] == "AUTO"
    assert result["diameter_mm"] is None


def test_case_j_officer_confirms_pending_now_counted(engine):
    """j. officer confirms case (c) -> now counted in lot %"""
    # Initially low confidence (pending)
    onion_c = {
        "onion_id": 10,
        "class_name": "Healthy",
        "confidence": 0.23,
        "diameter_mm": 76.8,
        "weight_g": 180.0,
        "marker_detected": True,
    }
    lot_initial = engine.grade_lot([onion_c])
    assert lot_initial["percentages_by_count"]["GRADE_A"] == 0.0

    # Officer confirms: marked as confirmed (status="AUTO" / officer confirmed)
    onion_c_confirmed = dict(onion_c)
    onion_c_confirmed["confidence"] = 1.0  # officer confirmed
    lot_confirmed = engine.grade_lot([onion_c_confirmed])
    assert lot_confirmed["auto_graded_count"] == 1
    assert lot_confirmed["percentages_by_count"]["GRADE_A"] == 100.0


def test_case_k_lot_with_only_pending_no_crash(engine):
    """k. lot with only pending onions -> confirmed % shown as 0 with '0 of N auto-graded' (no crash, no divide-by-zero)"""
    pending_lot = [
        {"onion_id": 1, "class_name": "Healthy", "confidence": 0.25, "diameter_mm": 50.0, "marker_detected": True},
        {"onion_id": 2, "class_name": "Healthy", "confidence": 0.30, "diameter_mm": 60.0, "marker_detected": True},
        {"onion_id": 3, "class_name": "Rotten", "confidence": 0.20, "diameter_mm": 45.0, "marker_detected": True},
    ]
    lot_res = engine.grade_lot(pending_lot)
    assert lot_res["total_count"] == 3
    assert lot_res["auto_graded_count"] == 0
    assert lot_res["needs_check_count"] == 3
    assert lot_res["lot_verdict"] == "PENDING_REVIEW (3 pending review)"
    assert lot_res["percentages_by_count"]["GRADE_A"] == 0.0
    assert lot_res["percentages_by_count"]["URS"] == 0.0
    assert lot_res["percentages_by_count"]["REJECTED"] == 0.0
    assert "0 of 3 auto-graded" in lot_res["summary_status_text"]
    assert "3 need your check" in lot_res["summary_status_text"]


def test_provisional_verdict_when_some_pending(engine):
    """When lot has confirmed auto onions but also pending ones -> provisional verdict"""
    lot = [
        {"onion_id": 1, "class_name": "Rotten", "confidence": 0.90, "diameter_mm": 50.0, "marker_detected": True},
        {"onion_id": 2, "class_name": "Healthy", "confidence": 0.90, "diameter_mm": 50.0, "marker_detected": True},
        {"onion_id": 3, "class_name": "Healthy", "confidence": 0.25, "diameter_mm": 50.0, "marker_detected": True},
    ]
    lot_res = engine.grade_lot(lot)
    assert lot_res["auto_graded_count"] == 2
    assert lot_res["needs_check_count"] == 1
    assert lot_res["percentages_by_count"]["REJECTED"] == 50.0
    assert lot_res["lot_verdict"] == "REJECTED (provisional — 1 pending review)"


def test_empty_lot_verdict_no_onions_detected(engine):
    """0 detections -> verdict NO_ONIONS_DETECTED with specific message"""
    lot_res = engine.grade_lot([])
    assert lot_res["total_count"] == 0
    assert lot_res["lot_verdict"] == "NO_ONIONS_DETECTED"
    assert lot_res["summary_status_text"] == "No onions detected — check photo and retake"


def test_confirmed_rejected_lot_verdict(engine):
    """Confirmed onions exist and 0 pending -> final verdict REJECTED"""
    lot = [
        {"onion_id": 1, "class_name": "Rotten", "confidence": 0.90, "diameter_mm": 50.0, "marker_detected": True},
        {"onion_id": 2, "class_name": "Healthy", "confidence": 0.90, "diameter_mm": 50.0, "marker_detected": True},
    ]
    lot_res = engine.grade_lot(lot)
    assert lot_res["auto_graded_count"] == 2
    assert lot_res["needs_check_count"] == 0
    assert lot_res["percentages_by_count"]["REJECTED"] == 50.0
    assert lot_res["lot_verdict"] == "REJECTED"


def test_null_diameter_ensures_null_weight(engine):
    """When diameter is null, weight must strictly be null"""
    onion = {
        "onion_id": 1,
        "class_name": "Healthy",
        "confidence": 0.90,
        "diameter_mm": None,
        "weight_g": 75.0,
        "marker_detected": False,
    }
    result = engine.grade_single_onion(onion)
    assert result["diameter_mm"] is None
    assert result["weight_g"] is None
