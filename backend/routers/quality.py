from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import QualityFeedback, Material, User
from auth import get_current_user
from schemas import FeedbackCreate, FeedbackStatusUpdate, FeedbackOut

router = APIRouter(prefix="/quality", tags=["quality"])


def _enrich(f: QualityFeedback) -> dict:
    return {
        "id": f.id,
        "material_id": f.material_id,
        "material_name": f.material.name if f.material else "",
        "type": f.type,
        "source": f.source,
        "description": f.description,
        "reported_by_id": f.reported_by_id,
        "reporter_name": f.reporter.full_name if f.reporter else "",
        "reported_at": f.reported_at,
        "status": f.status,
        "previous_level": f.previous_level,
        "proposed_level": f.proposed_level,
    }


@router.get("", response_model=list[FeedbackOut])
async def list_feedbacks(
    status: str = Query("", description="状态"),
    material_id: str = Query("", description="物料ID"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = (
        select(QualityFeedback)
        .options(selectinload(QualityFeedback.material), selectinload(QualityFeedback.reporter))
        .order_by(QualityFeedback.reported_at.desc())
    )
    if status:
        query = query.where(QualityFeedback.status == status)
    if material_id:
        query = query.where(QualityFeedback.material_id == material_id)

    result = await db.execute(query)
    return [FeedbackOut(**_enrich(f)) for f in result.scalars().all()]


@router.post("", response_model=FeedbackOut, status_code=201)
async def create_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mat_result = await db.execute(select(Material).where(Material.id == data.material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="物料不存在")

    fb = QualityFeedback(
        material_id=data.material_id,
        type=data.type,
        source=data.source,
        description=data.description,
        proposed_level=data.proposed_level,
        reported_by_id=current_user.id,
        previous_level=material.quality_level,
    )
    db.add(fb)
    await db.flush()
    await db.refresh(fb, ["material", "reporter"])
    return FeedbackOut(**_enrich(fb))


@router.put("/{feedback_id}/status", response_model=FeedbackOut)
async def update_feedback_status(
    feedback_id: str,
    data: FeedbackStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QualityFeedback)
        .options(selectinload(QualityFeedback.material), selectinload(QualityFeedback.reporter))
        .where(QualityFeedback.id == feedback_id)
    )
    fb = result.scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="反馈记录不存在")

    fb.status = data.status

    # If resolved and it's a downgrade/upgrade, update material quality level
    if data.status == "resolved" and fb.proposed_level and fb.type in ("downgrade", "upgrade"):
        mat_result = await db.execute(select(Material).where(Material.id == fb.material_id))
        material = mat_result.scalar_one_or_none()
        if material:
            material.quality_level = fb.proposed_level
            if fb.proposed_level == "D":
                material.status = "deprecated"

    return FeedbackOut(**_enrich(fb))
