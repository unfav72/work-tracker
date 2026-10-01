import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.session import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    timezone = Column(String, default="UTC")
    reminder_email = Column(String, nullable=True)
    digest_enabled = Column(Boolean, default=False)
    digest_time = Column(String, nullable=True) # e.g. "08:00"
    quiet_start = Column(String, nullable=True)
    quiet_end = Column(String, nullable=True)
    theme = Column(String, default="system")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
