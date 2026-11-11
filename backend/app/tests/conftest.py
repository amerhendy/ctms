import pytest
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base
from app.db.session import get_db

# استخدام قاعدة بيانات فحص منفصلة (يفضل SQLite في الذاكرة للفحص السريع)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session", autouse=True)
async def initialize_test_db():
    """إنشاء الجداول قبل الفحص وحذفها بعد الانتهاء"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """توفير جلسة داتابيز معزولة لكل تيرست"""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback() # لضمان عدم تداخل البيانات بين الاختبارات

@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """تجهيز الـ HTTP Client واستبدال الـ get_db الحقيقية بجلسة الفحص"""
    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()