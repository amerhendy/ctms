from datetime import datetime, date, time
from sqlalchemy.future import select
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession

# استيراد الموديلات الرسمية والموثقة من نظامك
from app.models import RecurringTask, Task, RecurringTaskLog, User 
# استيراد دالة الإشعارات الذكية والـ WebSocket التي قمت ببنائها
from app.services.notification_service import NotificationService 

async def execute_recurring_tasks_automation(db: AsyncSession):
<<<<<<< HEAD
=======
    """
    محرك الأتمتة الدوري المطور: 
    يقوم بتوليد المهام تلقائياً + تسجيل العمليات في الـ Logs + إرسال إشعارات فورية حية (WebSocket) للموظفين.
    """
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    now_utc = datetime.utcnow()
    today = now_utc.date()
    current_time = now_utc.time()
    
<<<<<<< HEAD
    # جلب القوالب النشطة مع خطواتها غير المحذوفة
    stmt = select(RecurringTask).options(
        selectinload(RecurringTask.steps.and_(RecurringTaskStep.deleted_at.is_(None)))
    ).where(
=======
    # 1. جلب قوالب المهام الدورية النشطة والمستحقة تنفيذاً اليوم أو قبله
    stmt = select(RecurringTask).where(
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        and_(
            RecurringTask.is_active == True,
            RecurringTask.deleted_at == None,
            RecurringTask.next_run_date <= today
        )
    )
<<<<<<< HEAD
    
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    result = await db.execute(stmt)
    templates = result.scalars().all()
    
    executed_count = 0
    for template in templates:
<<<<<<< HEAD
        if template.next_run_date == today and template.run_time > current_time:
            continue
            
        log_entry = RecurringTaskLog(recurring_task_id=template.id, run_at=now_utc)
        
        try:
            task_priority = template.priority.upper() if template.priority else "MEDIUM"
            
            # 1. إنشاء المهمة الرئيسية
=======
        # الشرط الذكي: إذا كان تاريخ اليوم هو المستهدف ولكن وقت الساعة (run_time) لم يحن بعد، يتخطاه للدورة القادمة
        if template.next_run_date == today and template.run_time > current_time:
            continue
            
        # تجهيز سجل المراقبة الحالي
        log_entry = RecurringTaskLog(recurring_task_id=template.id, run_at=now_utc)
        
        try:
            # معالجة درجة الأهمية لضمان توافقها مع الـ Enum بالحروف الكبيرة
            task_priority = template.priority.upper() if template.priority else "MEDIUM"
            
            # 2. إنشاء المهمة الجديدة في جدول الـ tasks
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            new_task = Task(
                title=template.title,
                description=template.description,
                department_id=template.department_id,
                priority=task_priority,
<<<<<<< HEAD
                status="not_started",
                created_by=template.created_by,
                created_at=now_utc
            )
            db.add(new_task)
            await db.flush()  # للحصول على new_task.id
            
            # 2. نسخ خطوات القالب وإدراجها كـ TaskSteps فعلية للمهمة
            for t_step in template.steps:
                task_step = TaskStep(
                    task_id=new_task.id,
                    title=t_step.title,
                    description=t_step.description,
                    step_order=t_step.step_order,
                    is_parallel=t_step.is_parallel,
                    status="pending",
                    assigned_department_id=t_step.assigned_department_id,
                    assigned_user_id=t_step.assigned_user_id,
                    created_at=now_utc
                )
                db.add(task_step)

            # 3. إرسال الإشعارات
=======
                status="NOT_STARTED",  # القيمة الصحيحة الموثقة من الـ Enum الخاص بك
                created_by=1,          # معرّf نظام الأتمتة الافتراضي أو الأدمن
                created_at=now_utc
            )
            db.add(new_task)
            await db.flush()  # للحصول على id المهمة الجديدة وربطه بالإشعار والسجلات فوراً
            
            # 3. جلب جميع الموظفين التابعين للقسم المستهدف لإشعارهم
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            user_stmt = select(User).where(User.department_id == template.department_id)
            user_result = await db.execute(user_stmt)
            department_users = user_result.scalars().all()
            
<<<<<<< HEAD
=======
            # 4. إرسال الإشعارات الفورية لكل موظف في القسم (Database + Live WebSocket)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            for user in department_users:
                await NotificationService.create(
                    db=db,
                    user_id=user.id,
<<<<<<< HEAD
                    notification_type="task_assigned",
                    title="📅 مهمة دورية تلقائية",
                    body=f"قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: ({template.title}).",
                    related_task_id=new_task.id,
                    extra_data={"automation": True, "template_id": template.id},
                    send_ws=True
                )
            
            # 4. حساب تاريخ التشغيل القادم
            template.next_run_date = calculate_next_run_date(template.next_run_date, template.recurrence_pattern, template.interval_value)
            template.updated_at = now_utc
            
=======
                    notification_type="task_assigned",  # من الـ Enum المعتمد لديك لإسناد المهام
                    title="📅 مهمة دورية تلقائية",
                    body=f"قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: ({template.title}). يرجى المتابعة والبدء في التنفيذ.",
                    related_task_id=new_task.id,       # ربط ذكي برقم المهمة لفتحها مباشرة من الفرونت إند
                    extra_data={"automation": True, "template_id": template.id},
                    send_ws=True                        # تفعيل الدفع الفوري عبر الـ WebSocket
                )
            
            # 5. حساب وتحديث تاريخ التشغيل القادم للقالب الدوري وتحديث وقت التعديل
            old_run_date = template.next_run_date
            template.next_run_date = calculate_next_run_date(old_run_date, template.recurrence_pattern, template.interval_value)
            template.updated_at = now_utc
            
            # تحديث السجل بحالة النجاح
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            log_entry.status = "success"
            log_entry.generated_task_id = new_task.id
            executed_count += 1
            
        except Exception as e:
<<<<<<< HEAD
=======
            # في حال حدوث أي خطأ، يتم التراجع عن العمليات غير المحفوظة لهذه المهمة فقط لحماية سلامة البيانات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            await db.rollback()
            log_entry.status = "failed"
            log_entry.error_message = str(e)
            
<<<<<<< HEAD
        db.add(log_entry)
        
=======
        # حفظ سجل التشغيل سواء نجح أو فشل لمراقبته من لوحة التحكم
        db.add(log_entry)
        
    # اعتماد الحفظ النهائي لكافة العمليات الناجحة والسجلات في قاعدة البيانات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    await db.commit()
    return {"status": "completed", "tasks_generated": executed_count}


def calculate_next_run_date(current_date: date, pattern: str, interval: int) -> date:
<<<<<<< HEAD
=======
    """دالة مساعدة لحساب تاريخ التشغيل القادم بناءً على النمط المحدد إدارياً"""
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    from datetime import timedelta
    if pattern == "daily":
        return current_date + timedelta(days=interval)
    elif pattern == "weekly":
        return current_date + timedelta(weeks=interval)
    elif pattern == "monthly":
<<<<<<< HEAD
=======
        # إضافة شهر معالجة برمجياً بشكل مبسط
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        import calendar
        month = current_date.month - 1 + interval
        year = current_date.year + month // 12
        month = month % 12 + 1
        day = min(current_date.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)
    return current_date + timedelta(days=1)