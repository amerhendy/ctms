# app/services/job_level_service.py
from fastapi import HTTPException, status
from app.models.User import User
from app.repositories.job_level_repository import JobLevelRepository
from app.schemas.job_levels import JobLevelCreate, JobLevelUpdate
from app.db.enums import GlobalRole
from app.core.security import get_current_user
from app.core.utils import normalize_arabic
from typing import List, Optional
from app.models import JobLevel
from app.schemas.job_levels import JobLevelOut
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

class JobLevelService:
    def __init__(self, repo: JobLevelRepository):
        self.repo = repo

    async def list_levels(self):
        return await self.repo.get_all()

    async def create_level(self, data: JobLevelCreate, user: User):
        if user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(403, "غير مصرح لك")
        return await self.repo.create(data.model_dump())

    async def update_level(self, level_id: int, data: JobLevelUpdate, user: User):
        if user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(403, "غير مصرح لك")
        
        level = await self.repo.get_by_id(level_id)
        if not level:
            raise HTTPException(404, "المستوى غير موجود")
            
        return await self.repo.update(level, data.model_dump(exclude_unset=True))

    async def delete_level(self, level_id: int, user: User):
        if user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(403, "غير مصرح لك")
            
        level = await self.repo.get_by_id(level_id)
        if not level:
            raise HTTPException(404, "المستوى غير موجود")
            
        await self.repo.delete(level)