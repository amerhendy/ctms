from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ExamLoginRequest(BaseModel):
    access_code: str


class AnswerPayload(BaseModel):
    question_id: str
    answer_data: Optional[Dict[str, Any]] = None


class SaveResponseRequest(BaseModel):
    question_id: str
    answer_data: Optional[Dict[str, Any]] = None


class SaveBatchRequest(BaseModel):
    answers: List[AnswerPayload] = []


class ViolationRequest(BaseModel):
    violation_type: str
    details: Optional[str] = None
