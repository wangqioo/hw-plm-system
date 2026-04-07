from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
from database import get_db
from models import Material, MaterialParameter, User
from auth import get_current_user
from schemas import MaterialCreate, MaterialUpdate, MaterialOut, MaterialListOut, ParameterOut

router = APIRouter(prefix="/materials", tags=["materials"])


def _enrich(m: Material) -> dict:
    d = {
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
        "parameters": [{"id": p.id, "key": p.key, "value": p.value, "sort_order": p.sort_order} for p in sorted(m.parameters, key=lambda x: x.sort_order)],
        "creator_name": m.creator.full_name if m.creator else None,
    }
    return d


@router.get("", response_model=MaterialListOut)
async def list_materials(
    search: str = Query("", description="搜索名称/料号/厂商"),
    category: str = Query("", description="类别"),
    quality_level: str = Query("", description="质量等级"),
    status: str = Query("", description="状态"),
    sort_by: str = Query("preferred_rank", description="排序字段"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Material).options(selectinload(Material.parameters), selectinload(Material.creator))

    if search:
        q = f"%{search}%"
        query = query.where(or_(
            Material.name.ilike(q),
            Material.part_number.ilike(q),
            Material.manufacturer.ilike(q),
            Material.manufacturer_pn.ilike(q),
        ))
    if category:
        query = query.where(Material.category == category)
    if quality_level:
        query = query.where(Material.quality_level == quality_level)
    if status:
        query = query.where(Material.status == status)

    sort_map = {
        "preferred_rank": Material.preferred_rank,
        "name": Material.name,
        "quality_level": Material.quality_level,
        "created_at": Material.created_at.desc(),
    }
    query = query.order_by(sort_map.get(sort_by, Material.preferred_rank))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return MaterialListOut(total=total, items=[MaterialOut(**_enrich(m)) for m in items])


@router.post("", response_model=MaterialOut, status_code=201)
async def create_material(
    data: MaterialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Material).where(Material.part_number == data.part_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"料号 {data.part_number} 已存在")

    material = Material(
        part_number=data.part_number or f"AUTO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        name=data.name,
        category=data.category,
        manufacturer=data.manufacturer,
        manufacturer_pn=data.manufacturer_pn,
        description=data.description,
        quality_level=data.quality_level,
        preferred_rank=data.preferred_rank,
        unit_price=data.unit_price,
        stock=data.stock,
        lead_time_days=data.lead_time_days,
        notes=data.notes,
        created_by_id=current_user.id,
    )
    db.add(material)
    await db.flush()

    for i, param in enumerate(data.parameters):
        p = MaterialParameter(
            material_id=material.id,
            key=param.key,
            value=param.value,
            sort_order=i,
        )
        db.add(p)

    await db.refresh(material, ["parameters", "creator"])
    return MaterialOut(**_enrich(material))


@router.get("/categories")
async def get_categories(_: User = Depends(get_current_user)):
    return {
        "resistor": "电阻",
        "capacitor": "电容",
        "inductor": "电感",
        "diode": "二极管",
        "transistor": "三极管/MOS管",
        "ic_mcu": "微控制器",
        "ic_power": "电源IC",
        "ic_analog": "模拟IC",
        "ic_memory": "存储器",
        "ic_logic": "逻辑IC",
        "connector": "连接器",
        "crystal": "晶振",
        "transformer": "变压器",
        "relay": "继电器",
        "sensor": "传感器",
        "other": "其他",
    }


@router.get("/{material_id}", response_model=MaterialOut)
async def get_material(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Material)
        .options(selectinload(Material.parameters), selectinload(Material.creator))
        .where(Material.id == material_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="物料不存在")
    return MaterialOut(**_enrich(m))


@router.put("/{material_id}", response_model=MaterialOut)
async def update_material(
    material_id: str,
    data: MaterialUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Material)
        .options(selectinload(Material.parameters), selectinload(Material.creator))
        .where(Material.id == material_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="物料不存在")

    update_data = data.model_dump(exclude_none=True, exclude={"parameters"})
    for field, value in update_data.items():
        setattr(m, field, value)
    m.updated_at = datetime.utcnow()

    if data.parameters is not None:
        for p in m.parameters:
            await db.delete(p)
        await db.flush()
        for i, param in enumerate(data.parameters):
            p = MaterialParameter(material_id=m.id, key=param.key, value=param.value, sort_order=i)
            db.add(p)
        await db.flush()
        await db.refresh(m, ["parameters"])

    return MaterialOut(**_enrich(m))


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可删除物料")
    result = await db.execute(select(Material).where(Material.id == material_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="物料不存在")
    await db.delete(m)
