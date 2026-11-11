# crud/violation.py
from sqlalchemy.ext.asyncio import AsyncSession
from models.violation import Violation
from schemas.violation import ViolationSchema

async def save_violation_to_db(db: AsyncSession, data: ViolationSchema, applicant_id: int) -> Violation:
    # 1. إنشاء كائن المخالفة
    new_violation = Violation(
        user_id=applicant_id,
        violation_type=data.violation_type,
        details=data.details
    )
    
    # 2. الحفظ في قاعدة البيانات
    db.add(new_violation)
    await db.commit()
    await db.refresh(new_violation)
    
    return new_violation