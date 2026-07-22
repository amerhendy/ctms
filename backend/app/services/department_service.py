# app/services/department_service.py
from fastapi import HTTPException
from typing import NamedTuple, Set, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.department_repository import DepartmentRepository
from app.schemas.departments import DepartmentCreate ,DepartmentUpdate
from app.repositories.user_repository import UserRepository
from app.schemas.users import UserSummary
from app.db.enums import UserNotificationSettings # يمكنك تعديل الـ Enum ليشمل ACTIONS متنوعة
from app.schemas.departments import DepartmentOut
from app.core.utils import logger
class DepartmentService:
    @staticmethod
    async def list_departments(db: AsyncSession, params: dict):
        # حماية أعمدة الفرز
        allowed_sort_columns = ["id", "name", "created_at"]
        sort_by = params.get("sort_by")
        safe_sort_by = sort_by if sort_by in allowed_sort_columns else "name"

        result = await DepartmentRepository.get_paginated_departments(db,
            page=params["page"],
            page_size=params["page_size"],
            parent_id=params["parent_id"],
            is_active=params["is_active"],
            q=params["q"],
            sort_by=safe_sort_by,
            sort_order=params["sort_order"]
        )

        # تحويل البيانات للـ Schema
        result["items"] = [DepartmentOut.model_validate(d).model_dump() for d in result["items"]]
        return result

    @staticmethod
    async def create_department(db: AsyncSession, data: DepartmentCreate, user_id: int):
       
        # 1. التحقق من التكرار
        if await DepartmentRepository.get_by_name(db,data.name):
            raise HTTPException(400, "يوجد قسم مسجل مسبقاً بنفس هذا الاسم")
        data_dict = data.model_dump()
    
        fields_to_fix = ['parent_department_id', 'location_id', 'job_level_id']
        
        for field in fields_to_fix:
            if data_dict.get(field) == 0:
                data_dict[field] = None
        # 2. إنشاء القسم
        dept = await DepartmentRepository.create(db,data_dict)
        
        await db.commit()
        await db.refresh(dept)
        
        # 4. إعادة تحميل العلاقات للـ Schema
        return await DepartmentRepository.get_by_id(db,dept.id)
    
    @staticmethod
    async def get_departments_kv(db: AsyncSession):
        
        return await DepartmentRepository.get_all_kv(db)
    
    @staticmethod
    async def get_department_tree(db: AsyncSession):
        all_depts = await DepartmentRepository.get_all_active_with_relations(db)
        
        # 1. تحويل الكائنات لقواميس مستقلة
        nodes = [
            {
                "id": d.id,
                "name": d.name,
                "parent_department_id": d.parent_department_id,
                ###################
                "job_level_id":d.job_level_id,
                "location_id":d.location_id,
                "job_level":d.job_level,
                "location":d.location,
                ####################
                "is_active": d.is_active,
                "managers": [
                    {"id": m.user.id, "full_name": m.user.full_name,"avatar_url":m.user.avatar_url} 
                    for m in d.managers
                ],
                "children": []
            } for d in all_depts
        ]

        # 2. بناء الشجرة برمجياً
        node_map = {n["id"]: n for n in nodes}
        roots = []
        for n in nodes:
            parent_id = n["parent_department_id"]
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
    async def get_subtree_by_id(db: AsyncSession, department_id: int):
        # 1. جلب الهيكل كاملاً (يفضل مستقبلاً استخدام Cache هنا)
        full_tree = await DepartmentService.get_department_tree(db)
        
        # 2. بناء map سريع للبحث (كما شرحنا سابقاً)
        node_map = {}
        def build_map(nodes):
            for n in nodes:
                node_map[n["id"]] = n
                build_map(n["children"])
                
        build_map(full_tree)
        
        # 3. إرجاع الفرع المطلوب
        return node_map.get(department_id)

    @staticmethod
    async def get_department_tree_filtered(db: AsyncSession, department_ids: List[int] = None, location_ids: List[int] = None):
        #logger.debug(department_ids)
        full_tree = await DepartmentService.get_department_tree(db)
        
        if not department_ids and not location_ids:
            return full_tree
            
        node_map = {}
        def build_map(nodes):
            for n in nodes:
                node_map[n["id"]] = n
                build_map(n["children"])
        build_map(full_tree)
        
        # تحويل المدخلات إلى مجموعات لسرعة البحث
        if isinstance(department_ids, int):
            dept_set = {department_ids}
        elif department_ids:
            dept_set = set(department_ids)
        else:
            dept_set = set()

        if isinstance(location_ids, int):
            loc_set = {location_ids}
        elif location_ids:
            loc_set = set(location_ids)
        else:
            loc_set = set()

        # فلترة بناءً على القائمة (department_ids)
        if dept_set:
            return [node_map[d_id] for d_id in dept_set if d_id in node_map]
                
        # فلترة بناءً على القائمة (location_ids)
        if loc_set:
            def get_nodes_by_locations(nodes, target_locs):
                result = []
                for n in nodes:
                    if n.get("location_id") in target_locs:
                        result.append(n)
                    result.extend(get_nodes_by_locations(n["children"], target_locs))
                return result
                
            return get_nodes_by_locations(full_tree, loc_set)

        return full_tree
    
    @staticmethod
    async def update_department(db: AsyncSession, dept_id: int, data: DepartmentUpdate, user_id: int):
        
        
        # 1. جلب القسم الحالي
        dept = await DepartmentRepository.get_by_id(db,dept_id, include_relations=True)
        if not dept:
            raise HTTPException(404, "الإدارة غير موجودة")
        
        # 2. تحضير البيانات للمقارنة (Audit Log)
        old_data = {"name": dept.name, "is_active": dept.is_active} # يمكنك إضافة المزيد
        new_data = data.model_dump(exclude_unset=True)
        
        # 3. التحديث
        updated_dept = await DepartmentRepository.update(db,dept, new_data)
        
        
        await db.commit() # commit نهائي للعمليتين (التحديث + اللوج)
        
        return await DepartmentRepository.get_by_id(db,dept_id, include_relations=True)
    
    @staticmethod
    async def get_department(db: AsyncSession, dept_id: int):
        
        dept = await DepartmentRepository.get_by_id(db,dept_id)
        if not dept:
            raise HTTPException(status_code=404, detail="القسم غير موجود")
        return dept
    
    

   
    
    

    

    @staticmethod
    async def get_department_tree_by_id(db: AsyncSession):
        
        all_depts = await DepartmentRepository.get_all_active_with_relations(db)
        
        # 1. تحويل الكائنات لقواميس مستقلة
        nodes = [
            {
                "id": d.id,
                "name": d.name,
                "parent_department_id": d.parent_department_id,
                ###################
                "job_level_id":d.job_level_id,
                "location_id":d.location_id,
                "job_level":d.job_level,
                "location":d.location,
                ####################
                "is_active": d.is_active,
                "managers": [
                                {"user_id": m.user.id, "full_name": m.user.full_name} 
                                    for m in d.managers
                                ],
                "children": []
            } for d in all_depts
        ]

        # 2. بناء الشجرة برمجياً
        node_map = {n["id"]: n for n in nodes}
        roots = []
        for n in nodes:
            parent_id = n["parent_department_id"]
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
    async def get_department_by_id(db: AsyncSession, dept_id: int):
        
        dept = await DepartmentRepository.get_by_id(db,dept_id, include_relations=True)
        if not dept:
            raise HTTPException(status_code=404, detail="الإدارة أو القسم غير موجود")
        return dept

    @staticmethod
    async def get_all_sub_department_ids(start_dept_id: int, db: AsyncSession) -> List[int]:
        query = text("""
            WITH RECURSIVE sub_departments AS (
                SELECT id FROM departments WHERE id = :start_dept_id
                UNION ALL
                SELECT d.id FROM departments d
                JOIN sub_departments sd ON d.parent_department_id = sd.id
            )
            SELECT id FROM sub_departments;
        """)
        result = await db.execute(query, {"start_dept_id": start_dept_id})
        return [row[0] for row in result.fetchall()]
    
    @staticmethod
    async def get_dept_users(db: AsyncSession, dept_id: int, page: int, page_size: int):
        # 1. التحقق من وجود القسم (باستخدام الـ DepartmentRepository)
        
        if not await DepartmentRepository.get_by_id(db,dept_id, include_relations=False):
            raise HTTPException(404, "القسم المحدد غير موجود بالنظام")
            
        # 2. جلب الموظفين
        result = await DepartmentRepository.get_users_by_department(db,dept_id, page, page_size)
    
        # تحويل الـ items داخل الـ result إلى UserSummary
        # نفترض أن result يحتوي على ['items'] و ['total']
        result['items'] = [UserSummary.model_validate(user) for user in result['items']]
        
        return result

    
    
    @staticmethod
    async def toggle_department_status(db: AsyncSession, dept_id: int):
        
        
        # 1. جلب القسم
        dept = await DepartmentRepository.get_by_id(db,dept_id, include_relations=True)
        if not dept:
            raise HTTPException(404, "القسم غير موجود")
            
        # 2. منطق الحماية: إذا كان سيتم التعطيل، تحقق من الموظفين
        if dept.is_active:
            active_users_count = await DepartmentRepository.count_active_users_in_dept(db,dept_id)
            if active_users_count > 0:
                raise HTTPException(400, "لا يمكن تعطيل القسم لوجود موظفين نشطين مرتبطين به حالياً، قم بنقلهم أولاً")
        
        # 3. التبديل
        dept.is_active = not dept.is_active
        await db.commit()
        await db.refresh(dept)
        return dept

    @staticmethod
    async def delete_department(db: AsyncSession, dept_id: int):
        
        
        # 1. جلب القسم
        dept = await DepartmentRepository.get_by_id(db,dept_id, include_relations=False)
        if not dept:
            raise HTTPException(404, "الإدارة غير موجودة")
        
        # 2. تنفيذ الحذف الناعم
        dept.is_active = False
        await db.commit() # الحفظ النهائي
        
        return {"message": "تم تعطيل الإدارة وحفظ الإجراء بنجاح"}
