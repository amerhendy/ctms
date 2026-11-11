#app/schemas/search.py
from datetime import datetime, date
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel, ConfigDict, computed_field
from app.db.enums import GlobalRole, TaskStatus, TaskPriority

# تعريف متغير نوعي (Type Variable) لدعم الـ Generic Pagination
T = TypeVar('T')

# 1. الـ Schema الموحدة للاستجابة المرقومة (Generic Pagination Schema)
class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[T]

    model_config = ConfigDict(from_attributes=True)


# 2. العلاقات الداخلية التي يرجعها المحرك التكراري (Internal Embedded Schemas)
class TaskCreatorNested(BaseModel):
    id: int
    full_name: str
    
    model_config = ConfigDict(from_attributes=True)

class TaskDepartmentNested(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)


# 3. الـ Schema الخاصة بمخرجات البحث المتقدم (TaskSearchOut)
class TaskSearchOut(BaseModel):
    id: int
    title: str
    file_number: Optional[str] = None
    priority: TaskPriority
    status: TaskStatus
    is_urgent: bool
    is_important: bool
    due_date: Optional[datetime] = None
    progress_percentage: int
    eisenhower_quadrant: Optional[int] = None
    created_at: datetime
    
    # استقبال العلاقات المتداخلة القادمة من المحرك الديناميكي
    department_id: Optional[int] = None
    department: Optional[TaskDepartmentNested] = None
    
    created_by: Optional[int] = None
    creator: Optional[TaskCreatorNested] = None

    # تفعيل قراءة البيانات التلقائية من كائنات الـ ORM والـ Dicts المتداخلة
    model_config = ConfigDict(from_attributes=True)

    # ── التسطيح الذكي عبر الـ Computed Fields ──
    # هذه الحقول ستظهر في الـ JSON الراجع للفرونت إند مباشرة في الجذر كـ تلبية لمتطلبات الـ Schema القديمة
    
    @computed_field
    @property
    def department_name(self) -> Optional[str]:
        return self.department.name if self.department else None

    @computed_field
    @property
    def creator_name(self) -> Optional[str]:
        return self.creator.full_name if self.creator else None