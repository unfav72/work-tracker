import httpx
import logging
from abc import ABC, abstractmethod
from typing import List, Any
from app.core.config import settings
from app.models.user import User
from app.models.work import Work

logger = logging.getLogger(__name__)

class EmailService(ABC):
    @abstractmethod
    async def send_reminder(self, user: User, work: Work, scheduled_for: Any) -> str:
        pass

    @abstractmethod
    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        pass

class ConsoleEmailService(EmailService):
    async def send_reminder(self, user: User, work: Work, scheduled_for: Any) -> str:
        msg = f"[CONSOLE EMAIL] Reminder for {user.email}: Work '{work.title}' scheduled for {scheduled_for}"
        logger.info(msg)
        print(msg)
        return "console-msg-id"

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        titles = ", ".join(w.title for w in works)
        msg = f"[CONSOLE EMAIL] Daily Digest for {user.email}: You have {len(works)} works today. ({titles})"
        logger.info(msg)
        print(msg)
        return "console-msg-id"

class ResendEmailService(EmailService):
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.base_url = "https://api.resend.com/emails"

    async def send_reminder(self, user: User, work: Work, scheduled_for: Any) -> str:
        # Construct email HTML (in a real app, use Jinja2)
        html = f"<p>Reminder: <strong>{work.title}</strong> is due.</p>"
        payload = {
            "from": settings.EMAIL_FROM,
            "to": user.reminder_email or user.email,
            "subject": f"Reminder: {work.title}",
            "html": html,
            "reply_to": settings.EMAIL_REPLY_TO
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json().get("id", "")

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        html = f"<h3>Your Daily Digest</h3><ul>"
        for w in works:
            html += f"<li>{w.title}</li>"
        html += "</ul>"
        
        payload = {
            "from": settings.EMAIL_FROM,
            "to": user.reminder_email or user.email,
            "subject": "Your Daily Works Digest",
            "html": html,
            "reply_to": settings.EMAIL_REPLY_TO
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json().get("id", "")

def get_email_service() -> EmailService:
    if settings.EMAIL_PROVIDER == "resend":
        return ResendEmailService()
    return ConsoleEmailService()
