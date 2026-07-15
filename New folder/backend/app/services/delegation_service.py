#app/services/share_service.py
from fastapi import HTTPException,BackgroundTasks
from app.repositories.delegation_repo import DelegationRepository
from app.repositories.user_repository import UserRepository

from app.models import (Delegation)
from app.services.notification_service import NotificationService
from app.db.enums import GlobalRole
class DelegationService:
    @staticmethod
    async def create_delegation(db, data, current_user, background_tasks):
        # 1. جلب المفوض إليه
        delegate = await UserRepository.get_by_id_with_relations(db, data.delegate_id)
        if not delegate:
            raise HTTPException(404, "المستخدم المفوض غير موجود")
        if delegate.id == current_user.id:
            raise HTTPException(400, "لا يمكن تفويض نفسك")

        # Validate permissions
        valid_perms = {"approve", "reject", "assign", "modify"}
        for p in data.permission_types:
            if p not in valid_perms:
                raise HTTPException(400, f"صلاحية غير صحيحة: {p}. الصلاحيات المتاحة: {valid_perms}")
            
        # 2. التحقق من صلاحيات المدير (Business Rules)
        is_admin = current_user.global_role in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER)
        is_dept_manager = getattr(current_user, 'is_department_manager', False)
        
        if not (is_admin or is_dept_manager):
            raise HTTPException(403, "غير مصرح لك بتفويض الصلاحيات")

        # 3. إنشاء كائن التفويض
        delegation = Delegation(
            delegator_id=current_user.id,
            delegate_id=data.delegate_id,
            permission_types=",".join(data.permission_types),
            start_date=data.start_date,
            end_date=data.end_date,
            notes=data.notes,
            is_active=True,
        )
        
        # 4. الحفظ
        await DelegationRepository.create_delegation(db, delegation)
        
        # 5. الإشعارات (في الخلفية)
        perms_ar = {"approve": "قبول", "reject": "رفض", "assign": "تعيين", "modify": "تعديل"}
        perms_array=[]
        for p in data.permission_types:
            perms_array.append(perms_ar.get(p,p))
        perms_text = ", ".join(perms_array)

        background_tasks.add_task(
            NotificationService.create, db, data.delegate_id, "delegation_granted",
            "تم تفويض صلاحيات إليك", f'فوّضك {current_user.full_name} بصلاحيات: {perms_text}'
        )

        await db.commit()
        return {"delegation_id": delegation.id, "message": "تم التفويض بنجاح"}
    
    @staticmethod
    async def get_my_delegations(db, current_user):
        given = await DelegationRepository.get_given_delegations(db, current_user.id)
        received = await DelegationRepository.get_received_delegations(db, current_user.id)
        
        today = date.today()

        def format_delegation(d):
            return {
                "id": d.id,
                "delegator_id": d.delegator_id,
                "delegate_id": d.delegate_id,
                "permissions": d.permission_types, # تأكد من مطابقة اسم الحقل في الموديل
                "start_date": d.start_date.isoformat(),
                "end_date": d.end_date.isoformat() if d.end_date else None,
                "is_active": d.is_active and (not d.end_date or d.end_date >= today),
                "notes": d.notes,
                "other_name": d.delegate.full_name if d.delegator_id == current_user.id else d.delegator.full_name,
            }

        return {
            "delegations_given": [format_delegation(d) for d in given],
            "delegations_received": [format_delegation(d) for d in received],
        }
    
    @staticmethod
    async def revoke_delegation(db, delegation_id, current_user, background_tasks):
        # 1. جلب التفويض
        delegation = await DelegationRepository.get_delegation_by_id(db, delegation_id)
        if not delegation:
            raise HTTPException(404, "التفويض غير موجود")

        # 2. التحقق من الصلاحية (منطق إداري)
        is_owner = delegation.delegator_id == current_user.id
        is_admin = current_user.global_role == GlobalRole.GLOBAL_ADMIN
        if not (is_owner or is_admin):
            raise HTTPException(403, "غير مصرح لك بإلغاء هذا التفويض")

        # 3. تنفيذ إلغاء التفعيل
        await DelegationRepository.deactivate_delegation(db, delegation)

        # 4. الإشعار (في الخلفية)
        background_tasks.add_task(
            NotificationService.create, db, delegation.delegate_id, "delegation_revoked",
            "تم إلغاء التفويض", f'تم إلغاء التفويض الممنوح لك من {current_user.full_name}'
        )

        await db.commit()
        return {"message": "تم إلغاء التفويض بنجاح"}
    
    