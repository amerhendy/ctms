"""
إعدادات التطبيق المركزية. تُقرأ من متغيرات البيئة مع قيم افتراضية آمنة
للتشغيل المباشر بدون Docker.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings:
    APP_NAME: str = "نظام اختبارات التوظيف الإلكترونية - FastAPI"
    API_V1_PREFIX: str = os.environ.get("API_V1_PREFIX", "/api/v1")
    APP_VERSION: str = os.environ.get("APP_VERSION", "0")

    HOST: str = os.environ.get("HOST", "0.0.0.0")
    PORT: int = int(os.environ.get("PORT", "5051"))

    # قاعدة بيانات SQLite (تُحفظ داخل db/data حتى تبقى بجانب طبقة الوصول للبيانات)
    SQLITE_DB_PATH: str = os.environ.get(
        "SQLITE_DB_PATH", str(BASE_DIR / "db" / "data" / "exam_system.db")
    )

    # عناوين الواجهة الأمامية المسموح لها بالاتصال (CORS)
    _cors_raw: str = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5050,http://127.0.0.1:5050"
    )
    CORS_ORIGINS: list = [o.strip() for o in _cors_raw.split(",") if o.strip()]

    # حساب الأدمن الافتراضي (يُزرع تلقائياً في أول تشغيل إن لم يوجد)
    ADMIN_DEFAULT_USERNAME: str = os.environ.get("ADMIN_DEFAULT_USERNAME", "admin")
    ADMIN_DEFAULT_PASSWORD: str = os.environ.get("ADMIN_DEFAULT_PASSWORD", "admin123")
    ADMIN_DEFAULT_FULL_NAME: str = os.environ.get("ADMIN_DEFAULT_FULL_NAME", "مدير النظام")

    # مدة صلاحية الجلسة (لكل من الأدمن والمتقدمين) بالساعات
    SESSION_EXPIRE_HOURS: int = int(os.environ.get("SESSION_EXPIRE_HOURS", "12"))

    # مجلدات الملفات
    UPLOADS_DIR: str = os.environ.get("UPLOADS_DIR", str(BASE_DIR / "uploads"))
    REPORTS_DIR: str = os.environ.get("REPORTS_DIR", str(BASE_DIR / "uploads" / "reports"))
    FONTS_DIR: str = os.environ.get("FONTS_DIR", str(BASE_DIR / "assets" / "fonts"))

    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7



settings = Settings()
