from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# استيراد الجلسة والتحقق من الهوية والأمان من ملفات مشروعك
from app.db.session import get_db
from app.core.security import get_current_user 

# استيراد الموديلات والسكايمات الخاصة بالمشروع
from app.db.enums import GlobalRole
from app.models import User, UserContact
from app.schemas.user_contacts import UserContactOut, UserContactUpdate
from app.services.user_contact_service import UserContactService
from app.repositories.user_contact_repository import UserContactRepository
# تعريف الـ Router الخاص ببيانات الاتصال بشكل مستقل

router = APIRouter(prefix="/users", tags=["User Contacts - بيانات اتصال المستخدم"])

# ───────────────────────────────────────────────────────────
# 1. Endpoint: جلب بيانات الاتصال بناءً على الـ ID صراحة
# ───────────────────────────────────────────────────────────
@router.get("/{user_id}/contacts", response_model=UserContactOut)
async def get_user_contacts(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    جلب بيانات الاتصال لموظف معين بواسطة الـ ID الخاص به بشكل صريح.
    يتم تطبيق حماية الخصوصية بناءً على حقل is_private وصلاحيات المستخدم الحالي.
    """
    return await UserContactService.get_contact(db,user_id, current_user)


# ───────────────────────────────────────────────────────────
# 2. Endpoint: إضافة أو تعديل بيانات الاتصال (Upsert Logic)
# ───────────────────────────────────────────────────────────
@router.put("/{user_id}/contacts", response_model=UserContactOut)
async def upsert_user_contacts(
    user_id: int,
    contact_in: UserContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    تحديث بيانات الاتصال إذا كانت موجودة مسبقاً، أو إنشاؤها تلقائياً إذا لم تكن موجودة (Upsert).
    """
    # حماية المسار: التعديل والإضافة متاحان فقط لصاحب الحساب نفسه أو الإدارة العليا
    return await UserContactService.upsert_contact(db,user_id, contact_in.model_dump(exclude_unset=True), current_user)