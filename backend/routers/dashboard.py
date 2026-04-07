from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import datetime, timedelta
from database import get_db
from models import Material, ApprovalRecord, QualityFeedback, User
from auth import get_current_user
from schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Total materials
    total = (await db.execute(select(func.count(Material.id)))).scalar() or 0

    # Pending approvals
    pending = (await db.execute(
        select(func.count(ApprovalRecord.id))
        .where(ApprovalRecord.status.in_(["pending", "reviewing"]))
    )).scalar() or 0

    # Open feedbacks
    open_fb = (await db.execute(
        select(func.count(QualityFeedback.id))
        .where(QualityFeedback.status.in_(["open", "processing"]))
    )).scalar() or 0

    # Deprecated materials
    deprecated = (await db.execute(
        select(func.count(Material.id)).where(Material.status == "deprecated")
    )).scalar() or 0

    # Quality distribution
    quality_rows = await db.execute(
        select(Material.quality_level, func.count(Material.id))
        .group_by(Material.quality_level)
    )
    quality_dist = {row[0]: row[1] for row in quality_rows}

    # Category distribution
    cat_rows = await db.execute(
        select(Material.category, func.count(Material.id))
        .group_by(Material.category)
        .order_by(func.count(Material.id).desc())
    )
    cat_dist = {row[0]: row[1] for row in cat_rows}

    # Monthly entries (last 6 months)
    monthly = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        count = (await db.execute(
            select(func.count(Material.id))
            .where(Material.created_at >= month_start, Material.created_at < month_end)
        )).scalar() or 0
        monthly.append({
            "month": month_start.strftime("%m月"),
            "count": count,
        })

    return DashboardStats(
        total_materials=total,
        pending_approvals=pending,
        open_feedbacks=open_fb,
        deprecated_materials=deprecated,
        quality_distribution=quality_dist,
        category_distribution=cat_dist,
        monthly_entries=monthly,
    )
