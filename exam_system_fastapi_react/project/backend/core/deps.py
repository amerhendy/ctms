"""
تبعيات (Dependencies) مشتركة تُستخدم عبر نقاط النهاية:
- الحصول على جلسة قاعدة البيانات.
- التحقق من هوية الأدمن الحالي عبر رمز الجلسة (Bearer Token أو Cookie).
- التحقق من هوية المتقدم الحالي أثناء أداء الاختبار.
"""

from typing import Optional
from jose import JWTError, jwt

from fastapi import Cookie, Depends, Header, HTTPException, status
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload,joinedload
from core.config import settings
from db.session import get_db
from repositories.admin_repository import AdminRepository
from repositories.applicant_repository import ApplicantRepository
from repositories.session_repository import SessionRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()
def _extract_token(authorization: Optional[str], cookie_token: Optional[str]) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return cookie_token


async def get_current_admin(
    authorization: Optional[str] = Header(default=None),
    admin_session: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    token = _extract_token(authorization, admin_session)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="غير مصرح، الرجاء تسجيل الدخول")

    session = await SessionRepository.get_valid_by_token(token,db=db)
    if not session or session.subject_type != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="جلسة غير صالحة أو منتهية")

    admin = await AdminRepository.get_by_id(session.subject_id,db)
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="حساب الأدمن غير موجود")
    return admin


async def get_current_applicant(
    authorization: Optional[str] = Header(default=None),
    applicant_session: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db), # 👈 استبدال AsyncSession بـ AsyncSession
):
    token = _extract_token(authorization, applicant_session)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="جلسة غير صالحة، الرجاء تسجيل الدخول من جديد",
        )

    # 👈 تمرير التوكن و db بدون المسمى db=db إلا إذا كانت دالتك تستقبله بالاسم
    session = await SessionRepository.get_valid_by_token(token, db)
    if not session or session.subject_type != "applicant":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="جلسة غير صالحة أو منتهية"
        )

    applicant = await ApplicantRepository.get(session.subject_id, db)
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="المتقدم غير موجود"
        )
        
    return applicant


async def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    from models.admin import Admin

    payload = await decode_token(credentials.credentials)
    user_id_str: Optional[str] = payload.get("sub")
    
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid token"
        )
    # 2. الاستعلام باستخدام UUID وصيغة SQLAlchemy 2.0
    stmt = select(Admin).where(Admin.id == user_id_str)
    result = await db.execute(stmt)
    user= result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found or inactive"
        )
        
    return user

def get_current_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> str:
    return credentials.credentials