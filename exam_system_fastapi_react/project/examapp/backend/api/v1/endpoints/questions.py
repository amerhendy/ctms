import json
import os
import uuid
from typing import List,Optional, Dict, Any

from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.deps import get_current_user
from db.session import get_db
from schemas.question import QuestionCreate, QuestionOut, QuestionUpdate
from models.question import Question
from services.questions_services import (
    list_questions,
    create_question,
    delete_questions_by_job_model,
    get_question,
    get_questions_by_job_model,
    update_question,
    delete_question,
    delete_questions_by_job_model,
    update_questions_job_model,
)
router = APIRouter(prefix="/questions", tags=["Questions"])

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def _to_out(q) -> QuestionOut:
    return QuestionOut(
        id=q.id,
        job_model_id=q.job_model_id,
        q_type=q.q_type,
        question_text=q.question_text,
        question_data=json.loads(q.question_data),
        image_path=q.image_path,
        points=q.points,
        order_index=q.order_index,
    )
async def save_uploaded_image(file: UploadFile) -> str:
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="صيغة الصورة غير مدعومة")

    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    dest_path = os.path.join(settings.UPLOADS_DIR, unique_name)
    
    # قراءة الملف وحفظه
    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)
    return f"/uploads/{unique_name}"

@router.get("", response_model=List[QuestionOut])
async def list_question(job_model_id: str = None, db: AsyncSession = Depends(get_db),admin=Depends(get_current_user)):
    if job_model_id:
        result= await get_questions_by_job_model(job_model_id=job_model_id, db=db)
    else:
        result= await list_questions(limit=100, filter={"job_model_id": job_model_id} if job_model_id else None, db=db)

    
    return _to_out(result) if isinstance(result, Question) else [_to_out(q) for q in result]

@router.get("/{question_id}", response_model=QuestionOut)
async def get_questions(question_id: str, db: AsyncSession = Depends(get_db),admin=Depends(get_current_user)):
    question = await get_question(question_id=question_id, db=db)
    if not question:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    return _to_out(question)

@router.post("", response_model=QuestionOut)
async def create_questions(
    job_model_id: str = Form(...),
    q_type: str = Form(...),
    question_text: str = Form(...),
    question_data: str = Form("{}"),
    points: float = Form(1.0),
    order_index: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_user)
):
    # 1. حفظ الصورة إن وجدت
    image_path = None
    if image and image.filename:
        image_path = await save_uploaded_image(image)

    # 2. التحقق وبناء البيانات عبر الـ Schema الخاص بك
    payload = QuestionCreate(
        job_model_id=job_model_id,
        q_type=q_type,
        question_text=question_text,
        question_data=question_data,  # الـ validator سيقوم بتحويله تلقائياً لـ Dict
        points=points,
        order_index=order_index,
        image_path=image_path
    )

    # 3. تجهيز البيانات للـ DB
    question_dict = payload.model_dump()
    if question_dict.get("question_data") is not None:
        question_dict["question_data"] = json.dumps(question_dict["question_data"], ensure_ascii=False)

    question = await create_question(question_data=question_dict, db=db)
    return _to_out(question)


@router.put("/{question_id}", response_model=QuestionOut)
async def update_questions(
    question_id: str,
    job_model_id: Optional[str] = Form(None),
    q_type: Optional[str] = Form(None),
    question_text: Optional[str] = Form(None),
    question_data: Optional[str] = Form(None),
    points: Optional[float] = Form(None),
    order_index: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_user)
):
    image_path = None
    if image and image.filename:
        image_path = await save_uploaded_image(image)

    # تجميع المدخلات الممررة فقط
    form_data = {
        "job_model_id": job_model_id,
        "q_type": q_type,
        "question_text": question_text,
        "question_data": question_data,
        "points": points,
        "order_index": order_index,
        "image_path": image_path,
    }
    # استبعاد القيم الفارغة (None)
    filtered_data = {k: v for k, v in form_data.items() if v is not None}

    payload = QuestionUpdate(**filtered_data)

    question_dict = payload.model_dump(exclude_unset=True)
    if question_dict.get("question_data") is not None:
        question_dict["question_data"] = json.dumps(question_dict["question_data"], ensure_ascii=False)

    question = await update_question(question_id=question_id, question_data=question_dict, db=db)
    return _to_out(question)

@router.delete("/{question_id}", response_model=QuestionOut)
async def delete_questions(question_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    question = await delete_question(question_id=question_id, db=db)
    if not question:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    return _to_out(question)

@router.delete("/job-model/{job_model_id}", response_model=List[QuestionOut])
async def delete_questions_by_job_model_endpoint(job_model_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    questions = await delete_questions_by_job_model(job_model_id=job_model_id, db=db)
    return [_to_out(q) for q in questions]

#update_questions_job_model
@router.put("/job-model/{job_model_id}/update-job-model/{new_job_model_id}")
async def update_questions_job_model_endpoint(job_model_id: str, new_job_model_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_user)):
    await update_questions_job_model(job_model_id=job_model_id, new_job_model_id=new_job_model_id, db=db)
    return {"message": "تم تحديث نموذج الوظيفة بنجاح."}

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), admin=Depends(get_current_user)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="صيغة الصورة غير مدعومة")

    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    dest_path = os.path.join(settings.UPLOADS_DIR, unique_name)
    with open(dest_path, "wb") as f:
        f.write(file.file.read())

    return {"path": f"/uploads/{unique_name}"}

