# app/schemas/user_stats_schema.py

from pydantic import BaseModel
from typing import Optional, List
from app.schemas.tasks import TaskListItem
<<<<<<< HEAD
from app.schemas.tasks import EisenhowerDistributionItem
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

class EisenhowerStats(BaseModel):
    quadrant: str
    count: int

class FavoriteTaskItem(BaseModel):
    id: int
    title: str
    status: str

class AlertItem(BaseModel):
    task_id: int
    title: str
    type: str # 'OVERDUE' or 'PENDING_URGENCY'
    message: str

class DeptDistribution(BaseModel):
    department_id: int
    department_name: str
    count: int


class QuickActions(BaseModel):
    last_active_task_id: Optional[int]
    last_active_task_title: Optional[str]
    pending_approvals_count: int

class UserStatsResponse(BaseModel):
    active_tasks_count: int
    completed_tasks_count: int
    commitment_rate: float      # نسبة مئوية (0-100)
    avg_relative_speed: float   # متوسط السرعة النسبية (%)
    total_hours: float          # ساعات
    comments_count: int
    favorites_count: int
    total_tasks: int
    overdue_tasks_count:int
    completed_this_week:int
    alerts: List[AlertItem]
    status: str
    department_distribution: List[DeptDistribution]
    active_favorites: List[FavoriteTaskItem]
    quick_actions: QuickActions
    urgent_count:int
    pending_count:int
    notification_count:int
<<<<<<< HEAD
    eisenhower_distribution:List[EisenhowerDistributionItem] 
=======
    eisenhower_distribution:List[EisenhowerStats]
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    active_tasks:List[TaskListItem]
    transfared_tasks:List[TaskListItem]