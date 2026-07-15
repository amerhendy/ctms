# app/services/user_service.py
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from app.repositories.user_repository import UserRepository
from app.models.User import User
from app.core.security import get_password_hash,verify_password
from app.core.permissions import AccessService
from app.schemas.users import UserStatsOut, DepartmentUserCount,UserCheckResponse, UserCreate, UserPasswordChange
from app.schemas.base import PaginatedResponse,apply_pagination
from app.db.enums import GlobalRole,userLogSettings
from app.services.log_service import LogService
from app.repositories.department_manager_repository import DepartmentManagerRepository
from app.core.utils import logger
class UserService:

    @staticmethod
    async def create_user_service(db, data: UserCreate, current_user: User,background_tasks:BackgroundTasks) -> User:
        # 1. التحقق من الصلاحيات
        AccessService.require_pm_or_admin(current_user)
        
        # 2. التحقق من التكرار (فحص شامل للقيم الفريدة)
        conflict_field = await UserRepository.check_conflicts_for_creation(
            db,
            data.email, 
            data.employee_number, 
            getattr(data, 'google_id', None)
        )
        
        if conflict_field:
            raise HTTPException(
                status_code=400, 
                detail=f"{conflict_field} مستخدم مسبقاً من قبل موظف آخر"
            )
        
        # 3. تنظيف القيم (تحويل 0 إلى None للـ Foreign Keys)
        user_dict = data.model_dump(exclude={'password'})
        for field in ['department_id', 'manager_id', 'job_level_id', 'work_location_id']:
            if user_dict.get(field) == 0:
                user_dict[field] = None
        
        # 4. تجهيز الكائن
        new_user = User(**user_dict, password_hash=get_password_hash(data.password))
        
        # 5. الحفظ
        ##
        result=await UserRepository.create(db,new_user)
        user_dict["created_by"]=current_user.id
        user_dict["user_id"]=result.id
        await LogService.userLog(
                            db=db,
                            user_id=current_user.id,
                            action=userLogSettings.CREATED,
                            old_data=None,
                            new_data=user_dict
                            )

        return result
    
    @staticmethod
    async def get_user_profile(db, target_user_id: int, current_user: User):
        # 1. التحقق من الصلاحية: هل هو أدمن؟ أم هو الموظف نفسه؟
        # يمكنك توسيع verify_update_permission لتكون verify_access_permission
        AccessService.verify_update_permission(current_user, target_user_id)
        
        # 2. جلب البيانات
        user = await UserRepository.get_me(db,target_user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
            
        return user

    @staticmethod
    async def update_user_profile(db, user_id: int, update_data: dict, current_user: User) -> User:
        AccessService.verify_update_permission(current_user, user_id)
        
        # 1. التحقق من التضارب في القيم الفريدة
        conflict_field = await UserRepository.check_conflicts(db,
            user_id,
            email=update_data.get("email"),
            employee_number=update_data.get("employee_number"),
            google_id=update_data.get("google_id")
        )
        
        if conflict_field:
            raise HTTPException(
                status_code=400, 
                detail=f"{conflict_field} مستخدم مسبقاً من قبل موظف آخر"
            )
                
        # 2. تشفير كلمة المرور إذا وجدت
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))
            
        # 3. التحديث
        updated_user = await UserRepository.update(db,user_id, update_data)
        update_data['updated_by']=current_user.id
        await LogService.userLog(
                    db=db,
                    user_id=user_id,
                    action=userLogSettings.EDITED,
                    old_data=None,
                    new_data=update_data
                    )
        if not updated_user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
            
        return updated_user

    @staticmethod
    async def toggle_active_status(db, user_id: int, current_user: User) -> User:
        """تغيير حالة التفعيل"""
        AccessService.require_pm_or_admin(current_user)

        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="لا يمكنك تعطيل حسابك الشخصي")
        
        user = await UserRepository.get_by_id_with_relations(db,user_id)
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        user.is_active = not user.is_active
        update_data={}
        update_data['is_active']=user.is_active
        update_data['activation_by']=current_user.id
        await db.commit()
        await db.refresh(user)
        await LogService.userLog(
                    db=db,
                    user_id=user_id,
                    action=userLogSettings.EDITED,
                    old_data=None,
                    new_data=update_data
                    )
        return user


    @staticmethod
    async def get_stats_summary(db, current_user: User) -> UserStatsOut:
        AccessService.require_pm_or_admin(current_user)
        
        stats = await UserRepository.get_stats_counts(db)
        
        distribution = [
            DepartmentUserCount(
                department_id=row[0], 
                department_name=row[1] or "بدون قسم", 
                count=row[2]
            )
            for row in stats["dept_distribution"]
        ]
        
        return UserStatsOut(
            total_users=stats["total"],
            active_users=stats["active"],
            inactive_users=stats["total"] - stats["active"],
            department_distribution=distribution
        )


    @staticmethod
    async def check_user_field_availability(db, email: Optional[str], employee_number: Optional[str]) -> UserCheckResponse:
        if email:
            # هنا نتأكد أننا نمرر "email" كـ string صريح
            exists = await UserRepository.check_field_exists(db,"email", email)
            return UserCheckResponse(exists=exists, field="email")
        
        if employee_number:
            # هنا نتأكد أننا نمرر "employee_number" كـ string صريح
            exists = await UserRepository.check_field_exists(db,"employee_number", employee_number)
            return UserCheckResponse(exists=exists, field="employee_number")
        
        raise HTTPException(status_code=400, detail="يجب تمرير البريد الإلكتروني أو الرقم الوظيفي")
    

    @staticmethod
    async def list_users_service(db, current_user: User, filters: dict, page: int, page_size: int, sort_by: str, sort_order: str, target: str = None):
        # 1. التحقق من الصلاحيات
        is_admin = AccessService.is_pm_or_admin(current_user)
        
        # الحصول على قائمة الأقسام التي يديرها المستخدم (بافتراض أنها قائمة IDs)
        managed_ids = current_user.managed_department_ids or []
        if not is_admin:
            # إذا كان مديراً، نتحقق من الفلتر المرسل
            requested_dept_id = filters.get("department_id")
            if requested_dept_id:
                
                # إذا طلب قسماً محدداً، نتأكد أنه ضمن الأقسام التي يديرها
                # ملاحظة: إذا كان الـ API يقبل قائمة، نتحقق من أن جميع العناصر موجودة
                if isinstance(requested_dept_id, list):
                    # تصفية الطلبات لتشمل فقط المسموح له بها
                    allowed_ids = [d_id for d_id in requested_dept_id if d_id in managed_ids]
                    filters["department_id"] = allowed_ids if allowed_ids else managed_ids
                else:
                    # إذا طلب رقماً واحداً، نتأكد من صلاحيته، وإلا نلغي الفلتر أو نستخدم أقسامه فقط
                    if requested_dept_id not in managed_ids:
                        filters["department_id"] = managed_ids # إجبار الفلتر على أقسامه فقط
            else:
                # إذا لم يرسل فلتر، نقصر النطاق تلقائياً على الأقسام التي يديرها
                filters["department_id"] = managed_ids

            # تطبيق قيود المدير
            filters["is_active"] = True
            # ملاحظة: هل تريد أيضاً قصر الموظفين على من هم تحت إدارته فقط؟ 
            # إذا نعم، استمر في استخدام filters["manager_id"] = current_user.id

        # 2. بناء الاستعلام
        if target == 'menu':
            query = "" # أو منطق خاص بالقائمة
        else:
            logger.debug(filters)
            query = UserRepository.get_users_filtered_query(db, filters)

        # 3. استدعاء الترقيم
        return await apply_pagination(
            db=db, base_query=query, model_class=User,
            page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order
        )

    @staticmethod
    async def change_user_password(db, target_user_id: int, data: UserPasswordChange, current_user: User):
        # 1. التحقق من الصلاحيات
        if current_user.id != target_user_id and current_user.global_role != GlobalRole.GLOBAL_ADMIN:
            raise HTTPException(status_code=403, detail="غير مصرح لك بتغيير كلمة المرور لهذا الحساب")

        # 2. جلب المستخدم
        user = await UserRepository.get_by_id_with_relations(db,target_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")

        # 3. التحقق من كلمة المرور القديمة (فقط إذا لم يكن أدمن يغير كلمة مرور موظف)
        if current_user.id == target_user_id:
            if not verify_password(data.old_password, user.password_hash):
                raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")

        # 4. تحديث كلمة المرور
        new_hash = get_password_hash(data.new_password)
        await UserRepository.update_password(db,target_user_id, new_hash)
        update_data={}
        update_data['changed_by']=current_user.id
        await LogService.userLog(
                    db=db,
                    user_id=target_user_id,
                    action=userLogSettings.PWDCHANGE,
                    old_data=None,
                    new_data=update_data
                    )
        return {"message": "تم تغيير كلمة المرور بنجاح"}
    

    
    @staticmethod
    async def get_subordinates_service(db, manager_id: int, params: dict):
        #get user
        user=await UserRepository.get_by_id_with_relations(db,manager_id)
        #get deps
        deps=await DepartmentManagerRepository.get_subordinate_department_ids(db,user)
        # 1. جلب الاستعلام
        query = await UserRepository.get_subordinates_query(db,deps)
        
        # 2. استدعاء المحرك الموحد (استخدام params لتقليل عدد المدخلات)
        result = await apply_pagination(
            db=db,
            base_query=query,
            model_class=User,
            **params
        )
        logger.debug(result["items"])
        
        # 3. تنسيق البيانات
        result["items"] = [
            {
                "id": u.get('id'),
                "full_name": u.get('full_name'),
                "job_title": u.get('job_title'),
                "department_id": u.get('department_id'),
                "avatar_url": getattr(u, 'avatar_url', None),
            } for u in result["items"]
        ]
        
        return result
    
    @classmethod
    async def update_notification_settings(cls, db: AsyncSession, user_id: int, new_settings: dict):
        # 1. جلب الإعدادات القديمة
        # 2. تحديثها بالقيم الجديدة
        # 3. إنشاء سجل في UserLog
        log = UserLog(
            user_id=user_id,
            action="update_notification_settings",
            old_data=old_settings_dict,
            new_data=new_settings
        )
        db.add(log)
        await db.commit()

    