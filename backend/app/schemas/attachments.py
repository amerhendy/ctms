from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.users import UserSummary

# ─── نماذج المخرجات (Response Schemas) ───

class AttachmentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    file_name: str = Field(..., description="اسم الملف الأصلي (مثال: report.pdf)")
    file_path: str = Field(..., description="رابط أو مسار تخزين الملف بالسيرفر")
    file_size: Optional[int] = Field(None, description="حجم الملف بالبايت")
    mime_type: Optional[str] = Field(None, description="نوع الملف (مثال: application/pdf)")
    created_at: datetime
    
    # الموظف الذي قام برفع المرفق
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True