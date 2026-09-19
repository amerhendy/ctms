# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query,BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.db.session import get_db
from app.models import User
from app.db.enums import GlobalRole
# استيراد النماذج من الهيكل الجديد
from app.schemas.users import (
    UserCreate, UserUpdate, UserOut, UserSummary, 
    UserPasswordChange, UserCheckResponse, UserStatsOut, DepartmentUserCount
)
from app.core.security import (
    get_current_user
)
from sqlalchemy.orm import selectinload, joinedload
from app.services.user_service import UserService
from app.services.notification_service import NotificationService
from app.schemas.notification_settings import NotificationSettingsUpdate, NotificationSettingsOut
from app.core.permissions import AccessService
router = APIRouter(prefix="/users", tags=["Users"])

# 1. رابط جلب الملف الشخصي للمستخدم الحالي (مستحدث)
@router.get("/me", response_model=UserOut, operation_id="get_current_user_profile")
async def get_current_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await UserService.get_user_profile(db,current_user.id,current_user)

# 5. إنشاء موظف جديد
@router.post("", response_model=UserOut, status_code=201, operation_id="create_user")
async def create_user(
    data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    
):
    return await UserService.create_user_service(db,data, current_user,background_tasks)





# 2. رابط جلب إحصائيات لوحة التحكم للمستخدمين (مستحدث)
@router.get("/stats/summary", response_model=UserStatsOut, operation_id="get_users_stats_summary")
async def get_users_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await UserService.get_stats_summary(db,current_user)


# 3. رابط فحص توفر البريد أو الرقم الوظيفي لحظياً (مستحدث)
@router.get("/check-availability", response_model=UserCheckResponse, operation_id="check_user_availability")
async def check_user_availability(
    email: Optional[str] = None,
    employee_number: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await UserService.check_user_field_availability(db,email, employee_number)


# 4. رابط جلب قائمة المستخدمين - معدل لدعم الـ Pagination العام والعلاقات المتداخلة
@router.get("", response_model=dict, operation_id="list_users")
async def list_users(
    department_id: Optional[List[int]] = Query(None),
    is_active: Optional[bool] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = "created_at",
    sort_order: str = "desc",
    target: str =None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = {"department_id": department_id, "is_active": is_active, "q": q}
    
    result = await UserService.list_users_service(db,current_user, filters, page, page_size, sort_by, sort_order)
    
    # تنسيق النتيجة
    result["items"] = [UserOut.model_validate(u).model_dump() for u in result["items"]]
    return result




# 6. جلب مستخدم محدد بالـ ID
@router.get("/{user_id}", response_model=UserOut, operation_id="get_user")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await UserService.get_user_profile(db,user_id, current_user)


@router.patch("/{user_id}", response_model=UserOut, operation_id="update_user_profile")
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 2. تحويل البيانات (من Pydantic إلى Dictionary) مع استبعاد القيم الفارغة
    update_data = data.model_dump(exclude_unset=True)
    
    # 3. تمرير المنطق للـ Service (التي ستقوم بدورها بالتواصل مع الـ Repository)
    return await UserService.update_user_profile(db,user_id, update_data, current_user)


# 8. رابط تفعيل أو تعطيل حساب المستخدم (مستحدث)
@router.patch("/{user_id}/toggle-active", response_model=UserOut)
async def toggle_user_active_status(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    تغيير حالة الحساب بالتبديل بين التنشيط والتعطيل (خاص بالأدمن والمدراء)
    """
    return await UserService.toggle_active_status(db,user_id, current_user)
    


# 9. تغيير كلمة المرور - تم إصلاح مشكلة الـ Commit
@router.post("/{user_id}/change-password")
async def change_password(
    user_id: int,
    data: UserPasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await UserService.change_user_password(db,user_id, data, current_user)


# 10. جلب الموظفين التابعين (المرؤوسين) لشخص محدد
from typing import Optional
from fastapi import Query

@router.get("/{user_id}/subordinates", response_model=dict)
async def get_subordinates(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: Optional[str] = "full_name",
    sort_order: str = "asc",
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # حماية أعمدة الفرز
    allowed = ["id", "full_name", "job_title", "created_at"]
    safe_sort = sort_by if sort_by in allowed else "full_name"
    
    params = {
        "page": page,
        "page_size": page_size,
        "search_query": q.strip() if q else None,
        "search_column": "full_name",
        "sort_by": safe_sort,
        "sort_order": sort_order
    }
    
    return await UserService.get_subordinates_service(db,user_id, params)

@router.patch("/{user_id}/notification-settings", response_model=NotificationSettingsOut)
async def update_user_notifications(
    user_id:int,
    data: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # نمرر البيانات كـ dictionary (باستخدام exclude_unset=True لتحديث الحقول المرسلة فقط)
    updated_settings = await NotificationService.update_settings(
        db, current_user, user_id, data.model_dump(exclude_unset=True)
    )
    return updated_settings