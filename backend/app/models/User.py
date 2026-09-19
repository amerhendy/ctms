#app/models/User.py
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from pydantic import BaseModel, field_validator
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship, deferred

from app.db.session import Base
from app.db.enums import GlobalRole
from pydantic import BaseModel
if TYPE_CHECKING:
    from app.models.Location import Location
    from app.models.JobLevel import JobLevel
    from app.models.Department import Department
    from app.models.Task import Task
    from app.models.TaskAssignment import TaskAssignment
    from app.models.Notification import Notification
    from app.models.Favorite import Favorite
    from app.models.Delegation import Delegation
    from app.models.TaskComment import TaskComment
    from app.models.TaskAttachment import TaskAttachment
    from app.models.TaskTimeLog import TaskTimeLog
    from app.models.RecurringTask import RecurringTask
    from app.models.UserContact import UserContact   # سنضيفها بعد تعديل UserContact
    from app.models.DepartmentManager import DepartmentManager
    from app.models.TaskLog import TaskLog
    from app.models.TaskShare import TaskShare
    from app.models.NotificationSettings import NotificationSettings
    from app.models.UserLogs import UserLog


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    work_location_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    job_level_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("job_levels.id"), nullable=True
    )
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("departments.id"), nullable=True
    )
    global_role: Mapped[GlobalRole] = mapped_column(
        SAEnum(GlobalRole), default=GlobalRole.USER, nullable=False
    )
    can_transfer_external: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    work_location: Mapped[Optional["Location"]] = relationship("Location", back_populates="users")
    job_level: Mapped[Optional["JobLevel"]] = relationship("JobLevel", back_populates="users")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="users")
    managed_departments: Mapped[List["DepartmentManager"]] = relationship(
        "DepartmentManager", back_populates="user"
    )
    created_tasks: Mapped[List["Task"]] = relationship(
        "Task", back_populates="creator", foreign_keys="Task.created_by"
    )
    assignments: Mapped[List["TaskAssignment"]] = relationship(
        "TaskAssignment", back_populates="user", foreign_keys="TaskAssignment.user_id"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    favorites: Mapped[List["Favorite"]] = relationship("Favorite", back_populates="user")
    delegations_given: Mapped[List["Delegation"]] = relationship(
        "Delegation", back_populates="delegator", foreign_keys="Delegation.delegator_id"
    )
    delegations_received: Mapped[List["Delegation"]] = relationship(
        "Delegation", back_populates="delegate", foreign_keys="Delegation.delegate_id"
    )
    
    # مضاف حديثاً للربط مع الميزات الجديدة
    comments: Mapped[List["TaskComment"]] = relationship("TaskComment", back_populates="user")
    attachments: Mapped[List["TaskAttachment"]] = relationship("TaskAttachment", back_populates="user")
    created_recurring_tasks: Mapped[List["RecurringTask"]] = relationship("RecurringTask", back_populates="creator")
    task_logs: Mapped[List["TaskLog"]] = relationship("TaskLog", back_populates="user")
    time_logs: Mapped[List["TaskTimeLog"]] = relationship("TaskTimeLog", back_populates="user")
    shared_tasks: Mapped[List["TaskShare"]] = relationship(
        "TaskShare",
        foreign_keys="TaskShare.shared_with_user_id",
        back_populates="shared_with"
    )

    shared_by_me: Mapped[List["TaskShare"]] = relationship(
        "TaskShare",
        foreign_keys="TaskShare.shared_by",
        back_populates="sharer"
    )
    notification_settings: Mapped["NotificationSettings"] = relationship(back_populates="user")
    logs: Mapped[List["UserLog"]] = relationship(back_populates="user")


    # علاقة الـ contacts (One-to-One مع UserContact)
    contacts: Mapped[Optional["UserContact"]] = relationship(
        "UserContact", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    @property
    def managed_department_ids(self) -> List[int]:
        if self.managed_departments:
            return [m.department_id for m in self.managed_departments]
        return []

    def __repr__(self):
        # استخدام dict.get يمنع SQLAlchemy من محاولة الاتصال بقاعدة البيانات إذا كان الكائن detached
        user_id = self.__dict__.get('id', 'Unknown')
        full_name = self.__dict__.get('full_name', 'Unknown')
        return f"<User {user_id}: {full_name}>"

class UserProfileOut(BaseModel):
    id: int
    employee_number: str
    full_name: str
    job_title: str
    email: str
    department_id: Optional[int]
    job_level_id: Optional[int]
    global_role: str
    can_transfer_external: bool
    is_active: bool
    google_id: Optional[str]
    avatar_url: Optional[str]
    managed_department_ids: List[int] = []
    @field_validator("managed_department_ids", mode="before")
    @classmethod
    def extract_ids(cls, v, info):
        # 'info.data' تحتوي على كائن الـ User الأصلي القادم من SQLAlchemy
        # نحاول الوصول للعلاقة 'managed_departments'
        user_model = info.data.get("managed_departments")
        
        # إذا كانت موجودة، نستخرج الـ IDs
        if user_model:
            return [m.department_id for m in user_model]
        
        # إذا كانت v (الافتراضية) موجودة نرجعها، وإلا قائمة فارغة
        return v or []

    class Config:
        from_attributes = True # لتتمكن من قراءة بيانات الـ SQLAlchemy Model مباشرة
    
class GoogleLinkInput(BaseModel):
    id_token_str: str