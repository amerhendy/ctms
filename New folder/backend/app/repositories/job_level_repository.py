# app/repositories/job_level_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload, joinedload
from app.models import User, Location, Department, JobLevel
from app.schemas.users import UserOut, UserSummary, DepartmentOut, JobLevelOut
from typing import List, Optional
from app.core.utils import normalize_arabic
from app.schemas.job_levels import JobLevelCreate, JobLevelUpdate

class JobLevelRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(JobLevel).order_by(JobLevel.level_number))
        return result.scalars().all()

    async def get_by_id(self, level_id: int):
        result = await self.db.execute(select(JobLevel).where(JobLevel.id == level_id))
        return result.scalar_one_or_none()

    async def create(self, data: dict):
        level = JobLevel(**data)
        self.db.add(level)
        await self.db.commit()
        await self.db.refresh(level)
        return level

    async def update(self, level: JobLevel, data: dict):
        for k, v in data.items():
            setattr(level, k, v)
        await self.db.commit()
        await self.db.refresh(level)
        return level

    async def delete(self, level: JobLevel):
        await self.db.delete(level)
        await self.db.commit()