from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.User import User,UserProfileOut,GoogleLinkInput
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from app.core.security import (create_access_token, create_refresh_token,get_current_user)
import os
from app.repositories.auth_repository import AuthRepository
from app.services.auth_service import AuthService   
from app.api.v1.endpoints.users_router import get_current_user_profile
router = APIRouter(prefix="/auth", tags=["Authentication"])
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(AuthRepository(db))
    user = await service.authenticate_user(data.identifier, data.password)
    managed_ids = [m.department_id for m in user.managed_departments]
    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id)}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        global_role=user.global_role.value,
        managed_department_ids=managed_ids
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(AuthRepository(db))
    result = await service.refresh_tokens(data.refresh_token)
    
    user = result["user"]
    managed_ids = [m.department_id for m in user.managed_departments]
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user_id=user.id,
        full_name=user.full_name,
        global_role=user.global_role.value,
        managed_department_ids=managed_ids,
        token_type="bearer"
    )

@router.post("/google", response_model=TokenResponse)
async def google_login(id_token_str: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    service = AuthService(AuthRepository(db))
    user = await service.authenticate_google_user(id_token_str)
    managed_ids = [m.department_id for m in user.managed_departments]
    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id)}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
        user_id=user.id,
        full_name=user.full_name,
        global_role=user.global_role.value,
        managed_department_ids=managed_ids,
        token_type="bearer"
    )

@router.get("/me", response_model=UserProfileOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    جلب بيانات الملف الشخصي للموظف الحالي.
    """
    print(f"DEBUG IN ENDPOINT: User object in Endpoint: {current_user}")
    print(f"DEBUG IN ENDPOINT: Managed departments count: {len(current_user.managed_departments)}")
    return current_user
# مخطط لاستقبال التوكن في الـ Body


@router.post("/google/link")
async def link_google_account(
    payload: GoogleLinkInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ربط حساب جوجل من داخل شاشة تعديل البيانات الشخصية للموظف الحالي.
    يخزن الـ google_id ويحدث البريد الإلكتروني الرسمي للموظف بناءً على حساب جوجل.
    """
    service = AuthService(AuthRepository(db))
    user = await service.link_google_account_service(current_user, payload.id_token_str)
    
    return {
        "message": "تم ربط حساب Google بنجاح",
        "id": user.id,
        "email": user.email,
        "google_id": user.google_id,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url
    }


@router.post("/google/unlink")
async def unlink_google_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AuthService(AuthRepository(db))
    user = await service.unlink_google_account_service(current_user)
    
    return {
        "message": "تم إلغاء ربط حساب Google بنجاح.",
        "id": user.id,
        "email": user.email,
        "google_id": user.google_id
    }