from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from fastapi import Request
from fastapi.exceptions import ResponseValidationError
from fastapi.responses import JSONResponse
import logging
from app.core.config import settings
from app.db.session import init_db
from app.api.v1 import api_router
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    logger.info("🚀 Starting Corporate Task Management System...")
    await init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("🛑 Shutting down...")
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## نظام إدارة المهام المؤسسي

نظام متكامل لإدارة المهام داخل الشركة مع:
- **هيكل هرمي**: إدارات، قطاعات، مناطق، محطات
- **نقل المهام بنفس المستوى الإداري**
- **تفويض الصلاحيات**
- **مصفوفة أيزنهاور** (عاجل/مهم)
- **إشعارات فورية** عبر WebSockets
- **سجل تغييرات إلزامي** لكل حدث

### الأدوار:
- `global_admin`: مدير النظام (صلاحية تقنية كاملة)
- `program_manager`: مدير البرنامج (إدارة الهيكل التنظيمي)
- `user`: موظف عادي / مدير إدارة
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request: Request, exc: ResponseValidationError):
    print("─── DETAILED RESPONSE VALIDATION ERROR ───")
    # استخراج الأخطاء كـ مصفوفة نصوص مباشرة دون المرور على كائنات SQLAlchemy
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

# ── Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routes ─────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
