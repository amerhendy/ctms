from __future__ import annotations

from typing import List, TYPE_CHECKING

<<<<<<< HEAD
from sqlalchemy import Integer, String, Boolean,ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship,backref
=======
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.Department import Department
    from app.models.User import User

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
<<<<<<< HEAD
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("locations.id"), nullable=True)
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    departments: Mapped[List["Department"]] = relationship("Department", back_populates="location")
    users: Mapped[List["User"]] = relationship("User", back_populates="work_location")
<<<<<<< HEAD
    # العلاقة الأبوية وعلاقته بالأبناء والأب بشكل صريح
    parent = relationship(
        "Location",
        remote_side="Location.id",
        back_populates="children",
        lazy="joined" # أو selectin حسب الحاجة
    )

    children = relationship(
        "Location",
        back_populates="parent",
        lazy="selectin",
        cascade="all, delete-orphan"
    )
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

    def __repr__(self):
        return f"<Location {self.id}: {self.name}>"