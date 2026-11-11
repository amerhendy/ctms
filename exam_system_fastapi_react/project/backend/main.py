import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, APIRouter, Depends, HTTPException
from fastapi.exceptions import ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.router import api_router
from core.config import settings
from db.init_db import init_db
from db.session import get_db

# 🎉 إعداد السجلات والملفات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.FONTS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    logger.info("🚀 Starting Exam System...")
    await init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("🛑 Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_V1_PREFIX,
    description="""
## نظام إدارة المهام المؤسسي
نظام متكامل لإدارة وتنفيذ اختبارات التوظيف الإلكترونية عبر الشبكة الداخلية
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Exception Handlers ──────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "details": str(exc)},
    )

"""
@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request: Request, exc: ResponseValidationError):
    print("─── DETAILED RESPONSE VALIDATION ERROR ───")
    import json
    try:
        print(json.dumps(exc.errors(), indent=2, ensure_ascii=False))
    except Exception:
        print("فشل تحويل الخطأ لـ JSON، نكتفي بطباعة العناوين:")
        for error in exc.errors():
            print(error)
    print("──────────────────────────────────────────")
    
    return JSONResponse(
        status_code=500,
        content={"message": "Response validation error"}
    )
"""

# ── Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

# ── Routes ─────────────────────────────────────────────────────

app.include_router(api_router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.API_V1_PREFIX,
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}

# ── Execution ──────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    # 💡 الإصلاح هنا: لا يمكن دمج reload=True مع workers كعدد أكبر من 1
    # في بيئة التطوير نستخدم الـ reload، وفي بيئة الإنتاج نستخدم الـ workers
    is_reload = True  # اجعلها False في السيرفر الفعلي (Production)
    workers_count = None if is_reload else 4

    uvicorn.run(
        "main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=is_reload, 
        #workers=workers_count
    )