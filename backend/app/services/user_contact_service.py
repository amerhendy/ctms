# app/services/user_contact_service.py
from fastapi import HTTPException, status
from app.models.User import User
from app.repositories.user_contact_repository import UserContactRepository
from app.db.enums import GlobalRole

class UserContactService:

    @staticmethod
    async def get_contact(db, user_id: int, current_user: User):
        contact = await UserContactRepository.get_by_user_id(db,user_id)
        if not contact:
            raise HTTPException(status_code=404, detail="لم يتم العثور على بيانات اتصال")
            
        # منطق الخصوصية
        if contact.is_private and current_user.id != user_id:
            if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
                raise HTTPException(status_code=403, detail="لا تملك صلاحية عرض هذه البيانات")
        return contact

    @staticmethod
    async def upsert_contact(db, user_id: int, data: dict, current_user: User):
        # التحقق من الصلاحيات
        if current_user.id != user_id and current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
            raise HTTPException(status_code=403, detail="لا تملك صلاحية التعديل")
            
        return await UserContactRepository.upsert(db,user_id, data)