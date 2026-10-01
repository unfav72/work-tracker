from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import date, datetime
import uuid

class SubtaskBase(BaseModel):
    title: str
    is_done: Optional[bool] = False
    position: Optional[int] = 0

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskResponse(SubtaskBase):
    id: str
    work_id: str
    
    model_config = ConfigDict(from_attributes=True)


class WorkBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    priority: Optional[str] = "medium"
    color: Optional[str] = None
    recurrence_type: Optional[str] = "one-time"
    recurrence_config: Optional[Dict[str, Any]] = None
    time_of_day: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    reminder_offset_minutes: Optional[int] = None
    reminder_enabled: Optional[bool] = True

class WorkCreate(WorkBase):
    pass

class WorkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    priority: Optional[str] = None
    color: Optional[str] = None
    recurrence_type: Optional[str] = None
    recurrence_config: Optional[Dict[str, Any]] = None
    time_of_day: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reminder_offset_minutes: Optional[int] = None
    reminder_enabled: Optional[bool] = None
    is_archived: Optional[bool] = None

class WorkResponse(WorkBase):
    id: str
    user_id: str
    is_archived: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
