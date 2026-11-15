from __future__ import annotations

from typing import List, TYPE_CHECKING

from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.Department import Department
    from app.models.User import User

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    departments: Mapped[List["Department"]] = relationship("Department", back_populates="location")
    users: Mapped[List["User"]] = relationship("User", back_populates="work_location")

    def __repr__(self):
        return f"<Location {self.id}: {self.name}>"