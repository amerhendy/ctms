from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ApplicantCreate(BaseModel):
    national_id: str
    full_name: str
    phone: Optional[str] = None
    job_model_id: str

class ApplicantUpdate(BaseModel):
    national_id: str
    full_name: str
    phone: Optional[str] = None
    job_model_id: str

class ApplicantCreatedOut(BaseModel):
    id: str
    access_code: str


class ApplicantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    national_id: str
    full_name: str
    phone: Optional[str] = None
    job_model_id: str
    status: str
    access_code: str
    
    # التواريخ أصبحت تشتمل على Timezone من الموديل تلقائياً
    exam_started_at: Optional[datetime] = None
    exam_finished_at: Optional[datetime] = None
    
    # ضبط القيم الافتراضية لمنع الأخطاء في حال كانت أرقام النقاط خالية في البداية
    total_score: Optional[float] = 0.0
    max_score: Optional[float] = 0.0


class ApplicantWithJobOut(ApplicantOut):
    job_model_name: Optional[str] = None
