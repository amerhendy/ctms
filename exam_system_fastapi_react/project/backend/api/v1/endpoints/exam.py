from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.deps import get_current_applicant
from db.session import get_db
from repositories.applicant_repository import ApplicantRepository
from repositories.job_model_repository import JobModelRepository
from repositories.question_repository import QuestionRepository
from repositories.response_repository import ResponseRepository
from repositories.violation_repository import ViolationRepository
from schemas.exam import ExamLoginRequest, SaveBatchRequest, SaveResponseRequest, ViolationRequest
from services.auth_service import AuthService
from services.exam_service import ExamService
from services.sync_service import process_batch, process_single_answer

router = APIRouter(prefix="/exam", tags=["Exam"])


@router.post("/login")
async def exam_login(payload: ExamLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    return await ExamService.login_exam(payload=payload,response=response,db=db)


@router.post("/save-response")
async def save_response(
    payload: SaveResponseRequest,
    db: AsyncSession = Depends(get_db),
    applicant=Depends(get_current_applicant),
):
    return process_single_answer(db, applicant.id, payload.question_id, payload.answer_data)

@router.post("/save-batch")
async def save_batch(
    payload: SaveBatchRequest,
    db: AsyncSession = Depends(get_db),
    applicant=Depends(get_current_applicant),
):
    results = await process_batch(db, applicant.id, payload.answers)
    return {"success": True, "results": results}

@router.post("/finish")
async def finish_exam(response: Response, db: AsyncSession = Depends(get_db), applicant=Depends(get_current_applicant)):
    try:
        result = await ExamService.finalize_exam(applicant.id,db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    response.delete_cookie("applicant_session")
    return {"success": True, "result": result}

from schemas.violation import ViolationSchema
from services.violation import save_violation_to_db
from services.ws_manager import ws_manager
@router.post("/log-violation")
async def log_violation(data: ViolationSchema,  db: AsyncSession = Depends(get_db),applicant=Depends(get_current_applicant)):
    # 1. حفظ المخالفة في قاعدة البيانات
    violation = await save_violation_to_db(db=db,data=data,applicant_id=applicant.id)

    # 2. 🟢 بث التنبيه لحظياً للأدمن المتصلين عبر الـ WebSocket
    alert_payload = {
        "event": "new_violation",
        "data": {
            "user_id": applicant.id,
            "user_name": applicant.full_name,
            "user_code": applicant.access_code,
            "violation_type": data.violation_type,
            "details": data.details,
            "timestamp": violation.occurred_at.strftime("%H:%M:%S")
        }
    }
    await ws_manager.broadcast_to_admins(alert_payload)

    return {"status": "success"}