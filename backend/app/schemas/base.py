from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field
import math
from typing import Type, Any, Optional
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, ColumnProperty,load_only
from app.db.enums import GlobalRole,TaskStatus,TaskPriority,AssignmentType,UrgencyStatus
from fastapi import HTTPException,status
from app.models import (
    User, Task, TaskStep, TaskAssignment, TaskShare, Favorite,
    TaskComment, TaskAttachment, TaskTimeLog, RecurringTask, RecurringTaskLog, TaskTransfer,
    Department, JobLevel, Location   # <-- المضاف
)
from app.schemas.users import UserSummary
# تعريف متغير النوع (Type Variable) ليكون ديناميكياً
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    total: int = Field(..., description="إجمالي عدد السجلات في قاعدة البيانات")
    page: int = Field(..., description="رقم الصفحة الحالية")
    page_size: int = Field(..., description="عدد العناصر في الصفحة الواحدة")
    pages: int = Field(..., description="إجمالي عدد الصفحات المتاحة")
    items: List[T] = Field(..., description="قائمة البيانات المسترجعة والمطابقة للنوع المحدد")

    class Config:
        from_attributes = True



from fastapi.encoders import jsonable_encoder
from sqlalchemy import select, func, desc, asc
import math
from pydantic import BaseModel
from typing import Any, Type, Optional, TypeVar

T = TypeVar("T", bound=BaseModel)

async def apply_pagination(
    db: AsyncSession,
    base_query: Any,
    model_class: Type[Any],
    page: int = 1,
    page_size: int = 10,
    search_query: Optional[str] = None,
    search_column: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    schema_class: Optional[Type[T]] = None
) -> dict:
    """
    نسخة احترافية تدعم الترقيم الديناميكي مع معالجة ذكية للبيانات.
    """
    # 1. تطبيق البحث (Search)
    if search_query and search_column and hasattr(model_class, search_column):
        column = getattr(model_class, search_column)
        base_query = base_query.where(column.ilike(f"%{search_query}%"))
    
    # 2. حساب الإجمالي
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total_count = total_result.scalar() or 0
    
    # 3. تطبيق الفرز (Sorting)
    if sort_by and hasattr(model_class, sort_by):
        column_to_sort = getattr(model_class, sort_by)
        base_query = base_query.order_by(desc(column_to_sort) if sort_order.lower() == "desc" else asc(column_to_sort))
    
    # 4. تطبيق الترقيم (Pagination)
    if page_size != 0:
        offset_value = (page - 1) * page_size
        paginated_query = base_query.offset(offset_value).limit(page_size)
    else:
        paginated_query = base_query
        
    # التنفيذ
    result = await db.execute(paginated_query)
    items = []
    
    for row in result.all():
        # دمج الـ Mapping للحقول الإضافية إذا وجدت
        obj = row[0]
        if len(row) > 1:
            row_dict = dict(row._mapping)
            for key, value in row_dict.items():
                if key != type(obj).__name__ and key != "0":
                    setattr(obj, key, value)
        
        # التحويل إلى Schema إذا تم تمريره
        if schema_class and issubclass(schema_class, BaseModel):
            items.append(schema_class.model_validate(obj, from_attributes=True))
        else:
            # هنا التعديل الجوهري: استخدام jsonable_encoder لتحويل كائنات ORM لبيانات بسيطة
            # هذا يمنع خطأ TypeError و Serialization Error
            items.append(jsonable_encoder(obj))
            
    if page_size == 0:
        total_pages = 1
    else:
        total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1
    
    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "pages": total_pages,
        "items": items
    }
    


# دالة مساعدة لبناء الاستعلام الأساسي للمهمة محملة بجميع العلاقات المرتبطة لتجنب مشكلة الـ N+1 Query
def get_safe_user_fields():
    # 1. فلترة الحقول لتكون أعمدة فقط
    column_fields = [
        getattr(User, field_name)
        for field_name in UserSummary.model_fields.keys()
        if hasattr(User, field_name) and isinstance(User.__mapper__.get_property(field_name), ColumnProperty)
    ]
    
    # 2. نستخدم load_only للأعمدة
    return load_only(*column_fields)

def task_base_loaders():
    safe_user_fields = get_safe_user_fields()

    return [
        selectinload(Task.creator).options(
            safe_user_fields
        ),

        selectinload(Task.department).options(
            selectinload(Department.job_level),
            selectinload(Department.location),
        ),
    ]

def task_assignment_loaders():
    safe_user_fields = get_safe_user_fields()

    return [
        selectinload(
            Task.assignments.and_(
                TaskAssignment.deleted_at.is_(None)
            )
        ).options(
            selectinload(TaskAssignment.user).options(
                safe_user_fields
            ),
            selectinload(TaskAssignment.assigner).options(
                safe_user_fields
            ),
        )
    ]
def task_transfer_loaders():
    safe_user_fields = get_safe_user_fields()

    return [
        selectinload(Task.transfers).options(
            selectinload(TaskTransfer.from_department),
            selectinload(TaskTransfer.to_department),
            selectinload(TaskTransfer.from_user).options(
                safe_user_fields
            ),
            selectinload(TaskTransfer.to_user).options(
                safe_user_fields
            ),
        )
    ]


def task_interaction_loaders():
    safe_user_fields = get_safe_user_fields()

    return [
        selectinload(Task.comments).selectinload(
            TaskComment.user
        ).options(
            safe_user_fields
        ),

        selectinload(Task.favorites).selectinload(
            Favorite.user
        ).options(
            safe_user_fields
        ),

        selectinload(Task.shares),
    ]


def task_content_loaders():
    return [
        selectinload(Task.steps),
        selectinload(Task.attachments),
        selectinload(Task.time_logs),
    ]


def task_all_loaders():
    return [
        *task_base_loaders(),
        *task_assignment_loaders(),
        *task_transfer_loaders(),
        *task_interaction_loaders(),
        *task_content_loaders(),
    ]

def task_query_with_relations():
    return (
        select(Task)
        .where(Task.deleted_at.is_(None))
        .options(*task_all_loaders())
    )
# دالة مساعدة لجلب المهمة أو رمي خطأ 404 في حال عدم وجودها بداخل قاعدة البيانات
async def get_task_or_404(db: AsyncSession, task_id: int) -> Task:
    result = await db.execute(
        task_query_with_relations().where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "المهمة غير موجودة")
    return task