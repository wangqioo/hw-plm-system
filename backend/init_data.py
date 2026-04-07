"""
初始化数据脚本：创建默认用户和示例物料数据
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import Base, init_db
from models import User, Material, MaterialParameter, Project, BOMItem
from auth import hash_password
from config import get_settings

settings = get_settings()

DEFAULT_USERS = [
    {"username": "admin", "password": "admin123", "full_name": "系统管理员", "role": "admin", "department": "研发管理部"},
    {"username": "engineer1", "password": "eng123", "full_name": "张工", "role": "engineer", "department": "硬件研发部"},
    {"username": "engineer2", "password": "eng123", "full_name": "陈工", "role": "engineer", "department": "硬件研发部"},
    {"username": "reviewer", "password": "rev123", "full_name": "李审核", "role": "reviewer", "department": "硬件研发部"},
    {"username": "procurement", "password": "proc123", "full_name": "刘采购", "role": "procurement", "department": "供应链部"},
]

SAMPLE_MATERIALS = [
    {
        "part_number": "RES-0402-10K-1%",
        "name": "贴片电阻 10kΩ",
        "category": "resistor",
        "manufacturer": "村田",
        "manufacturer_pn": "ERJ-2RKF1002X",
        "description": "0402封装 10kΩ 1% 1/16W 贴片电阻",
        "status": "active",
        "quality_level": "A",
        "preferred_rank": 1,
        "unit_price": 0.008,
        "stock": 50000,
        "lead_time_days": 14,
        "parameters": [
            ("阻值", "10kΩ"), ("精度", "1%"), ("功率", "1/16W"),
            ("封装", "0402"), ("温度系数", "±100ppm/°C"),
            ("工作温度", "-55~+155°C"), ("额定电压", "50V"),
        ],
    },
    {
        "part_number": "RES-0402-10K-1%-B",
        "name": "贴片电阻 10kΩ (备选)",
        "category": "resistor",
        "manufacturer": "国巨",
        "manufacturer_pn": "RC0402FR-0710KL",
        "description": "0402封装 10kΩ 1% 贴片电阻，国巨品牌",
        "status": "active",
        "quality_level": "B",
        "preferred_rank": 2,
        "unit_price": 0.005,
        "stock": 30000,
        "lead_time_days": 7,
        "parameters": [
            ("阻值", "10kΩ"), ("精度", "1%"), ("功率", "1/16W"),
            ("封装", "0402"), ("温度系数", "±100ppm/°C"),
            ("工作温度", "-55~+125°C"), ("额定电压", "50V"),
        ],
    },
    {
        "part_number": "CAP-0402-100NF-10V",
        "name": "贴片电容 100nF",
        "category": "capacitor",
        "manufacturer": "村田",
        "manufacturer_pn": "GRM155R71A104KA01D",
        "description": "0402封装 100nF 10V X7R MLCC",
        "status": "active",
        "quality_level": "A",
        "preferred_rank": 1,
        "unit_price": 0.012,
        "stock": 80000,
        "lead_time_days": 14,
        "parameters": [
            ("容值", "100nF"), ("电压", "10V"), ("精度", "±10%"),
            ("温度特性", "X7R"), ("封装", "0402"), ("工作温度", "-55~+125°C"),
        ],
    },
    {
        "part_number": "IC-MCU-STM32F103C8T6",
        "name": "STM32F103C8T6 微控制器",
        "category": "ic_mcu",
        "manufacturer": "ST",
        "manufacturer_pn": "STM32F103C8T6",
        "description": "ARM Cortex-M3, 72MHz, 64KB Flash, 20KB RAM, LQFP-48",
        "status": "active",
        "quality_level": "A",
        "preferred_rank": 1,
        "unit_price": 8.5,
        "stock": 500,
        "lead_time_days": 30,
        "parameters": [
            ("内核", "ARM Cortex-M3"), ("主频", "72MHz"),
            ("Flash", "64KB"), ("RAM", "20KB"), ("封装", "LQFP-48"),
            ("工作电压", "2.0~3.6V"), ("工作温度", "-40~+85°C"),
            ("ADC", "12-bit, 10通道"), ("UART", "3路"), ("SPI", "2路"), ("I2C", "2路"),
        ],
    },
    {
        "part_number": "IC-PWR-AMS1117-3.3",
        "name": "AMS1117-3.3 LDO稳压器",
        "category": "ic_power",
        "manufacturer": "AMS",
        "manufacturer_pn": "AMS1117-3.3",
        "description": "1A低压差稳压器，输出3.3V，SOT-223封装",
        "status": "active",
        "quality_level": "B",
        "preferred_rank": 2,
        "unit_price": 0.35,
        "stock": 2000,
        "lead_time_days": 14,
        "parameters": [
            ("输出电压", "3.3V"), ("最大电流", "1A"),
            ("压差", "1.3V"), ("封装", "SOT-223"),
            ("精度", "±1%"), ("工作温度", "-40~+125°C"),
        ],
    },
    {
        "part_number": "CONN-USB-TYPE-C-16P",
        "name": "USB Type-C 16P 母座",
        "category": "connector",
        "manufacturer": "MOLEX",
        "manufacturer_pn": "2171750001",
        "description": "USB Type-C 16Pin SMD母座，防水等级IPX8",
        "status": "pending",
        "quality_level": "A",
        "preferred_rank": 1,
        "unit_price": 2.8,
        "stock": 1000,
        "lead_time_days": 21,
        "parameters": [
            ("接口类型", "USB Type-C"), ("引脚数", "16"),
            ("安装方式", "SMD"), ("耐压", "30V"),
            ("额定电流", "5A"), ("防水等级", "IPX8"),
            ("工作温度", "-40~+85°C"),
        ],
    },
    {
        "part_number": "IND-0402-10UH",
        "name": "贴片电感 10μH",
        "category": "inductor",
        "manufacturer": "TDK",
        "manufacturer_pn": "MLZ1005A100WT000",
        "description": "0402封装 10μH ±20% 贴片功率电感",
        "status": "deprecated",
        "quality_level": "C",
        "preferred_rank": 3,
        "unit_price": 0.15,
        "stock": 500,
        "lead_time_days": 21,
        "notes": "已发现批次问题，建议停用",
        "parameters": [
            ("感值", "10μH"), ("精度", "±20%"),
            ("直流电阻", "2.1Ω"), ("额定电流", "90mA"),
            ("封装", "0402"), ("工作温度", "-40~+85°C"),
        ],
    },
    {
        "part_number": "XTAL-12MHZ-SMD",
        "name": "贴片晶振 12MHz",
        "category": "crystal",
        "manufacturer": "EPSON",
        "manufacturer_pn": "FA-238V 12.0000MB",
        "description": "12MHz SMD晶振，3225封装，±10ppm",
        "status": "active",
        "quality_level": "A",
        "preferred_rank": 1,
        "unit_price": 0.45,
        "stock": 3000,
        "lead_time_days": 28,
        "parameters": [
            ("频率", "12MHz"), ("频率精度", "±10ppm"),
            ("封装", "3225"), ("负载电容", "12pF"),
            ("工作温度", "-20~+70°C"), ("工作电压", "3.3V"),
        ],
    },
]


async def seed():
    await init_db()

    engine = __import__('database').engine
    async with AsyncSession(engine) as session:
        # Create users
        user_map = {}
        for u in DEFAULT_USERS:
            existing = (await session.execute(select(User).where(User.username == u["username"]))).scalar_one_or_none()
            if not existing:
                user = User(
                    username=u["username"],
                    password_hash=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    department=u["department"],
                )
                session.add(user)
                await session.flush()
                user_map[u["username"]] = user.id
                print(f"Created user: {u['username']}")
            else:
                user_map[u["username"]] = existing.id
                print(f"User exists: {u['username']}")

        # Create materials
        mat_map = {}
        for m_data in SAMPLE_MATERIALS:
            existing = (await session.execute(
                select(Material).where(Material.part_number == m_data["part_number"])
            )).scalar_one_or_none()
            if not existing:
                params = m_data.pop("parameters", [])
                material = Material(
                    **{k: v for k, v in m_data.items()},
                    created_by_id=user_map.get("engineer1"),
                )
                session.add(material)
                await session.flush()
                for i, (key, value) in enumerate(params):
                    session.add(MaterialParameter(
                        material_id=material.id,
                        key=key,
                        value=value,
                        sort_order=i,
                    ))
                mat_map[m_data["part_number"]] = material.id
                print(f"Created material: {m_data['part_number']}")
            else:
                mat_map[m_data["part_number"]] = existing.id

        # Create sample projects
        for proj_data in [
            {"name": "智能传感器模块 V2", "code": "PRJ-2026-003", "stage": "schematic"},
            {"name": "电源管理板 R3", "code": "PRJ-2026-002", "stage": "prototype"},
        ]:
            existing_proj = (await session.execute(
                select(Project).where(Project.code == proj_data["code"])
            )).scalar_one_or_none()
            if not existing_proj:
                proj = Project(
                    name=proj_data["name"],
                    code=proj_data["code"],
                    stage=proj_data["stage"],
                    manager_id=user_map.get("engineer1"),
                )
                session.add(proj)
                await session.flush()
                print(f"Created project: {proj_data['code']}")

        await session.commit()
    print("\nDatabase initialization complete!")
    print("\nDefault accounts:")
    for u in DEFAULT_USERS:
        print(f"  {u['username']:15} / {u['password']:10} ({u['role']})")


async def seed_data(session: AsyncSession):
    """Called from lifespan on startup. Seeds only if no users exist."""
    from sqlalchemy import func
    count = (await session.execute(select(func.count()).select_from(User))).scalar()
    if count and count > 0:
        return  # Already seeded

    import logging
    logger = logging.getLogger(__name__)
    logger.info("Seeding initial data...")

    user_map = {}
    for u in DEFAULT_USERS:
        existing = (await session.execute(select(User).where(User.username == u["username"]))).scalar_one_or_none()
        if not existing:
            user = User(
                username=u["username"],
                password_hash=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                department=u["department"],
            )
            session.add(user)
            await session.flush()
            user_map[u["username"]] = user.id
        else:
            user_map[u["username"]] = existing.id

    mat_map = {}
    for m_data in SAMPLE_MATERIALS:
        existing = (await session.execute(
            select(Material).where(Material.part_number == m_data["part_number"])
        )).scalar_one_or_none()
        if not existing:
            m = dict(m_data)
            params = m.pop("parameters", [])
            material = Material(**m, created_by_id=user_map.get("engineer1"))
            session.add(material)
            await session.flush()
            for i, (key, value) in enumerate(params):
                session.add(MaterialParameter(
                    material_id=material.id,
                    key=key,
                    value=value,
                    sort_order=i,
                ))
            mat_map[m_data["part_number"]] = material.id
        else:
            mat_map[m_data["part_number"]] = existing.id

    for proj_data in [
        {"name": "智能传感器模块 V2", "code": "PRJ-2026-003", "stage": "schematic"},
        {"name": "电源管理板 R3", "code": "PRJ-2026-002", "stage": "prototype"},
    ]:
        existing_proj = (await session.execute(
            select(Project).where(Project.code == proj_data["code"])
        )).scalar_one_or_none()
        if not existing_proj:
            proj = Project(
                name=proj_data["name"],
                code=proj_data["code"],
                stage=proj_data["stage"],
                manager_id=user_map.get("engineer1"),
            )
            session.add(proj)

    await session.commit()
    logger.info("Initial data seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
