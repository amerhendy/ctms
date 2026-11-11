from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from db.session import get_db
from repositories.job_model_repository import JobModelRepository
from schemas.job_model import JobModelCreate, JobModelOut, JobModelUpdate
from services.job_service import get_all_jobs,create_job,update_job,delete_job,get_job_by_id

router = APIRouter(prefix="/job-models", tags=["Job Models"])


@router.get("", response_model=List[JobModelOut])
async def list_job_models(db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    #service then repository
    return await get_all_jobs(db)


@router.post("", response_model=JobModelOut)
async def create_job_model(payload: JobModelCreate, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    return await create_job(payload=payload.model_dump(), db=db)


@router.put("/{job_model_id}", response_model=JobModelOut)
async def update_job_model(
    job_model_id: str,
    payload: JobModelUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_user),
):
    print(payload)
    result =await update_job(job_model_id=job_model_id, payload=payload.model_dump(exclude_unset=True), db=db)
    if not result:
        raise HTTPException(status_code=404, detail="نموذج الوظيفة غير موجود")
    
    return result


@router.delete("/{job_model_id}")
async def delete_job_model(job_model_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    result = await delete_job(job_model_id=job_model_id, db=db)
    if not result:
        raise HTTPException(status_code=404, detail="نموذج الوظيفة غير موجود")
    return {"success": True}
