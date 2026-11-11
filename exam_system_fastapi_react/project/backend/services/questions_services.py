from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.job_model_repository import JobModelRepository
from db.session import get_db
from repositories.question_repository import QuestionRepository


async def list_questions(limit=100,filter=None, db: AsyncSession = Depends(get_db)):
    filters = filter if filter else {}
    questions = await QuestionRepository.list_questions(db=db, **filters)
    if not questions:
            raise HTTPException(status_code=404, detail="لا توجد أسئلة")
    return questions

async def get_question(question_id: str, db: AsyncSession = Depends(get_db)):
    #check if question exists
    question = await QuestionRepository.get_question(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    return question

async def get_questions_by_job_model(job_model_id: str, db: AsyncSession = Depends(get_db)):
    #check if job model exists
    job_model = await JobModelRepository.get_by_id(db=db, job_model_id=job_model_id)
    if not job_model:
        raise HTTPException(status_code=404, detail="نموذج الوظيفة غير موجود")
    questions = await QuestionRepository.get_questions_by_job_model(db=db, job_model_id=job_model_id)
    if not questions:
            raise HTTPException(status_code=404, detail="لا توجد أسئلة")
    return questions

async def get_question_by_id(question_id: str, db: AsyncSession = Depends(get_db)):
    question = await QuestionRepository.get_question(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    return question

async def create_question(question_data: dict, db: AsyncSession = Depends(get_db)):
    question = await QuestionRepository.create_question(db=db, question_data=question_data)
    return question

async def update_question(question_id: str, question_data: dict, db: AsyncSession = Depends(get_db)):
    question = await QuestionRepository.update_question(db=db, question_id=question_id, question_data=question_data)
    return question
async def delete_question(question_id: str, db: AsyncSession = Depends(get_db)):
    #check if question exists
    question = await QuestionRepository.get_question(db=db, question_id=question_id)
    if not question:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    #remove question
    question = await QuestionRepository.delete_question(db,question)
    return question
async def delete_questions_by_job_model(job_model_id: str, db: AsyncSession = Depends(get_db)):
    questions = await QuestionRepository.delete_questions_by_job_model(db=db, job_model_id=job_model_id)
    return questions

async def update_questions_job_model(job_model_id: str, new_job_model_id: str, db: AsyncSession = Depends(get_db)):
    await QuestionRepository.update_questions_job_model(db=db, job_model_id=job_model_id, new_job_model_id=new_job_model_id)
    return {"message": "Questions job model updated successfully."}