"""
معالجة المزامنة اللحظية لإجابات المتقدمين، مع إعادة المحاولة تلقائياً
عند حدوث قفل مؤقت لقاعدة البيانات نتيجة الكتابة المتزامنة من عدد كبير
من المتقدمين في نفس اللحظة.
"""

import time
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.exc import OperationalError

from services.exam_service import ExamService
async def process_single_answer(db: AsyncSession, user_id: str, question_id: str, answer_data, max_retries: int = 3):
    attempt = 0
    last_error = None
    while attempt < max_retries:
        try:
            # 💡 التعديل الجوهري: إضافة await هنا واستبعاد Depends(get_db) من التمرير المباشر
            result = await ExamService.save_and_grade(user_id, question_id, answer_data, db)
            return {"success": True, "question_id": question_id, "result": result}
        except OperationalError as e:
            await db.rollback() # rollback أيضاً غير متزامنة مع AsyncSession
            last_error = str(e)
            attempt += 1
            await asyncio.sleep(0.3 * attempt) # استخدام asyncio.sleep بدلاً من time.sleep
        except ValueError as e:
            return {"success": False, "question_id": question_id, "error": str(e)}
            
    return {"success": False, "question_id": question_id, "error": last_error or "فشل حفظ الإجابة بعد عدة محاولات"}


async def process_batch(db: AsyncSession, user_id: str, answers):
    results = []
    for item in answers:
        # إضافة await هنا
        result = await process_single_answer(db, user_id, item.question_id, item.answer_data)
        results.append(result)
    return results
