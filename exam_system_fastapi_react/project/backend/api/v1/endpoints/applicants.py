import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.deps import get_current_user
from core.security import generate_access_code
from db.session import get_db
from repositories.applicant_repository import ApplicantRepository
from repositories.job_model_repository import JobModelRepository
from schemas.applicant import ApplicantCreate, ApplicantUpdate, ApplicantCreatedOut, ApplicantWithJobOut
from services.applicant_service import get_all_applicants, create_applicant,update_applicant,regenerate_access_code,delete_applicants
from services.exam_service import ExamService
from services.pdf_service import generate_result_pdf

import logging
router = APIRouter(prefix="/applicants", tags=["Applicants"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("", response_model=List[ApplicantWithJobOut])
async def list_applicants(
    job_model_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_user),
):
    filters = {"job_model_id": job_model_id} if job_model_id else {}
    applicants = await get_all_applicants(limit=100, filter=filters, db=db)
    result = []
    for a in applicants:
        jm = await JobModelRepository.get_by_id(a.job_model_id,db)
        item = ApplicantWithJobOut.model_validate(a)
        item.job_model_name = jm.name if jm else None
        result.append(item)
    return result


@router.post("", response_model=ApplicantCreatedOut)
async def create_applicants(payload: ApplicantCreate, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    applicant= await create_applicant(payload=payload,db=db)
    return ApplicantCreatedOut(id=applicant.id, access_code=applicant.access_code)


@router.put("/{applicant_id}", response_model=ApplicantCreatedOut)
async def update_applicants(
    applicant_id: str,
    payload: ApplicantUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_user),
):
    result =await update_applicant(applicant_id=applicant_id, payload=payload.model_dump(exclude_unset=True), db=db)
    if not result:
        raise HTTPException(status_code=404, detail="بيانات المتقدم خطأ")
    return result


@router.delete("/{applicant_id}")
async def delete_applicant(applicant_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    ok =await delete_applicants(applicant_id,db)
    if not ok:
        raise HTTPException(status_code=404, detail="المتقدم غير موجود")
    return {"success": True}


@router.get("/{applicant_id}/result")
def get_applicant_result(applicant_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    try:
        return ExamService.get_result(applicant_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))



@router.get("/{applicant_id}/pdf")
async def download_pdf(applicant_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    output_path = os.path.join(settings.REPORTS_DIR, f"result_{applicant_id}.pdf")
    try:
        return await generate_result_pdf(db, applicant_id, output_path)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return FileResponse(output_path, media_type="application/pdf", filename=f"exam_result_{applicant_id}.pdf")

@router.get("/{applicant_id}/reset", response_model=ApplicantCreatedOut)    
async def reset_applicant_code(applicant_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    return await regenerate_access_code(applicant_id=applicant_id,db=db)

@router.get("/{applicant_id}/reset-exam")
async def reset_applicant_exam(applicant_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    try:
        await ExamService.reset_exam(applicant_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"success": True}