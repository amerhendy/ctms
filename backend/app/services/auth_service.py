# app/services/auth_service.py
from fastapi import HTTPException,status
from app.models import User
from app.repositories.auth_repository import AuthRepository
from app.core.security import get_password_hash,verify_password, create_access_token, create_refresh_token,decode_token
from datetime import datetime, timezone
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import Settings
class AuthService:
    def __init__(self, repo: AuthRepository):
        self.repo = repo

    async def authenticate_user(self, identifier, password):
        print(get_password_hash(password))
        user = await self.repo.get_by_identifier(identifier)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="الحساب غير مفعّل")
            
        await self.repo.update_last_login(user.id)
        return user

    async def google_link_logic(self, user: User, google_id: str, email: str, avatar: str):
        # 🛡️ تحقق من التكرار (Unique Constraints)
        # يمكنك إضافة دالة في الـ Repo للتحقق من عدم وجود مستخدم آخر بنفس الإيميل أو Google ID
        # ... logic here ...
        user.google_id = google_id
        user.email = email
        user.avatar_url = avatar
        await self.repo.db.commit()
        return user
    
    async def authenticate_google_user(self, id_token_str: str):
        # 1. التحقق من التوكن (يمكنك نقل هذا لـ Helper في core/security)
        try:
            info = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), Settings.GOOGLE_CLIENT_ID)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=f"Invalid Google Token: {str(e)}")

        google_id, email = info.get("sub"), info.get("email")
        
        # 2. محاولة البحث
        user = await self.repo.get_by_google_id(google_id) or await self.repo.get_by_email(email)
        
        if not user:
            raise HTTPException(status_code=404, detail="الحساب غير مسجل بالنظام")
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="الحساب معطل")

        # 3. تحديث البيانات (Auto-link)
        return await self.repo.update_user_google_data(user, google_id, email, info.get("picture"))


    async def refresh_tokens(self, refresh_token: str):
        # 1. فك التشفير والتحقق من النوع
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid refresh token")

        # 2. جلب المستخدم
        user_id = int(payload["sub"])
        user = await self.repo.get_by_id(user_id)

        # 3. التحقق من وجود ونشاط المستخدم
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")

        # 4. توليد التوكنز الجديدة
        return {
            "access_token": create_access_token({"sub": str(user.id)}),
            "refresh_token": create_refresh_token({"sub": str(user.id)}),
            "user": user # نرجع كائن المستخدم لتعبئة الـ Response
        }

    async def link_google_account_service(self, current_user: User, id_token_str: str):
        # 1. التحقق من التوكن (استخراج البيانات)
        id_info = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), Settings.GOOGLE_CLIENT_ID)
        g_id, g_email, g_avatar = id_info.get("sub"), id_info.get("email"), id_info.get("picture")

        if not g_id or not g_email:
            raise HTTPException(status_code=400, detail="فشل استخراج بيانات Google")

        # 2. فحص الأمان (التأكد من عدم تداخل الحسابات)
        existing_by_gid = await self.repo.get_by_google_id(g_id)
        if existing_by_gid and existing_by_gid.id != current_user.id:
            raise HTTPException(status_code=400, detail="حساب Google مرتبط بموظف آخر!")

        existing_by_email = await self.repo.get_by_email(g_email)
        if existing_by_email and existing_by_email.id != current_user.id:
            raise HTTPException(status_code=400, detail="البريد الإلكتروني مستخدم من قبل موظف آخر!")

        # 3. التحديث
        current_user.google_id = g_id
        current_user.email = g_email
        current_user.avatar_url = g_avatar
        await self.repo.db.commit()
        await self.repo.db.refresh(current_user)
        return current_user

    async def unlink_google_account_service(self, current_user: User):
        # 1. التحقق من وجود الربط
        if not current_user.google_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="الحساب غير مرتبط بـ Google أصلاً لتتم عملية إلغاء الربط."
            )

        # 2. تنفيذ الإلغاء
        current_user.google_id = None
        # current_user.avatar_url = None # اختياري كما ذكرت
        
        return await self.repo.update_user(current_user)