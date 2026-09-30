"""Pydantic request & response schemas for Onion Quality Grading API."""

from typing import List, Dict, Any, Optional
import datetime
from pydantic import BaseModel, Field


# Auth Schemas
class InspectorLoginRequest(BaseModel):
    pin: str = Field(..., description="4-digit inspector PIN")
    device_id: str
    centre_name: Optional[str] = "Lasalgaon Mandi"


class SupervisorLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: str
    centre_name: str


# Device Registration
class DeviceRegisterRequest(BaseModel):
    device_id: str
    public_key_ed25519: str
    device_name: Optional[str] = "Android Mobile"
    inspector_id: Optional[int] = None


# Onion & Report Sync Schemas
class OnionItemSchema(BaseModel):
    onion_id: int
    grade: str
    class_name: str
    diameter_mm: float
    length_mm: Optional[float] = None
    width_mm: Optional[float] = None
    weight_g: float
    confidence: float
    reasons: List[str]
    fused_views: List[str] = ["front"]
    centroid_mm: Optional[List[float]] = None


class OverrideRecordSchema(BaseModel):
    onion_id: int
    original_class: str
    overridden_class: str
    original_grade: str
    overridden_grade: str
    reason: str


class SyncReportPayload(BaseModel):
    report_id: str
    lot_id: str
    centre_name: str
    inspector_id: int
    farmer_name: str
    farmer_phone: str
    variety: str = "Red Onion"

    sample_weight_kg: Optional[float] = None
    total_lot_weight_kg: Optional[float] = None
    total_onions_count: int

    grade_a_pct: float
    urs_pct: float
    rejected_pct: float
    average_diameter_mm: float
    lot_verdict: str

    report_hash: str
    signature_hex: str
    device_id: str

    model_version: str = "1.0.0"
    rules_version: str = "1.0.0"
    app_version: str = "1.0.0"

    canonical_json: Dict[str, Any]
    photo_front_hash: Optional[str] = None
    photo_back_hash: Optional[str] = None

    overrides: List[OverrideRecordSchema] = []
    created_at_iso: Optional[str] = None


class BatchSyncRequest(BaseModel):
    reports: List[SyncReportPayload]


class BatchSyncResponse(BaseModel):
    synced_count: int
    duplicate_count: int
    errors: List[str] = []


# Report Filter & Detail Schemas
class ReportSummaryResponse(BaseModel):
    id: int
    report_id: str
    lot_id: str
    centre_name: str
    inspector_name: str
    farmer_name: str
    farmer_phone: str
    variety: str
    sample_weight_kg: Optional[float]
    total_lot_weight_kg: Optional[float]
    total_onions_count: int
    grade_a_pct: float
    urs_pct: float
    rejected_pct: float
    average_diameter_mm: float
    lot_verdict: str
    report_hash: str
    has_overrides: bool
    is_disputed: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Dispute Schemas
class DisputeCreateRequest(BaseModel):
    report_id: str
    farmer_phone: str
    reason: str


class DisputeResolveRequest(BaseModel):
    status: str = Field(..., description="RESOLVED_UPHELD or RESOLVED_OVERTURNED")
    supervisor_notes: str
    re_scan_report_id: Optional[str] = None


# Stats Schemas
class StatsOverview(BaseModel):
    total_lots_today: int
    total_lots_week: int
    total_weight_kg_graded: float
    average_grade_a_pct: float
    average_urs_pct: float
    average_rejected_pct: float
    open_disputes_count: int
    active_centres_count: int
    total_inspectors_active: int


# Rules Schemas
class RulesUpdateRequest(BaseModel):
    version: str
    rules: Dict[str, Any]
    reason: str
