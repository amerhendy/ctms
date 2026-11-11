"""
منطق إضافي خاص بالمتقدمين لا يدخل ضمن الـ CRUD البسيط، مثل حذف المتقدم
مع كل بياناته المرتبطة (الإجابات والمخالفات) في عملية واحدة متسقة.
"""

from fastapi import Depends,HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from core.security import generate_access_code

from repositories.applicant_repository import ApplicantRepository
from repositories.response_repository import ResponseRepository
from repositories.violation_repository import ViolationRepository

async def get_all_applicants(limit=100,filter=None, db: AsyncSession = Depends(get_db)):
    filters = filter if filter else {}
    applicants = await ApplicantRepository.get_all(db=db, **filters)
    return applicants

async def get_by_national_id(nid:str,db: AsyncSession = Depends(get_db)):
    return await ApplicantRepository.get_by_national_id(national_id=nid,db=db)

async def create_applicant(payload,db: AsyncSession = Depends(get_db)):
    applicant=await get_by_national_id(payload.national_id,db=db)
    if applicant:
        raise HTTPException(status_code=400, detail="الرقم القومي مسجل بالفعل")
    access_code = await create_access_code(db=db)
    
    applicant = await ApplicantRepository.create(payload={
            "national_id": payload.national_id,
            "full_name": payload.full_name,
            "phone": payload.phone,
            "job_model_id": payload.job_model_id,
            "access_code": access_code,
            "status": "pending",
        },db=db)
    return applicant
async def regenerate_access_code(applicant_id: str, db: AsyncSession = Depends(get_db)):
    applicant=await ApplicantRepository.get(applicant_id=applicant_id,db=db)
    if not applicant:
            raise HTTPException(status_code=400, detail="المتقدم غير مسجل")
    access_code = await create_access_code(db=db)

    
    updatedApplicant = await ApplicantRepository.update(
         applicant=applicant,
         payload={"access_code":access_code},
         db=db
         )
    return updatedApplicant


async def update_applicant(applicant_id: str,payload: dict, db: AsyncSession = Depends(get_db)):
    applicant=await ApplicantRepository.get(applicant_id=applicant_id,db=db)
    if not applicant:
            raise HTTPException(status_code=400, detail="المتقدم غير مسجل")
    
    updatedApplicant = await ApplicantRepository.update(
         applicant=applicant,
         payload=payload,
         db=db
         )
    return updatedApplicant


async def create_access_code(db: AsyncSession = Depends(get_db)):
    access_code = None
    for _ in range(10):
            candidate = generate_access_code()
            if not await ApplicantRepository.get_by_code(code=candidate,db=db):
                access_code = candidate
                break
    if not access_code:
        raise HTTPException(status_code=500, detail="تعذر توليد كود دخول فريد، حاول مرة أخرى")
    return access_code


async def delete_applicants( applicant_id: str,db: AsyncSession = Depends(get_db)) -> bool:
        applicant=await ApplicantRepository.get(applicant_id=applicant_id,db=db)
        if not applicant:
                raise HTTPException(status_code=400, detail="المتقدم غير مسجل")

        for r in await ResponseRepository.list_by_user(applicant_id,db):
            await ResponseRepository.delete_reqponse(response=r,db=db)
        for v in await ViolationRepository.list_by_user(applicant_id,db=db):
            await ViolationRepository.delete_violation(v,db)

        ok=await ApplicantRepository.delete(applicant,db=db)
        if ok:
             raise HTTPException(status_code=400, detail="حدث خطأ أثناء الحضف")
        
        return True