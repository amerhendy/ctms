import os
import asyncio
from celery import Celery
from celery.schedules import crontab
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 1. استيراد كائن الإعدادات الموحد من نظامك (مصدر الحقيقة الوحيد)
from app.core.config import settings 

# 2. إنشاء تطبيق السيلري بالاعتماد على المتغيرات المركزية
celery_app = Celery(
    "ctms",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# 3. إعداد جلسة قاعدة البيانات للـ Worker باستخدام الرابط المركزي الموحد
DATABASE_URL = settings.DATABASE_URL
engine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# 4. الـ Celery Task الخاصة بالأتمتة الدورية
@celery_app.task(name="app.worker.run_recurring_tasks_automation")
def run_recurring_tasks_automation():
    """
    مهمة خلفية تستدعي محرك أتمتة المهام الدوري غير المتزامن 
    وتدير الـ Async Loop داخل بيئة السيلري المتزامنة بشكل آمن ونظيف.
    """
    from app.services.recurring_service import execute_recurring_tasks_automation
    
    # إدارة الـ Event Loop لبيئة البايثون داخل الحاوية
    loop = asyncio.get_event_loop() if asyncio.get_event_loop().is_running() else asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def _execute_with_context():
        # فتح جلسة اتصال مستقلة وآمنة مع قاعدة البيانات لهذه الدورة
        async with AsyncSessionLocal() as db:
            return await execute_recurring_tasks_automation(db)
            
    try:
        # تشغيل المحرك والانتظار حتى انتهاء الفحص وتوليد المهام والإشعارات الحية
        result = loop.run_until_complete(_execute_with_context())
        return f"Automation success: {result}"
    except Exception as e:
        return f"Automation failed with error: {str(e)}"


# 5. جدول الجدولة التلقائي (Celery Beat Schedule) ليعمل السيرفر وحده
celery_app.conf.beat_schedule = {
    "trigger-automation-every-15-minutes": {
        "task": "app.worker.run_recurring_tasks_automation",
        "schedule": 900.0,  # التشغيل آلياً كل 15 دقيقة (15 * 60 ثانية) لفحص الساعات بدقة
    },
}


# المهمة التجريبية الخاصة بك (تظل كما هي)
@celery_app.task
def example_task(x, y):
    return x + y