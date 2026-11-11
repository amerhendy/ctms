from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base
from models.mixins import TimestampMixin, UUIDPKMixin


class Admin(Base, UUIDPKMixin, TimestampMixin):
    """حساب مدير لوحة التحكم."""
    __tablename__ = "admins"

    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=True)
