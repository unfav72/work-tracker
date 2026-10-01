from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class WorkLogBase(BaseModel):
    date: date
    status: str

class WorkLogCreate(WorkLogBase):
    work_id: str

class WorkLogUpdate(BaseModel):
    status: Optional[str] = None
    snoozed_until: Optional[datetime] = None

class WorkLogResponse(WorkLogBase):
    id: str
    work_id: str
    completed_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
