from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Corporate Task Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./corporate_tasks.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@example.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.example.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    GOOGLE_CLIENT_ID: str = ""
    TASK_ATTACHMENT_DIR: str="storage/attachments"
    MAX_FILE_SIZE:int = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS:set[str] = {
        # صور
        'jpg', 'jpeg', 'png', 'gif', 
        # مستندات وورد قديم وجديد
        'pdf', 'doc', 'docx', 
        # إكسل وجداول بيانات
        'xls', 'xlsx', 'csv', 
        # باوربوينت
        'ppt', 'pptx', 
        # أكسس
        'mdb', 'accdb', 
        # نصوص وقواعد بيانات
        'txt', 'sql', 
        # ملفات مضغوطة
        'zip', 'rar',
        'dwg', 'dxf', 'stl', 'step', 'iges',  # ملفات التصميم الهندسي
    }

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
