# app/services/location_service.py
from fastapi import HTTPException, status
from sqlalchemy import or_, select
<<<<<<< HEAD
from app.models import User, Department, Location
from app.schemas.users import UserOut, UserSummary
from app.schemas.locations import LocationCreate, LocationOut, LocationUpdate, LocationTreeOut
from app.repositories.location_repository import LocationRepository
from app.schemas.base import PaginatedResponse, apply_pagination
from typing import List, Optional
from app.core.utils import normalize_arabic
from app.db.enums import GlobalRole
from app.core.utils import logger
from app.services.user_service import UserService
from sqlalchemy.ext.asyncio import AsyncSession
class LocationService:
    
    @staticmethod
    async def get_users_paginated(db, current_user, location_id: int, params: dict):
        loc = await LocationRepository.get_by_id(db, location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود أو غير نشط")

        query = await LocationRepository.get_users_query(db, location_id)
        
=======
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
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        search = params.get("search_query")
        if search:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.employee_number.ilike(f"%{search}%"),
                )
            )

<<<<<<< HEAD
        result = await apply_pagination(
            db=db,
=======
        # 4. تنفيذ الترقيم (باستخدام المحرك الموحد المذكور سابقاً)
        result = await apply_pagination(
            db=self.repo.db,
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            base_query=query,
            model_class=User,
            page=params["page"],
            page_size=params["page_size"],
            sort_by=params["sort_by"],
            sort_order=params["sort_order"]
        )
<<<<<<< HEAD
        result["items"] = [UserOut.model_validate(u).model_dump() for u in result["items"]]
        return result
    
    @staticmethod
    async def get_all_locations(db, is_active: Optional[bool] = None):
        return await LocationRepository.list_active(db, is_active)   

    @staticmethod
    async def get_location_tree(db: AsyncSession, is_active: Optional[bool] = None):
        """
        جلب الهيكل الشجري للمواقع بالكامل في الذاكرة لتجنب مشاكل الـ AsyncIO
        """
        locations = await LocationRepository.get_all_active_with_relations(db, is_active=is_active)
        
        # 1. تحويل الكائنات إلى قواميس مستقلة
        nodes = [
            {
                "id": loc.id,
                "name": loc.name,
                "parent_id": getattr(loc, "parent_id", None),
                "is_active": loc.is_active,
                "children": []
            } for loc in locations
        ]

        # 2. بناء الشجرة برمجياً باستخدام node_map
        node_map = {n["id"]: n for n in nodes}
        roots = []
        
        for n in nodes:
            parent_id = n["parent_id"]
            if parent_id is None:
                roots.append(n)
            else:
                parent = node_map.get(parent_id)
                if parent:
                    parent["children"].append(n)
                else:
                    roots.append(n)
                    
        return roots

    @staticmethod
    async def get_location_tree_filtered(db: AsyncSession, location_ids: Optional[List[int]] = None):
        """
        جلب الشجرة مع إمكانية الفلترة المتقدمة لمعرفات المواقع
        """
        full_tree = await LocationService.get_location_tree(db)
        
        if not location_ids:
            return full_tree
            
        node_map = {}
        def build_map(nodes):
            for n in nodes:
                node_map[n["id"]] = n
                build_map(n["children"])
        build_map(full_tree)
        
        loc_set = set(location_ids) if isinstance(location_ids, list) else {location_ids}
        
        def get_nodes_by_locations(nodes, target_locs):
            result = []
            for n in nodes:
                if n.get("id") in target_locs:
                    result.append(n)
                result.extend(get_nodes_by_locations(n["children"], target_locs))
            return result
            
        return get_nodes_by_locations(full_tree, loc_set)
    
    @staticmethod
    async def create_new_location(db, data: LocationCreate, current_user: User):
=======
        
        # 5. التنسيق لضمان أن الـ Schema صحيحة (تجنب أي خطأ في الـ Serialization)
        result["items"] = [UserOut.model_validate(u).model_dump() for u in result["items"]]
        return result
    
    async def get_all_locations(self, is_active:Optional[bool]=None, department_id: Optional[int] = None):
        return await self.repo.list_active(is_active,department_id)   
    
    async def create_new_location(self, data: LocationCreate, current_user: User):
        # التحقق من الصلاحيات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="يلزم صلاحية مدير البرنامج أو مدير النظام"
            )
<<<<<<< HEAD
        
        if await LocationRepository.exists_by_normalized_name(db, data.name):
=======
        # التحقق من التكرار
        if await self.repo.exists_by_normalized_name(data.name):
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="موقع العمل هذا موجود بالفعل (تطابق اسمي)"
            )
        
<<<<<<< HEAD
        # التحقق من وجود الموقع الأب إذا تم تحديده
        if data.parent_id:
            parent_loc = await LocationRepository.get_by_id(db, data.parent_id)
            if not parent_loc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="الموقع الأب المختار غير موجود أو غير نشط"
                )
        
        return await LocationRepository.create(db, data.model_dump())
    
    @staticmethod
    async def update_location_service(db, location_id: int, data: LocationUpdate, current_user: User):
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(status_code=403, detail="غير مصرح لك")

        update_data = data.model_dump(exclude_unset=True)
        
        if "name" in update_data:
            if await LocationRepository.exists_by_normalized_name(db, update_data["name"], exclude_id=location_id):
                raise HTTPException(status_code=400, detail="اسم الموقع موجود مسبقاً (بصيغة مشابهة)")

        # التحقق من صحة وتلافي الدورات الهرمية عند تحديث الـ parent_id
        if "parent_id" in update_data and update_data["parent_id"] is not None:
            new_parent_id = update_data["parent_id"]
            if new_parent_id == location_id:
                raise HTTPException(status_code=400, detail="لا يمكن تعيين الموقع كأب لنفسه")
            
            parent_loc = await LocationRepository.get_by_id(db, new_parent_id)
            if not parent_loc:
                raise HTTPException(status_code=400, detail="الموقع الأب الجديد غير موجود")
                
            # التحقق من عدم حدوث تراجع دائري (Circular Reference)
            if await LocationRepository.is_descendant(db, location_id, new_parent_id):
                raise HTTPException(status_code=400, detail="لا يمكن ربط الموقع بأحد أبنائه أو أحفاده (حلقة هرمية غير مسموحة)")

        updated_loc = await LocationRepository.update(db, location_id, update_data)
=======
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
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        if not updated_loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        return updated_loc
    
<<<<<<< HEAD
    @staticmethod
    async def delete_location_service(db, location_id: int, current_user: User):
=======
    async def delete_location_service(self, location_id: int, current_user: User):
        # 1. التحقق من الصلاحيات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="يلزم صلاحية مدير البرنامج أو مدير النظام"
            )
        
<<<<<<< HEAD
        loc = await LocationRepository.soft_delete(db, location_id)
=======
        # 2. تنفيذ الحذف اللوجيستي
        loc = await self.repo.soft_delete(location_id)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود أو تم حذفه مسبقاً")
            
        return True

<<<<<<< HEAD
    @staticmethod
    async def get_location_departments(db, location_id: int):
        loc = await LocationRepository.get_by_id(db, location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        return await LocationRepository.get_departments_by_location(db, location_id)
=======
    async def get_location_departments(self, location_id: int):
        # 1. التحقق من وجود الموقع
        loc = await self.repo.get_by_id(location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        # 2. جلب الأقسام
        return await self.repo.get_departments_by_location(location_id)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
