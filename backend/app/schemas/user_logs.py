# app/schemas/user_logs.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class UserLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    old_data: Optional[Any] = None
    new_data: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True