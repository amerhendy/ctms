from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.repositories.department_manager_repository import DepartmentManagerRepository
from app.repositories.department_repository import DepartmentRepository
from app.helpers.dept_manager_helper import DeptManagerHelper
from app.services.log_service import LogService
from app.services.permission_service import is_manager_of
from app.schemas.department_manager_sch import ManagerOut
class DeptManagerService:

    @staticmethod
    async def assign_manager(db: AsyncSession, department_id: int, user_id: int, current_user: User, is_primary: bool = True):
        # 1. التحقق من الصلاحية
        if not await is_manager_of(db, current_user, department_id):
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية الإدارة على هذا القسم")

        department = await DepartmentRepository.get_by_id(db,dept_id=department_id,include_relations=False)
        if not department:
            raise HTTPException(
                status_code=400, 
                detail=f"القسم ذو المعرف {department_id} غير موجود في النظام."
            )
        # 2. التحقق من التكرار
        existing = await DepartmentManagerRepository.get_by_dept_and_user(db, department_id, user_id)
        if existing:
            raise HTTPException(status_code=400, detail="هذا الموظف معين بالفعل في هذه الإدارة")

        # 3. التحقق من التضارب (الـ Guard)
        # إذا كان سيتم تعيينه كـ Primary، سنتأكد أنه لا يوجد Primary حالي
        await DeptManagerHelper.validate_assignment(db, department_id, is_primary)

        # 4. الإنشاء
        new_manager = await DepartmentManagerRepository.create(db, department_id, user_id, is_primary)

        # 5. تسجيل اللوج
        await LogService.userLog(db, current_user.id, "assign_manager", new_data={
            "department_id": department_id, 
            "user_id": user_id, 
            "is_primary": is_primary
        })
        
        await db.commit()
        return new_manager

    @staticmethod
    async def remove_manager(db: AsyncSession, department_id: int, user_id: int, current_user: User):
        # 1. التحقق من الصلاحية
        if not await is_manager_of(db, current_user, department_id):
            raise HTTPException(status_code=403, detail="لا تملك صلاحية")

        # 2. الحذف المنطقي
        success = await DepartmentManagerRepository.soft_delete(db, department_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="سجل المدير غير موجود")

        # 3. تسجيل اللوج
        await LogService.userLog(db, current_user.id, "remove_manager", new_data={"department_id": department_id, "user_id": user_id})
        
        return {"message": "تمت إزالة المدير بنجاح"}

    @staticmethod
    async def toggle_role(db: AsyncSession, department_id: int, user_id: int, current_user: User):
        """تبديل الدور بين مساعد ورئيسي"""
        # 1. تحقق من الصلاحية
        if not await is_manager_of(db, current_user, department_id):
            raise HTTPException(status_code=403, detail="لا تملك صلاحية")
        
        manager = await DepartmentManagerRepository.get_by_dept_and_user(db, department_id, user_id)
        if not manager:
            raise HTTPException(status_code=404, detail="لم يتم العثور على المدير")

        # إذا كان سيصبح رئيسياً، يجب استبدال الحالي أولاً
        if not manager.is_primary:
            await DeptManagerHelper.validate_replacement_logic(db, department_id, user_id, is_primary=True)
            manager.is_primary = True
        else:
            manager.is_primary = False
            
        await db.commit()
        await LogService.userLog(db, current_user.id, "toggle_manager_role", new_data={"user_id": user_id, "is_primary": manager.is_primary})
        return manager

    @staticmethod
    async def get_my_managed_departments(db: AsyncSession, user_id: int):
        # استخدام الـ Helper لجلب النطاق الإداري بالكامل
        return await DeptManagerHelper.get_managed_scope(db, user_id)
    
    @staticmethod
    async def replace_primary_manager(db: AsyncSession, department_id: int, new_user_id: int, current_user: User):
        # 1. تحقق من الصلاحية
        if not await is_manager_of(db, current_user, department_id):
            raise HTTPException(status_code=403, detail="لا تملك صلاحية")

        # 2. جلب المدير الرئيسي الحالي
        current_primary = await DepartmentManagerRepository.get_primary_manager(db, department_id)
        
        if not current_primary:
            raise HTTPException(status_code=404, detail="لا يوجد مدير رئيسي حالي للاستبدال")

        # 3. خطوة الاستبدال (العملية تبدأ)
        # أ- خفض رتبة الحالي إلى مساعد (أو حذفه حسب رغبتك)
        current_primary.is_primary = False
        
        # ب- ترقية/تعيين المدير الجديد كـ Primary
        # نتأكد أولاً هل هو موجود كمساعد أم نضيفه كجديد
        new_manager = await DepartmentManagerRepository.get_by_dept_and_user(db, department_id, new_user_id)
        
        if new_manager:
            new_manager.is_primary = True
        else:
            new_manager = await DepartmentManagerRepository.create(db, department_id, new_user_id, is_primary=True)

        # 4. تسجيل العملية في Log Service
        await LogService.userLog(db, current_user.id, "replace_primary_manager", new_data={
            "old_manager_id": current_primary.user_id,
            "new_manager_id": new_user_id,
            "department_id": department_id
        })

        await db.commit()
        return {"message": "تم استبدال المدير الرئيسي بنجاح"}
        
    @staticmethod
    async def get_managers_by_dept(db: AsyncSession, department_id: int):
        """
        جلب قائمة مديري قسم معين.
        نستخدم الـ Repository لجلب البيانات.
        """
        # جلب القائمة من الريبو (تأكد أن الريبو تعيد قائمة كاملة)
        managers = await DepartmentManagerRepository.get_by_dept(db, department_id)
        
        # يمكنك هنا عمل تنسيق (Formatting) للبيانات إذا أردت
        # مثلاً تحويلها إلى Dict أو List من الـ Schemas
        return [ManagerOut.model_validate(m) for m in managers]