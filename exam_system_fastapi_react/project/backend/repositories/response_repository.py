from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.response import Response

class ResponseRepository:
    @staticmethod
    async def get_by_user_and_question(user_id: str, question_id: str, db: AsyncSession):
        stmt = select(Response).where(Response.user_id == user_id, Response.question_id == question_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_by_user(user_id: str, db: AsyncSession):
        stmt = select(Response).where(Response.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def delete_response(response: Response, db: AsyncSession):
        await db.delete(response)
        await db.commit()

    @staticmethod
    async def create_initial_questions_for_user(user_id: str, question_ids: list[str], db: AsyncSession):
        """إنشاء سجلات فارغة مبدئية للأسئلة المخصصة للمستخدم لتثبيت النموذج"""
        new_responses = [
            Response(
                user_id=user_id,
                question_id=q_id,
                answer_data=None,
                is_correct=0,
                score=0.0
            )
            for q_id in question_ids
        ]
        db.add_all(new_responses)
        await db.commit()
        return new_responses

    @staticmethod
    async def upsert(user_id: str, question_id: str, answer_data, is_correct: bool, score: float, db: AsyncSession):
        """حفظ أو تحديث إجابة المتقدم (UPSERT) - يتعامل مع إعادة الإرسال بأمان"""
        existing = await ResponseRepository.get_by_user_and_question(user_id, question_id, db=db)
        if existing:
            existing.answer_data = answer_data
            existing.is_correct = int(bool(is_correct))
            existing.score = score
            existing.answered_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return existing

        new_response = Response(
            user_id=user_id,
            question_id=question_id,
            answer_data=answer_data,
            is_correct=int(bool(is_correct)),
            score=score
        )
        db.add(new_response)
        await db.commit()
        await db.refresh(new_response)
        return new_response
    @staticmethod
    async def delete_by_user(user_id: str, db: AsyncSession):
        """حذف جميع الإجابات الخاصة بالمستخدم"""
        responses = await ResponseRepository.list_by_user(user_id, db=db)
        for response in responses:
            await db.delete(response)
        await db.commit()