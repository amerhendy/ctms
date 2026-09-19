# app/services/user_stats_service.py

from datetime import datetime,timedelta,date
from typing import List, Optional
from app.models.Task import Task

from app.repositories.user_repository import UserRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.task_analytics_repository import TaskAnalyticsRepository
from app.db.enums import TaskStatus
from app.schemas.user_stats_schema import UserStatsResponse
from app.schemas.tasks import TaskListItem
from app.core.utils import logger
class UserStatsService:

    # ------------------------------------------------------------
    # الدوال المساعدة (الحسابات الداخلية)
    # ------------------------------------------------------------

    @staticmethod
    def _calculate_relative_speed(db, task: Task) -> Optional[float]:
        """
        حساب السرعة النسبية لمهمة واحدة (إذا توفرت البيانات).
        النسبة = (الوقت الفعلي / الوقت المتوقع) * 100
        الوقت الفعلي = completed_at - created_at (بالأيام)
        الوقت المتوقع = due_date - created_at (بالأيام)
        """
        if not task.due_date or not task.completed_at:
            return None
        # استخدام فرق الأيام (يمكن تحسينه للساعات إذا كانت المهام أقل من يوم)
        expected_days = (task.due_date - task.created_at.date()).days
        actual_days = (task.completed_at - task.created_at).days
        if expected_days <= 0:
            return None   # تجنب القسمة على صفر
        return (actual_days / expected_days) * 100.0

    # ------------------------------------------------------------
    # دوال الإحصائيات الأساسية
    # ------------------------------------------------------------
    @staticmethod
    async def get_active_tasks_count(db, user_id: int) -> int:
        """إرجاع عدد المهام النشطة (غير المكتملة وغير الملغاة) التي قام المستخدم بتنفيذها."""
        tasks = await UserRepository.get_user_tasks(db,user_id, include_completed=False)
        return len(tasks)

    @staticmethod
    async def get_completed_tasks_count(db, user_id: int) -> int:
        """إرجاع عدد المهام المكتملة (مع احتساب جميع المهام المنتهية)."""
        tasks = await UserRepository.get_user_tasks(db,user_id, include_completed=True)
        completed = [t for t in tasks if t.status == TaskStatus.COMPLETED]
        return len(completed)

    @staticmethod
    async def calculate_commitment_rate(completed_count: int, total_count: int) -> float:
        if total_count == 0:
            return 0.0
        
        # حساب النسبة المئوية
        rate = (completed_count / total_count) * 100
        return round(rate, 2)
    
    @staticmethod
    async def get_avg_relative_speed(db, user_id: int) -> float:
        """
        متوسط السرعة النسبية لجميع المهام المنتهية التي يمكن حسابها.
        """
        tasks = await UserRepository.get_user_tasks(db,user_id, include_completed=True)
        speeds = []
        for t in tasks:
            if t.status == TaskStatus.COMPLETED:
                sp = UserStatsService._calculate_relative_speed(db,t)
                if sp is not None:
                    speeds.append(sp)
        if not speeds:
            return 0.0
        return sum(speeds) / len(speeds)

    @staticmethod
    async def get_total_hours(db, user_id: int, task_ids: list) -> float:
        return await TaskAnalyticsRepository.get_total_hours_for_tasks(db, task_ids)
    
    @staticmethod
    async def get_comments_count(db, task_ids: list) -> int:
        """عدد التعليقات للمهام المحددة."""
        return await TaskAnalyticsRepository.count_comments_for_tasks(db, task_ids)

    @staticmethod
    async def get_favorites_count(db, user_id: int, task_ids: list) -> int:
        """عدد المهام المفضلة للمستخدم ضمن المهام المعنية."""
        return await TaskAnalyticsRepository.count_favorites_for_tasks(db, user_id, task_ids)


    @staticmethod
    async def get_proactive_alerts(db, user_ids: list,task_ids:list):
        alerts_data = await TaskAnalyticsRepository.get_proactive_alerts(db, task_ids)
        
        alerts = []
        for task in alerts_data:
            alert_type = "OVERDUE" if task.due_date and task.due_date.date() < date.today() else "PENDING_URGENCY"
            alerts.append({
                "task_id": task.id,
                "title": task.title,
                "type": alert_type,
                "message": "مهمة متأخرة" if alert_type == "OVERDUE" else "طلب استعجال بانتظار الموافقة"
            })
        return alerts
    
    @staticmethod
    async def get_quick_actions(db, user_ids: list, task_ids: list):
        last_task = await TaskAnalyticsRepository.get_last_active_task(db, user_ids)
        pending_approvals = await TaskAnalyticsRepository.count_pending_approvals(db, task_ids)
        
        return {
            "last_active_task_id": last_task.id if last_task else None,
            "last_active_task_title": last_task.title if last_task else None,
            "pending_approvals_count": pending_approvals
        }
    
    @staticmethod
    async def get_active_favorites_list(db, user_ids: list):
        favorites = await TaskAnalyticsRepository.get_active_favorites(db, user_ids)
        return [
            {"id": t.id, "title": t.title, "status": t.status} 
            for t in favorites
        ]
    @staticmethod
    async def get_latest_active_tasks(db, task_ids,limit=5):
        tasks=await TaskAnalyticsRepository.get_latest_active_tasks(db, task_ids,limit=5)
        task_items = []
        for task in tasks:
            # هنا يتم ملء الحقول المحسوبة
            item = TaskListItem(
                id=task.id,
                title=task.title,
                priority=task.priority,
                status=task.status,
                is_urgent=task.is_urgent,
                is_important=task.is_important,
                due_date=task.due_date,
                progress_percentage=task.progress_percentage, # تأكد من وجوده في الموديل
                department_id=task.department_id,
                department_name=task.department.name if task.department else None,
                created_by=task.created_by,
                creator_name=task.creator.full_name if task.creator else None,
                urgency_request_status=task.urgency_request_status,
                is_favorite=len(task.favorites) > 0, # افتراض بسيط للتحقق
                file_number=task.file_number,
                steps_count=len(task.steps),
                completed_steps_count=len([s for s in task.steps if s.is_completed]),
                completed_at=task.completed_at
            )
            task_items.append(item)
        return task_items

    @staticmethod
    async def get_latest_transferred_tasks(db, task_ids,limit=5):
        tasks=await TaskAnalyticsRepository.get_latest_transferred_tasks(db, task_ids,limit=5)
        task_items = []
        for task in tasks:
            # هنا يتم ملء الحقول المحسوبة
            item = TaskListItem(
                id=task.id,
                title=task.title,
                priority=task.priority,
                status=task.status,
                is_urgent=task.is_urgent,
                is_important=task.is_important,
                due_date=task.due_date,
                progress_percentage=task.progress_percentage, # تأكد من وجوده في الموديل
                department_id=task.department_id,
                department_name=task.department.name if task.department else None,
                created_by=task.created_by,
                creator_name=task.creator.full_name if task.creator else None,
                urgency_request_status=task.urgency_request_status,
                is_favorite=len(task.favorites) > 0, # افتراض بسيط للتحقق
                file_number=task.file_number,
                steps_count=len(task.steps),
                completed_steps_count=len([s for s in task.steps if s.is_completed]),
                completed_at=task.completed_at
            )
            task_items.append(item)
        return task_items
    
    @staticmethod
    async def get_dashboard_summary(db, user_id, start_date, end_date):
        
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        task_ids = await TaskAnalyticsRepository.get_all_related_task_ids(db, [user_id], start_date, end_date)
        total_count=len(task_ids)
        completed_count = await TaskAnalyticsRepository.count_tasks_by_logic(db, task_ids, is_completed=True)
        active_count = await TaskAnalyticsRepository.count_tasks_by_logic(db, task_ids, is_completed=False)
        commitment_rate = await UserStatsService.calculate_commitment_rate(completed_count, total_count)
        total_hours = await TaskAnalyticsRepository.get_total_hours_for_tasks(db, task_ids)
        comments_count = await TaskAnalyticsRepository.count_comments_for_tasks(db, task_ids)
        favorites_count = await TaskAnalyticsRepository.count_favorites_for_tasks(db, [user_id],task_ids)
        avg_delay = await TaskAnalyticsRepository.get_avg_performance_delay(db, task_ids)
        overdue_count = await TaskAnalyticsRepository.count_overdue_tasks(db, task_ids)
        completed_this_week = await TaskAnalyticsRepository.count_completed_in_range(db, task_ids, start_of_week, today)
        alerts = await UserStatsService.get_proactive_alerts(db,[user_id],task_ids)
        department_distribution = await TaskAnalyticsRepository.get_task_distribution_by_department(db, task_ids)
        quick_actions=await UserStatsService.get_quick_actions(db,[user_id],task_ids=task_ids)
        active_favorites= await UserStatsService.get_active_favorites_list(db,[user_id])
        urgent_count = await TaskAnalyticsRepository.count_urgent_tasks(db, task_ids)
        pending_count=await TaskAnalyticsRepository.count_transferred_tasks(db, task_ids)
        notification_count=await TaskAnalyticsRepository.count_notifications_for_users(db, task_ids,start_date, end_date)
        eisenhower_stats = await TaskAnalyticsRepository.count_tasks_by_eisenhower(db, task_ids)
        activeTasks=await UserStatsService.get_latest_active_tasks(db, task_ids,limit=5)
        transfared_tasks=await UserStatsService.get_latest_transferred_tasks(db, task_ids,limit=5)
        #urgent_tasks
        return {
            "total_tasks": total_count,
            "active_tasks_count": active_count,
            "completed_tasks_count": completed_count,
            "commitment_rate": commitment_rate,
            "avg_relative_speed": avg_delay,    # سيتم ربطها لاحقاً
            "total_hours": total_hours,           # سيتم ربطها لاحقاً
            "comments_count": comments_count,          # سيتم ربطها لاحقاً
            "favorites_count": favorites_count,         # سيتم ربطها لاحقاً
            "overdue_tasks_count": overdue_count,
            "completed_this_week": completed_this_week,
            "alerts":alerts,
            "department_distribution": department_distribution,
            "quick_actions":quick_actions,
            "active_favorites":active_favorites,
            "status": "success",
            "urgent_count":urgent_count,
            "pending_count":pending_count,
            "notification_count":notification_count,
            "eisenhower_distribution":eisenhower_stats,
            "active_tasks":activeTasks,
            "transfared_tasks":transfared_tasks,
        }
    
    @staticmethod
    async def get_department_summary(db, department_id: int, start_date, end_date):
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        # 1. جلب كل المستخدمين في الشجرة الإدارية
        user_ids = await DepartmentRepository.get_all_user_ids_in_dept_tree(db, department_id)
        
        if not user_ids:
            # إرجاع رد فارغ إذا لم يوجد موظفون
            return await UserStatsService.get_empty_stats() 

        # 2. جلب كل الـ task_ids المرتبطة بهؤلاء المستخدمين (دالة جديدة في الـ Repo)
        task_ids = await TaskAnalyticsRepository.get_all_related_task_ids_for_users(db, user_ids,start_date, end_date)
        
        # 3. تجميع الإحصائيات (نستخدم نفس الدوال التي عدلناها سابقاً)
        total_hours = await TaskAnalyticsRepository.get_total_hours_for_tasks(db, task_ids)
        active_count = await TaskAnalyticsRepository.count_tasks_by_status(db, task_ids, TaskStatus.IN_PROGRESS)
        notStart_count = await TaskAnalyticsRepository.count_tasks_by_status(db, task_ids, TaskStatus.NOT_STARTED)
        completed_count = await TaskAnalyticsRepository.count_tasks_by_status(db, task_ids, TaskStatus.COMPLETED)
        commitment_rate = await UserStatsService.calculate_commitment_rate(completed_count, len(task_ids))
        avg_delay = await TaskAnalyticsRepository.get_avg_performance_delay(db, task_ids)
        comments_count = await TaskAnalyticsRepository.count_comments_for_tasks(db, task_ids)
        favorites_count = await TaskAnalyticsRepository.count_favorites_for_tasks(db, user_ids,task_ids)
        overdue_count = await TaskAnalyticsRepository.count_overdue_tasks(db, task_ids)
        completed_this_week = await TaskAnalyticsRepository.count_completed_in_range(db, task_ids, start_of_week, today)
        alerts = await UserStatsService.get_proactive_alerts(db,user_ids,task_ids)
        department_distribution = await TaskAnalyticsRepository.get_task_distribution_by_department(db, task_ids)
        quick_actions=await UserStatsService.get_quick_actions(db,user_ids,task_ids=task_ids)
        active_favorites= await UserStatsService.get_active_favorites_list(db,user_ids)
        urgent_count = await TaskAnalyticsRepository.count_urgent_tasks(db, task_ids)
        pending_count=await TaskAnalyticsRepository.count_transferred_tasks(db, task_ids)
        notification_count=await TaskAnalyticsRepository.count_notifications_for_users(db, task_ids,start_date, end_date)
        eisenhower_stats = await TaskAnalyticsRepository.count_tasks_by_eisenhower(db, task_ids)
        activeTasks=await UserStatsService.get_latest_active_tasks(db, task_ids,limit=5)
        transfared_tasks=await UserStatsService.get_latest_transferred_tasks(db, task_ids,limit=5)
        return UserStatsResponse(
            active_tasks_count=active_count+notStart_count,
            completed_tasks_count= completed_count,
            commitment_rate= commitment_rate,
            avg_relative_speed= avg_delay,
            total_hours= total_hours,
            comments_count= comments_count,
            favorites_count= favorites_count,
            total_tasks= len(task_ids),
            overdue_tasks_count= overdue_count,
            completed_this_week= completed_this_week,
            alerts= alerts,
            status= "success",
            department_distribution= department_distribution,
            active_favorites= active_favorites,
            quick_actions= quick_actions,
            urgent_count=urgent_count,
            pending_count=pending_count,
            notification_count=notification_count,
            eisenhower_distribution=eisenhower_stats,
            active_tasks=activeTasks,
            transfared_tasks=transfared_tasks,
        )
    
    @staticmethod
    async def get_empty_stats():
         return UserStatsResponse(
            active_tasks_count=0,
            completed_tasks_count= 0,
            commitment_rate= 0.0,
            avg_relative_speed= 0.0,
            total_hours= 0.0,
            comments_count= 0,
            favorites_count= 0,
            total_tasks= 0,
            overdue_tasks_count= 0,
            completed_this_week= 0,
            alerts= [],
            status= "No data",
            department_distribution= [],
            active_favorites= [],
            urgent_count=0,
            pending_count=0,
            quick_actions= {
                            "last_active_task_id":None,
                            "last_active_task_title":  None,
                            "pending_approvals_count": 0
                        },
            notification_count=0,
            eisenhower_distribution=[],
            active_tasks=[],
            transfared_tasks=[]
        )