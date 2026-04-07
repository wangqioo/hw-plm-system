from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from models import (
    UserRole, MaterialStatus, QualityLevel, ApprovalType,
    ApprovalStatus, Priority, ProjectStage, FeedbackType,
    FeedbackSource, FeedbackStatus
)


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole
    department: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    full_name: str
    role: UserRole = UserRole.engineer
    department: str = ""


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


# ─── Material ─────────────────────────────────────────────────────────────────

class ParameterItem(BaseModel):
    key: str
    value: str
    sort_order: int = 0


class MaterialCreate(BaseModel):
    part_number: str
    name: str
    category: str
    manufacturer: str
    manufacturer_pn: str
    description: str = ""
    quality_level: QualityLevel = QualityLevel.B
    preferred_rank: int = 99
    unit_price: Optional[float] = None
    stock: Optional[int] = None
    lead_time_days: Optional[int] = None
    notes: str = ""
    parameters: list[ParameterItem] = []


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    manufacturer_pn: Optional[str] = None
    description: Optional[str] = None
    status: Optional[MaterialStatus] = None
    quality_level: Optional[QualityLevel] = None
    preferred_rank: Optional[int] = None
    unit_price: Optional[float] = None
    stock: Optional[int] = None
    lead_time_days: Optional[int] = None
    notes: Optional[str] = None
    parameters: Optional[list[ParameterItem]] = None


class ParameterOut(BaseModel):
    id: str
    key: str
    value: str
    sort_order: int

    model_config = {"from_attributes": True}


class MaterialOut(BaseModel):
    id: str
    part_number: str
    name: str
    category: str
    manufacturer: str
    manufacturer_pn: str
    description: str
    status: MaterialStatus
    quality_level: QualityLevel
    preferred_rank: int
    unit_price: Optional[float]
    stock: Optional[int]
    lead_time_days: Optional[int]
    datasheet_url: Optional[str]
    notes: str
    created_by_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    parameters: list[ParameterOut] = []
    creator_name: Optional[str] = None

    model_config = {"from_attributes": True}


class MaterialListOut(BaseModel):
    total: int
    items: list[MaterialOut]


# ─── Approval ─────────────────────────────────────────────────────────────────

class ApprovalCreate(BaseModel):
    material_id: str
    type: ApprovalType
    priority: Priority = Priority.medium
    comment: str = ""
    project_ref: str = ""


class ApprovalAction(BaseModel):
    action: str  # approve | reject | review
    comment: str = ""


class ApprovalOut(BaseModel):
    id: str
    material_id: str
    material_name: str = ""
    part_number: str = ""
    type: ApprovalType
    status: ApprovalStatus
    priority: Priority
    submitted_by_id: str
    submitter_name: str = ""
    submitted_at: datetime
    reviewed_by_id: Optional[str]
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime]
    comment: str
    project_ref: str

    model_config = {"from_attributes": True}


# ─── Quality Feedback ─────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    material_id: str
    type: FeedbackType
    source: FeedbackSource
    description: str
    proposed_level: Optional[QualityLevel] = None


class FeedbackStatusUpdate(BaseModel):
    status: FeedbackStatus


class FeedbackOut(BaseModel):
    id: str
    material_id: str
    material_name: str = ""
    type: FeedbackType
    source: FeedbackSource
    description: str
    reported_by_id: str
    reporter_name: str = ""
    reported_at: datetime
    status: FeedbackStatus
    previous_level: QualityLevel
    proposed_level: Optional[QualityLevel]

    model_config = {"from_attributes": True}


# ─── Project / BOM ────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    code: str
    stage: ProjectStage = ProjectStage.schematic
    description: str = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    stage: Optional[ProjectStage] = None
    description: Optional[str] = None


class BOMItemCreate(BaseModel):
    material_id: str
    designator: str
    quantity: int = 1
    dnp: bool = False
    notes: str = ""


class BOMItemOut(BaseModel):
    id: str
    project_id: str
    material_id: str
    designator: str
    quantity: int
    dnp: bool
    confirmed_by_id: Optional[str]
    confirmed_by_name: Optional[str] = None
    confirmed_at: Optional[datetime]
    notes: str
    material: MaterialOut

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: str
    name: str
    code: str
    stage: ProjectStage
    manager_id: Optional[str]
    manager_name: Optional[str] = None
    description: str
    created_at: datetime
    updated_at: datetime
    bom_count: int = 0
    unconfirmed_count: int = 0

    model_config = {"from_attributes": True}


class ProjectDetailOut(ProjectOut):
    bom_items: list[BOMItemOut] = []


# ─── Upload ───────────────────────────────────────────────────────────────────

class ExtractedParameter(BaseModel):
    key: str
    value: str


class PDFExtractResult(BaseModel):
    file_url: str
    file_name: str
    extracted_text: str
    suggested_name: str = ""
    suggested_manufacturer: str = ""
    suggested_manufacturer_pn: str = ""
    suggested_category: str = ""
    suggested_description: str = ""
    parameters: list[ExtractedParameter] = []


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_materials: int
    pending_approvals: int
    open_feedbacks: int
    deprecated_materials: int
    quality_distribution: dict[str, int]
    category_distribution: dict[str, int]
    monthly_entries: list[dict]
