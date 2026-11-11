import json
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, field_validator


class QuestionCreate(BaseModel):
    job_model_id: str
    q_type: str
    question_text: str
    question_data: Dict[str, Any]
    points: float = 1.0
    order_index: int = 0
    image_path: Optional[str] = None

    @field_validator('question_data', mode='before')
    @classmethod
    def parse_question_data(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError('Invalid JSON string for question_data')
        return v


class QuestionUpdate(BaseModel):
    job_model_id: Optional[str] = None
    q_type: Optional[str] = None
    question_text: Optional[str] = None
    question_data: Optional[Dict[str, Any]] = None
    points: Optional[float] = None
    order_index: Optional[int] = None
    image_path: Optional[str] = None

    # تم إضافة الـ Validator لـ QuestionUpdate أيضاً
    @field_validator('question_data', mode='before')
    @classmethod
    def parse_question_data(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                raise ValueError('Invalid JSON string for question_data')
        return v


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_model_id: str
    q_type: str
    question_text: str
    question_data: Dict[str, Any]
    image_path: Optional[str] = None
    points: float
    order_index: int

    # لتحويل النص المخزن بـ SQLAlchemy إلى Dict عند إرجاع البيانات للعميل
    @field_validator('question_data', mode='before')
    @classmethod
    def parse_question_data_out(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v