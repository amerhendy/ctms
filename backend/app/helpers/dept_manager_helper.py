#app/helpers/dept_manager_helper.py
from fastapi import HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.models import User, DepartmentManager
from app.repositories.department_repository import DepartmentRepository
from app.repositories.department_manager_repository import DepartmentManagerRepository

class DeptManagerHelper:
    
    @staticmethod
    async def get_managed_scope(db: AsyncSession, user: User) -> List[int]:
        """
        تحديد نطاق الإدارة للمستخدم (الإدارات المباشرة + كل التابعة لها).
        يُستخدم لفلترة الاستعلامات في الـ Tasks والـ Reports.
        """
        # 1. جلب الإدارات المباشرة التي يديرها
        managed_records = await DepartmentManagerRepository.get_all_by_user(db, user.id)
        direct_dept_ids = [m.department_id for m in managed_records]
        
        # 2. توسيع النطاق لكل الأفرع التابعة (باستخدام CTE الموجود في DeptRepo)
        all_scope = set(direct_dept_ids)
        for dept_id in direct_dept_ids:
            sub_tree = await DepartmentRepository.get_sub_department_ids(db, dept_id)
            all_scope.update(sub_tree)
            
        return list(all_scope)

    @staticmethod
    async def validate_replacement_logic(db: AsyncSession, dept_id: int, new_user_id: int, is_primary: bool):
        """
        تطبيق قاعدة 'المدير الرئيسي الواحد' ومنطق الاستبدال.
        """
        if is_primary:
            # ابحث عن الرئيسي الحالي
            current_primary = await DepartmentManagerRepository.get_primary_manager(db, dept_id)
            if current_primary and current_primary.user_id != new_user_id:
                # منطق الاستبدال: تحويل الحالي لمساعد (Auto-demotion)
                current_primary.is_primary = False
                await db.flush() 

    @staticmethod
    async def validate_assignment(db: AsyncSession, department_id: int, is_primary: bool):
        """
        تتحقق من إمكانية التعيين.
        """
        if is_primary:
            current_primary = await DepartmentManagerRepository.get_primary_manager(db, department_id)
            if current_primary:
                # هنا نرجع خطأ واضح للمستخدم (أو للـ Frontend)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": "يوجد مدير رئيسي حالياً لهذا القسم",
                        "current_primary_id": current_primary.user_id,
                        "current_primary_name": current_primary.user.full_name,
                        "action_required": "يجب عليك أولاً إزالة المدير الحالي أو تحويله لمساعد قبل تعيين مدير رئيسي جديد."
                    }
                )
            
    @staticmethod
    def check_conflict(current_dept_id: int, target_dept_id: int, sub_tree_ids: List[int]) -> bool:
        """
        التحقق من التعارض (Conflict Checking):
        منع تعيين شخص مديراً في إدارة هو بالفعل تابع لها (أو العكس بشكل غير منطقي).
        """
        # مثال: إذا كان target_dept_id هو أحد أبناء current_dept_id
        return target_dept_id in sub_tree_ids

    @staticmethod
    async def log_manager_action(db: AsyncSession, action: str, user_id: int, data: dict):
        """
        ربط منطق الـ Audit Log الذي لديك بالـ DeptManager.
        """
        from app.services.log_service import LogService
        await LogService.userLog(db, user_id, action, new_data=data)