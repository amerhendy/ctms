"""
منطق المصادقة: تسجيل دخول الأدمن (بالتحقق من كلمة المرور وإنشاء جلسة
موقّعة بالتوكن ومحفوظة في قاعدة البيانات)، وإنشاء جلسات المتقدمين أثناء
دخولهم للاختبار بكود الدخول.
"""

from datetime import datetime, timedelta,timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends,HTTPException,Response,status
from models.admin import Admin
from core.config import settings
from core.security import generate_token, verify_password,create_access_token,create_refresh_token
from repositories.admin_repository import AdminRepository
from repositories.session_repository import SessionRepository
from schemas.admin import TokenResponse

class AuthService:
    """
    def __init__(self, db: AsyncSession):
        self.db = db
        self.admin_repo = AdminRepository(db)
        self.session_repo = SessionRepository(db)
    """
    @staticmethod
    async def login_admin(username: str, password: str, db: AsyncSession):
        admin = await AdminRepository.get_by_username(username, db)
        if not admin or not verify_password(password, admin.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
        # إنشاء جلسة جديدة للأدمن
        token = create_access_token({"sub": str(admin.id)})
        refresh_token = create_refresh_token({"sub": str(admin.id)})
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.SESSION_EXPIRE_HOURS)
        await SessionRepository.create({
            "subject_type": "admin",
            "subject_id": admin.id,
            "token": token,
            "expires_at": expires_at,
        },db=db)
        return {
            "access_token": token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": str(admin.id),
            "full_name": admin.full_name
        }
        
    @staticmethod
    async def create_applicant_session(applicant_id: str, db: AsyncSession) -> str:
        token = generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.SESSION_EXPIRE_HOURS)
        await SessionRepository.create({
            "subject_type": "applicant",
            "subject_id": applicant_id,
            "token": token,
            "expires_at": expires_at,
        },db=db)
        return token

    @staticmethod
    async def logout(token: str, db: AsyncSession):
        res= await SessionRepository.delete_by_token(token,db=db)
        if not res:
            raise HTTPException(status_code=404, detail="البيانات غير موجودة أو تم تسجيل الخروج مسبقًا")
