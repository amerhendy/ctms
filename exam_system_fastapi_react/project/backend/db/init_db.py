"""
تهيئة قاعدة البيانات: إنشاء كل الجداول (عبر Base.metadata) وزرع حساب
الأدمن الافتراضي وبيانات تجريبية (نماذج وظائف وأسئلة) عند أول تشغيل فقط.
"""

import json
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

import models  # noqa: F401  (يضمن تسجيل كل النماذج في Base.metadata)
from core.config import settings
from core.security import hash_password
from db.base import Base
from db.session import AsyncSessionLocal, engine
from models.admin import Admin
from models.job_model import JobModel
from models.question import Question


async def init_db():
    # إنشاء الجداول بطريقة غير متزامنة (Async)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # زرع البيانات باستخدام AsyncSession
    async with AsyncSessionLocal() as db:
        await _seed_admin(db)
        await _seed_sample_data(db)


async def _seed_admin(db: AsyncSession):
    stmt = select(Admin).where(Admin.username == settings.ADMIN_DEFAULT_USERNAME)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        return

    admin = Admin(
        username=settings.ADMIN_DEFAULT_USERNAME,
        password_hash=hash_password(settings.ADMIN_DEFAULT_PASSWORD),
        full_name=settings.ADMIN_DEFAULT_FULL_NAME,
    )
    db.add(admin)
    await db.commit()
    print(f"[DB] تم إنشاء حساب الأدمن الافتراضي: {settings.ADMIN_DEFAULT_USERNAME}")


async def _seed_sample_data(db: AsyncSession):
    # فحص عدد نماذج الوظائف المسجلة
    count_stmt = select(func.count()).select_from(JobModel)
    count_result = await db.execute(count_stmt)
    total_jobs = count_result.scalar_one()

    if total_jobs > 0:
        return

    jm1 = JobModel(name="محاسب مالي", description="اختبار تقييم الكفاءة المالية والمحاسبية", duration_minutes=45, count_questions=3)
    jm2 = JobModel(name="مبرمج تطبيقات", description="اختبار تقييم مهارات البرمجة الأساسية", duration_minutes=60, count_questions=3)
    jm3 = JobModel(name="موظف إدخال بيانات", description="اختبار تقييم الدقة اللغوية وإدخال البيانات", duration_minutes=30, count_questions=3)

    db.add_all([jm1, jm2, jm3])
    await db.commit()
    
    # تحديث الكائنات للحصول على الـ IDs المولدة تلقائياً
    await db.refresh(jm1)
    await db.refresh(jm2)
    await db.refresh(jm3)

    def qd(data):
        return json.dumps(data, ensure_ascii=False)

    questions = [
        Question(
            job_model_id=jm1.id, q_type="mcq",
            question_text="ما هي المعادلة الصحيحة لحساب صافي الربح؟",
            question_data=qd({
                "options": ["الإيرادات - المصروفات", "الإيرادات + المصروفات", "الأصول - الخصوم", "لا شيء مما سبق"],
                "correct_index": 0,
            }),
            points=2, order_index=1,
        ),
        Question(
            job_model_id=jm1.id, q_type="excel_formula",
            question_text="اكتب معادلة إكسل لحساب مجموع الخلايا من A1 إلى A10",
            question_data=qd({"answer_keywords": ["SUM(A1:A10)", "=SUM(A1:A10)"]}),
            points=3, order_index=2,
        ),
        Question(
            job_model_id=jm1.id, q_type="mcq",
            question_text="أي القوائم المالية التالية يوضح المركز المالي للشركة في تاريخ معين؟",
            question_data=qd({
                "options": ["قائمة الدخل", "الميزانية العمومية", "قائمة التدفقات النقدية", "قائمة حقوق الملكية"],
                "correct_index": 1,
            }),
            points=2, order_index=3,
        ),
        Question(
            job_model_id=jm2.id, q_type="mcq",
            question_text="ما هي لغة البرمجة المستخدمة بشكل أساسي في تطوير واجهات الويب من جهة العميل؟",
            question_data=qd({"options": ["Python", "JavaScript", "C++", "SQL"], "correct_index": 1}),
            points=2, order_index=1,
        ),
        Question(
            job_model_id=jm2.id, q_type="code_correction",
            question_text="صحح الخطأ في السطر البرمجي التالي: for i in range(10) print(i)",
            question_data=qd({"answer_keywords": ["for i in range(10): print(i)", ":"]}),
            points=3, order_index=2,
        ),
        Question(
            job_model_id=jm3.id, q_type="language_check",
            question_text='دقق الجملة التالية لغوياً واكتبها بالشكل الصحيح: "انا ذاهب الى المدرسه"',
            question_data=qd({"answer_keywords": ["أنا ذاهب إلى المدرسة"]}),
            points=2, order_index=1,
        ),
        Question(
            job_model_id=jm3.id, q_type="mcq",
            question_text="أي مما يلي يمثل الاستخدام الصحيح لهمزة القطع؟",
            question_data=qd({"options": ["إحسان", "احسان", "اٍحسان", "ٳحسان"], "correct_index": 0}),
            points=2, order_index=2,
        ),
    ]
    
    db.add_all(questions)
    await db.commit()
    print("[DB] تم إدخال بيانات تجريبية (نماذج وظائف وأسئلة) بنجاح.")