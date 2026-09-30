"""SQLAlchemy database models for AI Onion Quality Grading system."""

import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(32), default="inspector")  # inspector, supervisor, admin
    full_name = Column(String(128), nullable=False)
    centre_name = Column(String(128), default="Lasalgaon Mandi")
    phone = Column(String(20), nullable=True)
    pin_hash = Column(String(128), nullable=True)         # for inspectors
    password_hash = Column(String(128), nullable=True)    # for supervisors
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    devices = relationship("Device", back_populates="user")
    reports = relationship("Report", back_populates="inspector")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(128), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    public_key_ed25519 = Column(String(256), nullable=False)  # hex-encoded public key
    device_name = Column(String(128), default="Android Mobile")
    is_active = Column(Boolean, default=True)
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="devices")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(64), unique=True, index=True, nullable=False)
    lot_id = Column(String(64), index=True, nullable=False)
    centre_name = Column(String(128), index=True, nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_name = Column(String(128), nullable=False)
    farmer_phone = Column(String(20), index=True, nullable=False)
    variety = Column(String(64), default="Red Onion (Nashik)")

    sample_weight_kg = Column(Float, nullable=True)
    total_lot_weight_kg = Column(Float, nullable=True)
    total_onions_count = Column(Integer, default=0)

    grade_a_pct = Column(Float, default=0.0)
    urs_pct = Column(Float, default=0.0)
    rejected_pct = Column(Float, default=0.0)
    average_diameter_mm = Column(Float, default=0.0)
    lot_verdict = Column(String(32), default="GRADE_A_LOT")

    report_hash = Column(String(64), nullable=False)       # SHA-256
    signature_hex = Column(String(256), nullable=False)    # Ed25519
    device_id = Column(String(128), nullable=False)

    model_version = Column(String(32), default="1.0.0")
    rules_version = Column(String(32), default="1.0.0")
    app_version = Column(String(32), default="1.0.0")

    raw_canonical_json = Column(Text, nullable=False)
    photo_front_hash = Column(String(64), nullable=True)
    photo_back_hash = Column(String(64), nullable=True)

    has_overrides = Column(Boolean, default=False)
    is_disputed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    inspector = relationship("User", back_populates="reports")
    overrides = relationship("OverrideRecord", back_populates="report", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="report")


class OverrideRecord(Base):
    __tablename__ = "override_records"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(64), ForeignKey("reports.report_id"), nullable=False)
    onion_id = Column(Integer, nullable=False)
    original_class = Column(String(32), nullable=False)
    overridden_class = Column(String(32), nullable=False)
    original_grade = Column(String(32), nullable=False)
    overridden_grade = Column(String(32), nullable=False)
    reason = Column(String(256), nullable=False)
    inspector_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="overrides")


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(64), ForeignKey("reports.report_id"), nullable=False)
    farmer_phone = Column(String(20), nullable=False)
    reason = Column(String(512), nullable=False)
    status = Column(String(32), default="OPEN")  # OPEN, UNDER_REVIEW, RESOLVED_UPHELD, RESOLVED_OVERTURNED
    supervisor_notes = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, nullable=True)
    re_scan_report_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    report = relationship("Report", back_populates="disputes")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    sequence_num = Column(Integer, unique=True, index=True, nullable=False)
    event_type = Column(String(64), nullable=False)
    entity_id = Column(String(128), nullable=False)
    actor = Column(String(128), nullable=False)
    payload_json = Column(Text, nullable=False)
    prev_entry_hash = Column(String(64), nullable=False)
    current_entry_hash = Column(String(64), unique=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class RulesVersion(Base):
    __tablename__ = "rules_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(32), unique=True, nullable=False)
    content_json = Column(Text, nullable=False)
    created_by = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ModelRelease(Base):
    __tablename__ = "model_releases"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(32), unique=True, nullable=False)
    model_type = Column(String(32), default="yolov8n-seg-tflite")
    download_url = Column(String(512), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    is_active = Column(Boolean, default=True)
    release_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
