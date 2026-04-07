import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import enum


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    engineer = "engineer"
    reviewer = "reviewer"
    admin = "admin"
    procurement = "procurement"


class MaterialStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    deprecated = "deprecated"
    review = "review"


class QualityLevel(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class ApprovalType(str, enum.Enum):
    new_entry = "new_entry"
    quality_change = "quality_change"
    bom_confirm = "bom_confirm"
    deprecate = "deprecate"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    reviewing = "reviewing"
    approved = "approved"
    rejected = "rejected"


class Priority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ProjectStage(str, enum.Enum):
    schematic = "schematic"
    layout = "layout"
    prototype = "prototype"
    pilot = "pilot"
    mass_production = "mass_production"


class FeedbackType(str, enum.Enum):
    downgrade = "downgrade"
    upgrade = "upgrade"
    ban = "ban"
    observation = "observation"


class FeedbackSource(str, enum.Enum):
    test = "test"
    manufacturer = "manufacturer"
    field = "field"
    engineer = "engineer"


class FeedbackStatus(str, enum.Enum):
    open = "open"
    processing = "processing"
    resolved = "resolved"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(SAEnum(UserRole), default=UserRole.engineer)
    department: Mapped[str] = mapped_column(String(100), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    materials_created: Mapped[list["Material"]] = relationship(back_populates="creator", foreign_keys="Material.created_by_id")
    approvals_submitted: Mapped[list["ApprovalRecord"]] = relationship(back_populates="submitter", foreign_keys="ApprovalRecord.submitted_by_id")
    approvals_reviewed: Mapped[list["ApprovalRecord"]] = relationship(back_populates="reviewer", foreign_keys="ApprovalRecord.reviewed_by_id")


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    part_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer_pn: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(SAEnum(MaterialStatus), default=MaterialStatus.pending)
    quality_level: Mapped[str] = mapped_column(SAEnum(QualityLevel), default=QualityLevel.B)
    preferred_rank: Mapped[int] = mapped_column(Integer, default=99)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    stock: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lead_time_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    datasheet_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator: Mapped["User | None"] = relationship(back_populates="materials_created", foreign_keys=[created_by_id])
    parameters: Mapped[list["MaterialParameter"]] = relationship(back_populates="material", cascade="all, delete-orphan")
    approval_records: Mapped[list["ApprovalRecord"]] = relationship(back_populates="material")
    bom_items: Mapped[list["BOMItem"]] = relationship(back_populates="material")
    quality_feedbacks: Mapped[list["QualityFeedback"]] = relationship(back_populates="material")


class MaterialParameter(Base):
    __tablename__ = "material_parameters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    material: Mapped["Material"] = relationship(back_populates="parameters")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id"), nullable=False)
    type: Mapped[str] = mapped_column(SAEnum(ApprovalType), nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(ApprovalStatus), default=ApprovalStatus.pending)
    priority: Mapped[str] = mapped_column(SAEnum(Priority), default=Priority.medium)
    submitted_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    comment: Mapped[str] = mapped_column(Text, default="")
    project_ref: Mapped[str] = mapped_column(String(100), default="")

    material: Mapped["Material"] = relationship(back_populates="approval_records")
    submitter: Mapped["User"] = relationship(back_populates="approvals_submitted", foreign_keys=[submitted_by_id])
    reviewer: Mapped["User | None"] = relationship(back_populates="approvals_reviewed", foreign_keys=[reviewed_by_id])


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    stage: Mapped[str] = mapped_column(SAEnum(ProjectStage), default=ProjectStage.schematic)
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager: Mapped["User | None"] = relationship(foreign_keys=[manager_id])
    bom_items: Mapped[list["BOMItem"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class BOMItem(Base):
    __tablename__ = "bom_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id"), nullable=False)
    designator: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    dnp: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmed_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")

    project: Mapped["Project"] = relationship(back_populates="bom_items")
    material: Mapped["Material"] = relationship(back_populates="bom_items")
    confirmed_by: Mapped["User | None"] = relationship(foreign_keys=[confirmed_by_id])


class QualityFeedback(Base):
    __tablename__ = "quality_feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id"), nullable=False)
    type: Mapped[str] = mapped_column(SAEnum(FeedbackType), nullable=False)
    source: Mapped[str] = mapped_column(SAEnum(FeedbackSource), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reported_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(SAEnum(FeedbackStatus), default=FeedbackStatus.open)
    previous_level: Mapped[str] = mapped_column(SAEnum(QualityLevel), nullable=False)
    proposed_level: Mapped[str | None] = mapped_column(SAEnum(QualityLevel), nullable=True)

    material: Mapped["Material"] = relationship(back_populates="quality_feedbacks")
    reporter: Mapped["User"] = relationship(foreign_keys=[reported_by_id])
