from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.email_service import get_email_service
from app.core.config import settings
from typing import Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/test")
async def send_test_email(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Send a test email to the current user to verify email configuration."""
    email_service = get_email_service()

    # Mocking a work object for the test
    class MockWork:
        title = "Test Reminder from Daily Toing"

    recipient = current_user.reminder_email or current_user.email
    provider = settings.EMAIL_PROVIDER

    try:
        msg_id = await email_service.send_reminder(current_user, MockWork(), "Now")
        logger.info(f"Test email sent to {recipient} via {provider}, msg_id={msg_id}")
        return {
            "message": f"Test email sent successfully to {recipient}",
            "provider": provider,
            "message_id": msg_id,
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Test email failed for {recipient} via {provider}: {error_msg}")

        # Provide helpful error messages based on common issues
        detail = f"Email delivery failed: {error_msg}"
        if "401" in error_msg or "403" in error_msg:
            detail = f"Authentication failed with {provider}. Check your API key in the .env file."
        elif "sender" in error_msg.lower() or "from" in error_msg.lower():
            detail = f"Sender address not verified. Go to your {provider} dashboard and verify the sender email."
        elif "timeout" in error_msg.lower() or "connect" in error_msg.lower():
            detail = f"Could not connect to {provider}. Check your network and SMTP settings."

        raise HTTPException(status_code=500, detail=detail)


@router.get("/config")
async def get_email_config(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return the current email configuration (safe, no secrets)."""
    return {
        "provider": settings.EMAIL_PROVIDER,
        "from": settings.EMAIL_FROM,
        "reply_to": settings.EMAIL_REPLY_TO,
        "recipient": current_user.reminder_email or current_user.email,
        "is_configured": settings.EMAIL_PROVIDER.lower() != "console",
    }
