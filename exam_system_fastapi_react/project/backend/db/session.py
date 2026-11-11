import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import event

from core.config import settings

os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)

# استخدام sqlite+aiosqlite بدلاً من sqlite العادي
DATABASE_URL = f"sqlite+aiosqlite:///{settings.SQLITE_DB_PATH}"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"timeout": 30},
    pool_pre_ping=True,
)


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA busy_timeout=30000;")
    cursor.close()


# استخدام async_sessionmaker و AsyncSession
AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    autocommit=False, 
    autoflush=False,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """تبعية FastAPI Async لتوفير جلسة قاعدة بيانات."""
    async with AsyncSessionLocal() as db:
        yield db