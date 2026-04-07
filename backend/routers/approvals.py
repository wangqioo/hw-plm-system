from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from database import get_db
from models import ApprovalRecord, Material, User, MaterialStatus
from auth import get_current_user
from schemas import ApprovalCreate, ApprovalAction, ApprovalOut

router = APIRouter(prefix="/approvals", tags=["approvals"])


def _enrich(r: ApprovalRecord) -> dict:
    return {
        "id": r.id,
        "material_id": r.material_id,
        "material_name": r.material.name if r.material else "",
        "part_number": r.material.part_number if r.material else "",
        "type": r.type,
        "status": r.status,
        "priority": r.priority,
        "submitted_by_id": r.submitted_by_id,
        "submitter_name": r.submitter.full_name if r.submitter else "",
        "submitted_at": r.submitted_at,
        "reviewed_by_id": r.reviewed_by_id,
        "reviewer_name": r.reviewer.full_name if r.reviewer else None,
        "reviewed_at": r.reviewed_at,
        "comment": r.comment,
        "project_ref": r.project_ref,
    }


@router.get("", response_model=list[ApprovalOut])
async def list_approvals(
    status: str = Query("", description="状态筛选"),
    type: str = Query("", description="类型筛选"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = (
        select(ApprovalRecord)
        .options(
            selectinload(ApprovalRecord.material),
            selectinload(ApprovalRecord.submitter),
            selectinload(ApprovalRecord.reviewer),
        )
        .order_by(ApprovalRecord.submitted_at.desc())
    )
    if status:
        query = query.where(ApprovalRecord.status == status)
    if type:
        query = query.where(ApprovalRecord.type == type)

    result = await db.execute(query)
    records = result.scalars().all()
    return [ApprovalOut(**_enrich(r)) for r in records]


@router.post("", response_model=ApprovalOut, status_code=201)
async def create_approval(
    data: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mat_result = await db.execute(select(Material).where(Material.id == data.material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="物料不存在")

    record = ApprovalRecord(
        material_id=data.material_id,
        type=data.type,
        priority=data.priority,
        comment=data.comment,
        project_ref=data.project_ref,
        submitted_by_id=current_user.id,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record, ["material", "submitter", "reviewer"])
    return ApprovalOut(**_enrich(record))


@router.put("/{approval_id}/action", response_model=ApprovalOut)
async def process_approval(
    approval_id: str,
    data: ApprovalAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in ("reviewer", "admin"):
        raise HTTPException(status_code=403, detail="仅审核工程师或管理员可审批")

    result = await db.execute(
        select(ApprovalRecord)
        .options(
            selectinload(ApprovalRecord.material),
            selectinload(ApprovalRecord.submitter),
            selectinload(ApprovalRecord.reviewer),
        )
        .where(ApprovalRecord.id == approval_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="审核记录不存在")

    if record.status in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="该记录已审核完毕，无法重复操作")

    action = data.action
    if action == "approve":
        record.status = "approved"
        record.reviewed_at = datetime.utcnow()
        record.reviewed_by_id = current_user.id
        if data.comment:
            record.comment = data.comment
        # Auto update material status
        if record.material:
            if record.type == "new_entry":
                record.material.status = "active"
            elif record.type == "deprecate":
                record.material.status = "deprecated"
            elif record.type == "quality_change":
                pass  # quality level is updated separately via quality feedback
    elif action == "reject":
        record.status = "rejected"
        record.reviewed_at = datetime.utcnow()
        record.reviewed_by_id = current_user.id
        if data.comment:
            record.comment = data.comment
    elif action == "review":
        record.status = "reviewing"
        record.reviewed_by_id = current_user.id
    else:
        raise HTTPException(status_code=400, detail=f"无效操作: {action}")

    await db.refresh(record, ["material", "submitter", "reviewer"])
    return ApprovalOut(**_enrich(record))
