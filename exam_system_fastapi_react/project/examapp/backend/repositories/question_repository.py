from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.question import Question
class QuestionRepository:

    @staticmethod
    async def list_questions(db: AsyncSession, **filters):
        stmt=select(Question).filter_by(**filters)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_question(db: AsyncSession, question_id: str):
        stms=select(Question).where(Question.id==question_id);
        result = await db.execute(stms)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_questions_by_job_model(db: AsyncSession, job_model_id: str):
        stmt=select(Question).where(Question.job_model_id==job_model_id);
        result = await db.execute(stmt)
        return result.scalars().all()
    
    
    @staticmethod
    async def create_question(db: AsyncSession, question_data: dict):
        question = Question(**question_data)
        db.add(question)
        await db.commit()
        await db.refresh(question)
        return question
    @staticmethod
    async def update_question(db: AsyncSession, question_id: str, question_data: dict):
        question = await QuestionRepository.get_question(db, question_id)
        if not question:
            return None
        for key, value in question_data.items():
            setattr(question, key, value)
        await db.commit()
        await db.refresh(question)
        return question
    @staticmethod
    async def delete_question(db: AsyncSession, question=Question):
        await db.delete(question)
        await db.commit()
        return question
    @staticmethod
    async def delete_questions_by_job_model(db: AsyncSession, job_model_id: str):
        questions = await QuestionRepository.get_questions_by_job_model(db, job_model_id)
        for question in questions:
            await db.delete(question)
        await db.commit()
        return questions
    @staticmethod
    async def update_questions_order(db: AsyncSession, order_data: list):
        for item in order_data:
            question = await QuestionRepository.get_question(db, item["id"])
            if question:
                question.order_index = item["order_index"]
        await db.commit()

    @staticmethod
    async  def update_questions_job_model(db: AsyncSession, job_model_id: str, new_job_model_id: str):
        questions = await QuestionRepository.get_questions_by_job_model(db, job_model_id)
        for question in questions:
            question.job_model_id = new_job_model_id
        await db.commit()
        return questions