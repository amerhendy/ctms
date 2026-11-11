from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.deps import get_current_admin,get_current_user,get_current_token
from core.security import create_access_token,create_refresh_token
from db.session import get_db
from schemas.admin import AdminLogin, TokenResponse, AdminOut
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: AdminLogin, response: Response, db: AsyncSession = Depends(get_db)):
    return await AuthService.login_admin(payload.username, payload.password,db)

@router.post("/logout")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    
    await AuthService().logout(token,db)
    return {"success": True}


@router.get("/me", response_model=AdminOut)
async def me(admin=Depends(get_current_user)):
    return AdminOut.model_validate(admin)
