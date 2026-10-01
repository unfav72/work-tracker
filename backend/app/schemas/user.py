from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    timezone: Optional[str] = "UTC"
    theme: Optional[str] = "system"
    digest_enabled: Optional[bool] = False
    digest_time: Optional[str] = None
    quiet_start: Optional[str] = None
    quiet_end: Optional[str] = None
    reminder_email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    timezone: Optional[str] = None
    theme: Optional[str] = None
    digest_enabled: Optional[bool] = None
    digest_time: Optional[str] = None
    quiet_start: Optional[str] = None
    quiet_end: Optional[str] = None
    reminder_email: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
