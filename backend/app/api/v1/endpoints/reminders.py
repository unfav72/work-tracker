from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.email_service import get_email_service
from typing import Any

router = APIRouter()

@router.post("/test")
async def send_test_email(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    email_service = get_email_service()
    # Mocking a work for the test
    class MockWork:
        title = "Test Work for Email"
        
    await email_service.send_reminder(current_user, MockWork(), "Now")
    return {"message": "Test email sent"}
