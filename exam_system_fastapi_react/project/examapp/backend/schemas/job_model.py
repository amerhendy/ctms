from typing import Optional

from pydantic import BaseModel, ConfigDict


class JobModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    count_questions: int =0
    target_score: Optional[float] = 100.0


class JobModelCreate(JobModelBase):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    count_questions: int =0
    target_score: Optional[float] = 100.0


class JobModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    count_questions: int =0
    target_score: Optional[float] = 100.0


class JobModelOut(JobModelBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
