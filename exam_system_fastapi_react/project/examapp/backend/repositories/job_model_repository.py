from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from models.job_model import JobModel
from repositories.base_repository import BaseRepository
from repositories.question_repository import QuestionRepository
class JobModelRepository:
    @staticmethod
    async def get_all_job_models(db: AsyncSession = Depends(get_db)):
        stmt= select(JobModel)
        result = await db.execute(stmt)
        return result.scalars().all() 

    @staticmethod
    async def create(payload: dict, db: AsyncSession = Depends(get_db)):
        job_model = JobModel(**payload)
        db.add(job_model)
        await db.commit()
        await db.refresh(job_model)
        return job_model

    @staticmethod
    async def get_by_id(job_model_id: str, db: AsyncSession = Depends(get_db)):
        stmt = select(JobModel).where(JobModel.id == job_model_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_job_model(job_model: JobModel, payload: dict, db: AsyncSession = Depends(get_db)):
        for key, value in payload.items():
            setattr(job_model, key, value)
        await db.commit()
        await db.refresh(job_model)
        return job_model

    @staticmethod
    async def delete_job_model(job_model: JobModel, db: AsyncSession = Depends(get_db)):
        await db.delete(job_model)
        await db.commit()
        return True