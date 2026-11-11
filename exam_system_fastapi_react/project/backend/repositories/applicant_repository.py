from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models.applicant import Applicant
from repositories.base_repository import BaseRepository


class ApplicantRepository:
    @staticmethod
    async def get(applicant_id: str, db: AsyncSession) -> Applicant | None:
        stmt=select(Applicant).where(Applicant.id == applicant_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    @staticmethod
    async def list(db: AsyncSession) -> list[Applicant]:
        stmt=select(Applicant)
        result = await db.execute(stmt)
        return result.scalars().all()
    @staticmethod
    async def create(payload: dict, db: AsyncSession) -> Applicant:
        applicant = Applicant(**payload)
        db.add(applicant)
        await db.commit()
        await db.refresh(applicant)
        return applicant
    @staticmethod
    async def update(applicant: Applicant, payload: dict, db: AsyncSession) -> Applicant:
        for key, value in payload.items():
            setattr(applicant, key, value)
        await db.commit()
        await db.refresh(applicant)
        return applicant
    @staticmethod
    async def delete(applicant: Applicant, db: AsyncSession) -> None:
        await db.delete(applicant)
        await db.commit()
    @staticmethod
    async def list_applicants_by_job_model(job_model_id: str, db: AsyncSession) -> list[Applicant]:
        stmt=select(Applicant).where(Applicant.job_model_id == job_model_id)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_phone(phone: str, db: AsyncSession) -> Applicant | None:
        stmt=select(Applicant).where(Applicant.phone == phone)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    @staticmethod
    async def get_by_code(code: str, db: AsyncSession) -> Applicant | None:
        stmt=select(Applicant).where(Applicant.access_code == code)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    @staticmethod
    async def get_by_national_id(national_id: str, db: AsyncSession) -> Applicant | None:
        stmt=select(Applicant).where(Applicant.national_id == national_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_identifier(identifier: str, db: AsyncSession) -> Applicant | None:
        stmt = select(Applicant).where(
            or_(
                Applicant.phone == identifier,
                Applicant.national_id == identifier,
                Applicant.access_code == identifier
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_all(limit: int = 100, db: AsyncSession = None, **filters) -> list[Applicant]:
        query = select(Applicant)
        for attr, value in filters.items():
            query = query.where(getattr(Applicant, attr) == value)
        query = query.limit(limit)
        result = await db.execute(query)
        return result.scalars().all()