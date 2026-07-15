#app/repositories/delegation_rep.py
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import Delegation
class DelegationRepository:
    @staticmethod
    async def create_delegation(db, delegation_data: Delegation):
        db.add(delegation_data)
        await db.flush()
        return delegation_data
    
    @staticmethod
    async def get_given_delegations(db, user_id):
        result = await db.execute(
            select(Delegation)
            .options(selectinload(Delegation.delegate))
            .where(Delegation.delegator_id == user_id)
            .order_by(Delegation.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_received_delegations(db, user_id):
        result = await db.execute(
            select(Delegation)
            .options(selectinload(Delegation.delegator))
            .where(Delegation.delegate_id == user_id, Delegation.is_active == True)
            .order_by(Delegation.created_at.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_delegation_by_id(db, delegation_id):
        result = await db.execute(select(Delegation).where(Delegation.id == delegation_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def deactivate_delegation(db, delegation):
        delegation.is_active = False

    @staticmethod
    async def get_active_delegates_for_users(db, user_ids: list):
        # جلب الأشخاص الذين تم تفويضهم من قبل المديرين المذكورين
        result = await db.execute(
            select(Delegation.delegate_id)
            .where(
                Delegation.delegator_id.in_(user_ids),
                Delegation.is_active == True
            )
        )
        return result.scalars().all()