from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, AsyncSessionLocal
from routers import auth, materials, approvals, quality, projects, upload, dashboard
from config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    await init_db()
    # Auto-seed initial data if database is empty
    try:
        from init_data import seed_data
        async with AsyncSessionLocal() as session:
            await seed_data(session)
    except Exception as e:
        logger.warning(f"Auto-seed skipped or failed: {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="硬件研发物料生命周期管理系统 API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
prefix = settings.API_PREFIX
app.include_router(auth.router, prefix=prefix)
app.include_router(materials.router, prefix=prefix)
app.include_router(approvals.router, prefix=prefix)
app.include_router(quality.router, prefix=prefix)
app.include_router(projects.router, prefix=prefix)
app.include_router(upload.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
