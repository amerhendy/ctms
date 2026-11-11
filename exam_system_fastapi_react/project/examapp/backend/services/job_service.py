from fastapi import Depends, logger
from repositories.question_repository import QuestionRepository
from db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.job_model_repository import JobModelRepository
from services.questions_services import delete_questions_by_job_model, get_questions_by_job_model
async def get_all_jobs(db: AsyncSession = Depends(get_db)):
    return await JobModelRepository.get_all_job_models(db)

async def create_job(payload: dict, db: AsyncSession = Depends(get_db)):
    return await JobModelRepository.create(payload, db)

async def get_job_by_id(job_model_id: str, db: AsyncSession = Depends(get_db)):
    return await JobModelRepository.get_by_id(job_model_id, db)

async def update_job(job_model_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    job_model = await JobModelRepository.get_by_id(job_model_id, db)
    if not job_model:
        return None
    return await JobModelRepository.update_job_model(job_model, payload, db)

async def delete_job(job_model_id: str, db: AsyncSession = Depends(get_db)):
    #check if job model exists
    job_model = await JobModelRepository.get_by_id(job_model_id, db)
    if not job_model:
        return None

    #check if model has questions, if yes delete them first
    questions = await QuestionRepository.get_questions_by_job_model(db=db, job_model_id=job_model_id)
    if questions:
        await delete_questions_by_job_model(job_model_id, db)

    #delete model
    return await JobModelRepository.delete_job_model(job_model, db)