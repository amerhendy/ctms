#api/v1/endpoints/jobLevel.py
"""
Job Levels API – مستويات الوظائف
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
# استيراد النماذج العامة ونماذج المؤسسة والموظفين
from app.schemas.job_levels import JobLevelCreate, JobLevelUpdate, JobLevelOut

from app.core.security import get_current_user
from app.services.job_level_service import JobLevelService
from app.repositories.job_level_repository import JobLevelRepository
from app.models.User import User
router = APIRouter(tags=["JobLevels - مستويات الوظائف"])

# ─── Job Levels (مستويات الوظائف) ───────────────────────────────────────────

@router.get("/job-levels", response_model=List[JobLevelOut])
async def list_job_levels(db: AsyncSession = Depends(get_db)):
    return await JobLevelService(JobLevelRepository(db)).list_levels()

@router.post("/job-levels", response_model=JobLevelOut, status_code=201)
async def create_job_level(data: JobLevelCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await JobLevelService(JobLevelRepository(db)).create_level(data, user)

@router.put("/job-levels/{level_id}", response_model=JobLevelOut)
async def update_job_level(level_id: int, data: JobLevelUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await JobLevelService(JobLevelRepository(db)).update_level(level_id, data, user)

@router.delete("/job-levels/{level_id}")
async def delete_job_level(level_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await JobLevelService(JobLevelRepository(db)).delete_level(level_id, user)
    return {"message": "تم الحذف بنجاح"}