from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from database import get_db
from models import Project, BOMItem, Material, User, MaterialParameter
from auth import get_current_user
from schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut, ProjectDetailOut,
    BOMItemCreate, BOMItemOut, MaterialOut
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _enrich_material(m: Material) -> dict:
    return {
        "id": m.id,
        "part_number": m.part_number,
        "name": m.name,
        "category": m.category,
        "manufacturer": m.manufacturer,
        "manufacturer_pn": m.manufacturer_pn,
        "description": m.description,
        "status": m.status,
        "quality_level": m.quality_level,
        "preferred_rank": m.preferred_rank,
        "unit_price": m.unit_price,
        "stock": m.stock,
        "lead_time_days": m.lead_time_days,
        "datasheet_url": m.datasheet_url,
        "notes": m.notes,
        "created_by_id": m.created_by_id,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "parameters": [{"id": p.id, "key": p.key, "value": p.value, "sort_order": p.sort_order}
                       for p in sorted(m.parameters, key=lambda x: x.sort_order)],
        "creator_name": None,
    }


def _enrich_bom(b: BOMItem) -> dict:
    return {
        "id": b.id,
        "project_id": b.project_id,
        "material_id": b.material_id,
        "designator": b.designator,
        "quantity": b.quantity,
        "dnp": b.dnp,
        "confirmed_by_id": b.confirmed_by_id,
        "confirmed_by_name": b.confirmed_by.full_name if b.confirmed_by else None,
        "confirmed_at": b.confirmed_at,
        "notes": b.notes,
        "material": MaterialOut(**_enrich_material(b.material)) if b.material else None,
    }


def _enrich_project(p: Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "code": p.code,
        "stage": p.stage,
        "manager_id": p.manager_id,
        "manager_name": p.manager.full_name if p.manager else None,
        "description": p.description,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "bom_count": len(p.bom_items),
        "unconfirmed_count": sum(1 for b in p.bom_items if not b.confirmed_by_id),
    }


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.manager),
            selectinload(Project.bom_items),
        )
        .order_by(Project.created_at.desc())
    )
    return [ProjectOut(**_enrich_project(p)) for p in result.scalars().all()]


@router.post("", response_model=ProjectOut, status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Project).where(Project.code == data.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"项目编号 {data.code} 已存在")
    project = Project(
        name=data.name,
        code=data.code,
        stage=data.stage,
        description=data.description,
        manager_id=current_user.id,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project, ["manager", "bom_items"])
    return ProjectOut(**_enrich_project(project))


@router.get("/{project_id}", response_model=ProjectDetailOut)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.manager),
            selectinload(Project.bom_items).selectinload(BOMItem.material).selectinload(Material.parameters),
            selectinload(Project.bom_items).selectinload(BOMItem.confirmed_by),
        )
        .where(Project.id == project_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    data = _enrich_project(p)
    data["bom_items"] = [BOMItemOut(**_enrich_bom(b)) for b in p.bom_items]
    return ProjectDetailOut(**data)


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.manager), selectinload(Project.bom_items))
        .where(Project.id == project_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    p.updated_at = datetime.utcnow()
    return ProjectOut(**_enrich_project(p))


@router.post("/{project_id}/bom", response_model=BOMItemOut, status_code=201)
async def add_bom_item(
    project_id: str,
    data: BOMItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    proj = await db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="项目不存在")

    mat_result = await db.execute(
        select(Material)
        .options(selectinload(Material.parameters))
        .where(Material.id == data.material_id)
    )
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="物料不存在")

    item = BOMItem(
        project_id=project_id,
        material_id=data.material_id,
        designator=data.designator,
        quantity=data.quantity,
        dnp=data.dnp,
        notes=data.notes,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item, ["material", "confirmed_by"])
    # reload material parameters
    await db.refresh(item.material, ["parameters"])
    return BOMItemOut(**_enrich_bom(item))


@router.put("/bom/{item_id}/confirm", response_model=BOMItemOut)
async def confirm_bom_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BOMItem)
        .options(
            selectinload(BOMItem.material).selectinload(Material.parameters),
            selectinload(BOMItem.confirmed_by),
        )
        .where(BOMItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="BOM条目不存在")

    item.confirmed_by_id = current_user.id
    item.confirmed_at = datetime.utcnow()
    await db.refresh(item, ["confirmed_by"])
    return BOMItemOut(**_enrich_bom(item))


@router.put("/{project_id}/bom/confirm-all", response_model=list[BOMItemOut])
async def confirm_all_bom(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BOMItem)
        .options(
            selectinload(BOMItem.material).selectinload(Material.parameters),
            selectinload(BOMItem.confirmed_by),
        )
        .where(BOMItem.project_id == project_id, BOMItem.confirmed_by_id == None)
    )
    items = result.scalars().all()
    now = datetime.utcnow()
    for item in items:
        item.confirmed_by_id = current_user.id
        item.confirmed_at = now
    await db.flush()
    for item in items:
        await db.refresh(item, ["confirmed_by"])
    return [BOMItemOut(**_enrich_bom(item)) for item in items]


@router.delete("/bom/{item_id}", status_code=204)
async def delete_bom_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(BOMItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="BOM条目不存在")
    await db.delete(item)
