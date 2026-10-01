from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.db.session import get_db
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        timezone=user_in.timezone,
        theme=user_in.theme
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if user_in.timezone is not None:
        current_user.timezone = user_in.timezone
    if user_in.theme is not None:
        current_user.theme = user_in.theme
    if user_in.digest_enabled is not None:
        current_user.digest_enabled = user_in.digest_enabled
    if user_in.digest_time is not None:
        current_user.digest_time = user_in.digest_time
    if user_in.quiet_start is not None:
        current_user.quiet_start = user_in.quiet_start
    if user_in.quiet_end is not None:
        current_user.quiet_end = user_in.quiet_end
    if user_in.reminder_email is not None:
        current_user.reminder_email = user_in.reminder_email
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
