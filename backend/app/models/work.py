import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True)

class Work(Base):
    __tablename__ = "works"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, default="medium") # low, medium, high
    color = Column(String, nullable=True)
    recurrence_type = Column(String, default="one-time") # one-time, daily, weekly, monthly, custom
    recurrence_config = Column(JSON, nullable=True)
    time_of_day = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    reminder_offset_minutes = Column(Integer, nullable=True)
    reminder_enabled = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    work_id = Column(String, ForeignKey("works.id"), nullable=False)
    title = Column(String, nullable=False)
    is_done = Column(Boolean, default=False)
    position = Column(Integer, default=0)

class WorkLog(Base):
    __tablename__ = "work_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    work_id = Column(String, ForeignKey("works.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String, default="pending") # pending, done, skipped, snoozed
    completed_at = Column(DateTime(timezone=True), nullable=True)
    snoozed_until = Column(DateTime(timezone=True), nullable=True)

class ReminderJob(Base):
    __tablename__ = "reminder_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    work_id = Column(String, ForeignKey("works.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)
    idempotency_key = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="queued") # queued, sent, delivered, bounced, failed
    attempts = Column(Integer, default=0)
    provider_message_id = Column(String, nullable=True)
    error = Column(String, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
