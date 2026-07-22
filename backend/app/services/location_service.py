# app/services/location_service.py
from fastapi import HTTPException, status
from sqlalchemy import or_, select
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
        
        search = params.get("search_query")
        if search:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.employee_number.ilike(f"%{search}%"),
                )
            )

        result = await apply_pagination(
            db=db,
            base_query=query,
            model_class=User,
            page=params["page"],
            page_size=params["page_size"],
            sort_by=params["sort_by"],
            sort_order=params["sort_order"]
        )
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
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="يلزم صلاحية مدير البرنامج أو مدير النظام"
            )
        
        if await LocationRepository.exists_by_normalized_name(db, data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="موقع العمل هذا موجود بالفعل (تطابق اسمي)"
            )
        
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
        if not updated_loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        return updated_loc
    
    @staticmethod
    async def delete_location_service(db, location_id: int, current_user: User):
        if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="يلزم صلاحية مدير البرنامج أو مدير النظام"
            )
        
        loc = await LocationRepository.soft_delete(db, location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود أو تم حذفه مسبقاً")
            
        return True

    @staticmethod
    async def get_location_departments(db, location_id: int):
        loc = await LocationRepository.get_by_id(db, location_id)
        if not loc:
            raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
            
        return await LocationRepository.get_departments_by_location(db, location_id)