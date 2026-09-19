# app/services/location_service.py
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from app.models import User, Department
from app.schemas.users import UserOut, UserSummary
from app.schemas.locations import LocationCreate, LocationOut,LocationUpdate
from app.repositories.location_repository import LocationRepository
from app.schemas.base import PaginatedResponse,apply_pagination
from typing import List, Optional
from app.core.utils import normalize_arabic
from app.models.User import User
from app.db.enums import GlobalRole

class LocationService:
    def __init__(self, repo: LocationRepository):
        self.repo = repo

    async def get_users_paginated(self, location_id: int, params: dict):
        # 1. التحقق من وجود الموقع (قاعدة عمل)
        loc = await self.repo.get_by_id(location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود أو غير نشط")

        # 2. بناء الاستعلام عبر الـ Repository
        query = await self.repo.get_users_query(location_id)
        
        # 3. معالجة البحث (البحث الشامل)
        search = params.get("search_query")
        if search:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.employee_number.ilike(f"%{search}%"),
                )
            )

        # 4. تنفيذ الترقيم (باستخدام المحرك الموحد المذكور سابقاً)
        result = await apply_pagination(
            db=self.repo.db,
            base_query=query,
            model_class=User,
            page=params["page"],
            page_size=params["page_size"],
            sort_by=params["sort_by"],
            sort_order=params["sort_order"]
        )
        
        # 5. التنسيق لضمان أن الـ Schema صحيحة (تجنب أي خطأ في الـ Serialization)
        result["items"] = [UserOut.model_validate(u).model_dump() for u in result["items"]]
        return result
    
    async def get_all_locations(self, is_active:Optional[bool]=None, department_id: Optional[int] = None):
        return await self.repo.list_active(is_active,department_id)   
    
    async def create_new_location(self, data: LocationCreate, current_user: User):
        # التحقق من الصلاحيات
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="يلزم صلاحية مدير البرنامج أو مدير النظام"
            )
        # التحقق من التكرار
        if await self.repo.exists_by_normalized_name(data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="موقع العمل هذا موجود بالفعل (تطابق اسمي)"
            )
        
        # تنفيذ عملية الإضافة
        return await self.repo.create(data.model_dump())
    
    async def update_location_service(self, location_id: int, data: LocationUpdate, current_user: User):
        
        # 1. التحقق من الصلاحيات
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(status_code=403, detail="غير مصرح لك")

        # 2. التحقق من التكرار إذا كان الاسم يتم تعديله
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            if await self.repo.exists_by_normalized_name(update_data["name"], exclude_id=location_id):
                raise HTTPException(status_code=400, detail="اسم الموقع موجود مسبقاً (بصيغة مشابهة)")

        # 3. التحديث
        updated_loc = await self.repo.update(location_id, update_data)
        if not updated_loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        return updated_loc
    
    async def delete_location_service(self, location_id: int, current_user: User):
        # 1. التحقق من الصلاحيات
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="يلزم صلاحية مدير البرنامج أو مدير النظام"
            )
        
        # 2. تنفيذ الحذف اللوجيستي
        loc = await self.repo.soft_delete(location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود أو تم حذفه مسبقاً")
            
        return True

    async def get_location_departments(self, location_id: int):
        # 1. التحقق من وجود الموقع
        loc = await self.repo.get_by_id(location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        # 2. جلب الأقسام
        return await self.repo.get_departments_by_location(location_id)