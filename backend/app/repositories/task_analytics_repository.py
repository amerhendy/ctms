from sqlalchemy import select, union_all, func, distinct, and_,case
from datetime import datetime,date
from app.models.Task import Task
from app.models.TaskAssignment import TaskAssignment
from app.models.TaskComment import TaskComment
from app.models.TaskAttachment import TaskAttachment
from app.models.TaskLog import TaskLog
from app.models.TaskStep import TaskStep
from app.models.TaskShare import TaskShare
from app.models.TaskTimeLog import TaskTimeLog
from app.models.TaskTransfer import TaskTransfer
from app.models.Department import Department
from app.models.Notification import Notification
from app.db.enums import TaskStatus, UrgencyStatus
from app.models.Favorite import Favorite
from app.repositories.task_repo import TaskRepository
from app.core.utils import logger
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List,Dict
class TaskAnalyticsRepository:

    @staticmethod
    def _get_timestamp_column(model_name: str):
        mapping = {
            "TaskAssignment": "assigned_at",
            "TaskAttachment": "created_at",
            "TaskComment": "created_at",
            "TaskLog": "timestamp",
            "TaskSteps": "created_at",
            "TaskShares": "created_at",
            "TaskTimeLog": "started_at",
            "TaskTransfers": "created_at",
            "Task": "created_at"
        }
        return mapping.get(model_name, "created_at")
    
    @staticmethod
    def _apply_date_filter(stmt, model, start_date=None, end_date=None):
        if not (start_date or end_date):
            return stmt
            
        # الحصول على اسم العمود من الخريطة
        col_name = TaskAnalyticsRepository._get_timestamp_column(model.__name__)
        col = getattr(model, col_name)
        
        filters = []
        if start_date:
            filters.append(col >= start_date)
        if end_date:
            filters.append(col <= end_date)
            
        return stmt.where(and_(*filters))

    # 1. المهام التي أنشأها أو طلبها المستخدم
    @staticmethod
    def _q_by_creation(user_ids: List[int], start_date=None, end_date=None):
        stmt = select(Task.id.label('task_id')).where((Task.created_by .in_(user_ids)) | (Task.urgency_requested_by .in_(user_ids)))
        return TaskAnalyticsRepository._apply_date_filter(stmt, Task, start_date, end_date)

    # 2. المرفقات
    @staticmethod
    def _q_by_attachments(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskAttachment.task_id).where(TaskAttachment.user_id .in_(user_ids))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskAttachment, start_date, end_date)

    # 3. التعليقات
    @staticmethod
    def _q_by_comments(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskComment.task_id).where(TaskComment.user_id .in_(user_ids))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskComment, start_date, end_date)

    # 4. سجلات العمل (Logs)
    @staticmethod
    def _q_by_logs(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskLog.task_id).where(TaskLog.user_id .in_(user_ids))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskLog, start_date, end_date)

    # 5. خطوات المهام
    @staticmethod
    def _q_by_steps(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskStep.task_id).where(TaskStep.completed_by .in_(user_ids))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskStep, start_date, end_date)

    # 6. المشاركة (Shares)
    @staticmethod
    def _q_by_shares(user_ids: List[int], start_date=None, end_date=None):
        # المستخدم قد يكون مشارِكاً (shared_by) أو مشارَكاً معه (shared_with)
        stmt= select(TaskShare.task_id).where((TaskShare.shared_with_user_id .in_(user_ids)) | (TaskShare.shared_by .in_(user_ids)))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskShare, start_date, end_date)

    # 7. سجلات الوقت (Time Logs)
    @staticmethod
    def _q_by_timelogs(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskTimeLog.task_id).where(TaskTimeLog.user_id .in_(user_ids))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskTimeLog, start_date, end_date)

    # 8. التحويلات (Transfers)
    @staticmethod
    def _q_by_transfers(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskTransfer.task_id).where((TaskTransfer.from_user_id .in_(user_ids)) | (TaskTransfer.to_user_id .in_(user_ids)))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskTransfer, start_date, end_date)

    # 9. التعيينات (Assignments)
    @staticmethod
    def _q_by_assignments(user_ids: List[int], start_date=None, end_date=None):
        stmt= select(TaskAssignment.task_id).where(TaskAssignment.user_id .in_(user_ids))
        return TaskAnalyticsRepository._apply_date_filter(stmt, TaskAssignment, start_date, end_date)

    @staticmethod
    async def get_all_related_task_ids(db, user_id: list, start_date=None, end_date=None):
        """
        تجميع كل العلاقات في استعلام واحد سريع.
        استخدام union (بدون all) يقوم بعمل حذف للتكرار (Distinct) تلقائياً.
        """
        queries = [
            TaskAnalyticsRepository._q_by_creation(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_attachments(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_comments(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_logs(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_steps(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_shares(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_timelogs(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_transfers(user_id, start_date, end_date),
            TaskAnalyticsRepository._q_by_assignments(user_id, start_date, end_date),
        ]
        ###################testing##############
        #test_stmts = TaskAnalyticsRepository._q_by_creation(user_id)
        #query=test_stmts
        #tester=await db.execute(select(query.c.task_id).distinct())
        #logger.debug(tester.scalars().all())
        ######################testing###########
        if not queries:
            return []
            
        final_stmt = union_all(*queries).subquery()
        
        try:
            result = await db.execute(select(distinct(final_stmt.c.task_id)))
            results= result.scalars().all() or [] # ضمان إرجاع قائمة فارغة بدلاً من None
            return results
        except Exception:
            # في حال حدوث أي خطأ في قاعدة البيانات، نعيد قائمة فارغة
            return []
        
    @staticmethod
    async def count_tasks_by_logic(db, task_ids: list, is_completed: bool = False):
        """
        تحسب المهام بناءً على منطق الـ completed_at 
        والحالة (Status) الموجودة في الـ Enum.
        """
        if not task_ids:
            return 0
        
        # إذا كنا نبحث عن المكتملة
        if is_completed:
            # المكتملة هي التي فيها completed_at ليس null
            condition = Task.completed_at.isnot(None)
        else:
            # النشطة هي التي لم تكتمل (completed_at is null) 
            # وتكون حالتها ليست 'completed' أو 'cancelled'
            condition = and_(
                Task.completed_at.is_(None),
                Task.status.in_([TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS])
            )
        
        stmt = select(func.count(Task.id)).where(
            (Task.id.in_(task_ids)) & condition
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0

    
    @staticmethod
    async def count_comments_for_tasks(db, task_ids: list):
        """
        تحسب إجمالي عدد التعليقات للمهام المحددة.
        """
        if not task_ids:
            return 0
        
        # نقوم بعمل count لجميع سجلات التعليقات التي تتبع المهام
        stmt = select(func.count(TaskComment.id)).where(
            TaskComment.task_id.in_(task_ids)
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def count_favorites_for_tasks(db, user_ids: list, task_ids: list):
        """
        تحسب عدد المهام المفضلة للمستخدم ضمن نطاق المهام المرتبطة به.
        """
        if not task_ids or not user_ids:
            return 0
        
        # ربط الجدولين لضمان أننا نحسب المفضلة التابعة للمهام المعنية فقط
        stmt = select(func.count(Favorite.id)).where(
            (Favorite.user_id.in_(user_ids) ) &
            (Favorite.task_id.in_(task_ids))
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def get_avg_performance_delay(db, task_ids: list):
        """
        حساب متوسط الفارق الزمني (بالأيام) بين وقت التسليم الفعلي وتاريخ الاستحقاق.
        """
        # نختار المهام التي اكتملت فقط (لأنها التي لديها تاريخ إنجاز)
        # ونحسب الفرق بين completed_at و due_date
        stmt = select(
            func.avg(
                func.extract('day', Task.completed_at - Task.due_date)
            )
        ).where(
            (Task.id.in_(task_ids)) & 
            (Task.completed_at.isnot(None)) & 
            (Task.due_date.isnot(None))
        )
        
        result = await db.execute(stmt)
        # القيمة الناتجة هي متوسط عدد الأيام (موجبة يعني تأخير، سالبة يعني إنجاز مبكر)
        return round(result.scalar() or 0.0, 2)
    
    @staticmethod
    async def count_overdue_tasks(db, task_ids: list):
        """
        حساب المهام التي تجاوزت تاريخ الاستحقاق ولم تكتمل بعد.
        """
        if not task_ids:
            return 0
            
        today = date.today()
        stmt = select(func.count(Task.id)).where(
            (Task.id.in_(task_ids)) &
            (Task.due_date < today) &
            (Task.completed_at.is_(None)) &
            (Task.status != TaskStatus.COMPLETED)
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def count_completed_in_range(db, task_ids: list, start_date: date, end_date: date):
        """
        حساب المهام التي اكتملت في نطاق زمني محدد.
        """
        if not task_ids:
            return 0
            
        stmt = select(func.count(Task.id)).where(
            (Task.id.in_(task_ids)) &
            (Task.completed_at >= start_date) &
            (Task.completed_at <= end_date)
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def get_proactive_alerts(db, task_ids: list):
        """
        جلب المهام التي تحتاج انتباه عاجل:
        1. مهام متأخرة (Due date passed)
        2. طلبات استعجال معلقة (Urgency request status is PENDING)
        """
        today = date.today()
        stmt = select(Task).where(
            (Task.id.in_(task_ids)) &
            (
                ((Task.due_date < today) & (Task.status != TaskStatus.COMPLETED)) |
                (Task.urgency_request_status == UrgencyStatus.PENDING)
            )
        ).limit(5) # نجلب آخر 5 تنبيهات فقط للداشبورد
        
        result = await db.execute(stmt)
        return result.scalars().all()


    @staticmethod
    async def get_task_distribution_by_department(db, task_ids: list):
        """
        جلب توزيع المهام حسب القسم مع الاسم.
        """
        if not task_ids:
            return []

        # نقوم بعمل JOIN مع جدول الأقسام
        stmt = (
            select(
                Task.department_id,
                Department.name.label("department_name"), # جلب اسم القسم
                func.count(Task.id).label("task_count")
            )
            .join(Department, Task.department_id == Department.id) # ربط الجداول
            .where(Task.id.in_(task_ids))
            .group_by(Task.department_id, Department.name)
        )
        
        result = await db.execute(stmt)
        
        # إرجاع البيانات متضمنة الاسم
        return [
            {
                "department_id": row.department_id, 
                "department_name": row.department_name, 
                "count": row.task_count
            } 
            for row in result.all()
        ]
    
    @staticmethod
    async def get_last_active_task(db, user_ids: list):
        """جلب آخر مهمة تفاعل معها المستخدم."""
        stmt = (
            select(Task)
            .join(TaskLog)
            .where(TaskLog.user_id.in_(user_ids))
            .order_by(TaskLog.timestamp.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def count_pending_approvals(db, task_ids: list):
        """حساب المهام التي تتطلب موافقة عاجلة (مثلاً: طلبات استعجال معلقة)."""
        stmt = select(func.count(Task.id)).where(
            (Task.id.in_(task_ids)) &
            (Task.urgency_request_status == UrgencyStatus.PENDING)
        )
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def get_active_favorites(db, user_ids: list):
        """
        جلب المهام المفضلة للمستخدم والتي لم تكتمل بعد (Active Favorites).
        """
        stmt = (
            select(Task)
            .join(Favorite, Task.id == Favorite.task_id)
            .where(
                (Favorite.user_id.in_(user_ids)) & 
                (Task.status != TaskStatus.COMPLETED) &
                (Task.deleted_at.is_(None))
            )
            .order_by(Task.created_at.desc())
            .limit(5) # نجلب آخر 5 مفضلات نشطة
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_all_related_task_ids_for_users(db, user_ids: List[int], start_date=None, end_date=None):
        """
        تجميع كل العلاقات لقائمة من المستخدمين في استعلام واحد.
        تستخدم UNION لجلب كافة المهام التي تفاعل معها أي مستخدم في القائمة.
        """
        if not user_ids:
            return []

        # استدعاء الدوال المساعدة مع تمرير القائمة (تأكد أن الدوال المساعدة تستخدم .in_(user_ids))
        queries = [
            TaskAnalyticsRepository._q_by_creation(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_attachments(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_comments(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_logs(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_steps(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_shares(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_timelogs(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_transfers(user_ids, start_date, end_date),
            TaskAnalyticsRepository._q_by_assignments(user_ids, start_date, end_date),
        ]
        
        # دمج كل الاستعلامات باستخدام union_all
        # ملاحظة: union_all أسرع، والـ distinct الخارجي يقوم بتصفية التكرار
        final_stmt = union_all(*queries).subquery()
        
        try:
            # تنفيذ الاستعلام لجلب الـ IDs الفريدة فقط
            result = await db.execute(select(distinct(final_stmt.c.task_id)))
            return result.scalars().all() or []
        except Exception as e:
            logger.error(f"Error fetching related tasks for users: {e}")
            return []

    @staticmethod
    async def get_total_hours_for_tasks(db: AsyncSession, task_ids: List[int]) -> float:
        """حساب إجمالي الساعات لقائمة مهام معينة."""
        if not task_ids:
            return 0.0
        
        stmt = select(func.sum(TaskTimeLog.duration_minutes)).where(
            TaskTimeLog.task_id.in_(task_ids)
        )
        result = await db.execute(stmt)
        total_minutes = result.scalar() or 0
        return round(total_minutes / 60, 2)

    @staticmethod
    async def count_tasks_by_status(db: AsyncSession, task_ids: List[int], status: TaskStatus) -> int:
        """حساب عدد المهام في حالة معينة (مثلاً: Completed)."""
        if not task_ids:
            return 0
            
        stmt = select(func.count(Task.id)).where(
            and_(
                Task.id.in_(task_ids),
                Task.status == status
            )
        )
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def count_urgent_tasks(db: AsyncSession, task_ids: List[int]) -> int:
        """
        حساب عدد المهام المستعجلة ضمن قائمة محددة من الـ Task IDs.
        """
        if not task_ids:
            return 0
        
        # استعلام لجلب عدد المهام التي تحقق شرط الاستعجال
        # ملاحظة: قم بتعديل Task.is_urgent حسب اسم الحقل الفعلي في الموديل لديك
        stmt = select(func.count(Task.id)).where(
            and_(
                Task.id.in_(task_ids),
                Task.is_urgent == True  # أو Task.priority == 'URGENT'
            )
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def count_transferred_tasks(db: AsyncSession, task_ids: List[int]) -> int:
        """
        حساب عدد المهام التي خضعت لعملية تحويل (Transfer) ضمن قائمة المهام المحددة.
        """
        if not task_ids:
            return 0
        
        # استعلام لحساب المهام الفريدة التي تم تحويلها
        # نستخدم distinct لأن المهمة الواحدة قد تُحول أكثر من مرة
        stmt = select(func.count(func.distinct(TaskTransfer.task_id))).where(
            TaskTransfer.task_id.in_(task_ids)
        )
        
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def count_notifications_for_users(db: AsyncSession, user_ids: List[int], start_date=None, end_date=None) -> int:
        """
        حساب إجمالي الإشعارات لجميع الموظفين التابعين للإدارة.
        """
        if not user_ids:
            return 0
            
        stmt = select(func.count(Notification.id)).where(
            Notification.user_id.in_(user_ids)
        )
        
        # إضافة الفلتر الزمني إذا تم تمريره
        if start_date:
            stmt = stmt.where(Notification.created_at >= start_date)
        if end_date:
            stmt = stmt.where(Notification.created_at <= end_date)
            
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def count_tasks_by_eisenhower(db: AsyncSession, task_ids: List[int]) -> Dict[str, int]:
        if not task_ids:
            return {"Q1_DO_FIRST": 0, "Q2_SCHEDULE": 0, "Q3_DELEGATE": 0, "Q4_ELIMINATE": 0}

        # ترجمة منطق الـ property إلى SQL Case expression
        # ملاحظة: تأكد من تطابق الشروط مع المنطق الفعلي لديك
        quadrant_case = case(
                (Task.is_urgent & Task.is_important, "Q1_DO_FIRST"),
                (~Task.is_urgent & Task.is_important, "Q2_SCHEDULE"),
                (Task.is_urgent & ~Task.is_important, "Q3_DELEGATE"),
                else_="Q4_ELIMINATE"
            ).label("quadrant")

        stmt = select(quadrant_case, func.count(Task.id)).where(
            Task.id.in_(task_ids)
        ).group_by(quadrant_case)
        
        result = await db.execute(stmt)
        data = result.all()
        
        # تهيئة القاموس بالقيم الافتراضية
        counts = {"Q1_DO_FIRST": 0, "Q2_SCHEDULE": 0, "Q3_DELEGATE": 0, "Q4_ELIMINATE": 0}
        for quadrant, count in data:
            if quadrant in counts:
                counts[quadrant] = count
        return [{"quadrant": k, "count": v} for k, v in counts.items()]
    
    @staticmethod
    async def get_latest_active_tasks(db: AsyncSession, task_ids: List[int], limit: int = 5) -> List[Task]:
        if not task_ids:
            return []
        basequery=TaskRepository.get_base_query()
        stmt=basequery.where(
                Task.id.in_(task_ids),
                Task.status.in_([TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS]),
                Task.completed_at.is_(None)
            ).order_by(Task.created_at.desc()).limit(limit)
      
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_latest_transferred_tasks(db: AsyncSession, task_ids: List[int], limit: int = 5) -> List[Task]:
        if not task_ids:
            return []

        basequery = TaskRepository.get_base_query()
        
        # الحل: استخدام .distinct(Task.id) 
        # والتأكد أن الترتيب يبدأ بـ Task.id 
        # وللحصول على الأحدث، نقوم بعمل Subquery أو نستخدم الترتيب المركب بذكاء
        stmt = (
            basequery
            .join(TaskTransfer, Task.id == TaskTransfer.task_id)
            .where(Task.id.in_(task_ids))
            .distinct(Task.id)
            .order_by(Task.id, TaskTransfer.created_at.desc()) # الترتيب الصحيح لـ Postgres
            .limit(limit)
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()