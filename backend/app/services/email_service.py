import httpx
import smtplib
import logging
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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


# ---------------------------------------------------------------------------
# Brevo (Sendinblue) – HTTP API v3
# Docs: https://developers.brevo.com/reference/sendtransacemail
# ---------------------------------------------------------------------------
class BrevoApiEmailService(EmailService):
    """Send emails via Brevo's transactional email REST API."""

    def __init__(self):
        self.api_key = settings.BREVO_API_KEY
        self.headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.base_url = "https://api.brevo.com/v3/smtp/email"

    def _parse_sender(self) -> dict:
        """Parse 'Name <email>' format into {name, email} dict."""
        from_str = settings.EMAIL_FROM
        if "<" in from_str and ">" in from_str:
            name = from_str.split("<")[0].strip()
            email = from_str.split("<")[1].replace(">", "").strip()
            return {"name": name, "email": email}
        return {"email": from_str}

    async def send_reminder(self, user: User, work: Work, scheduled_for: Any) -> str:
        recipient = user.reminder_email or user.email
        html = f"<p>Reminder: <strong>{work.title}</strong> is due.</p>"
        payload = {
            "sender": self._parse_sender(),
            "to": [{"email": recipient}],
            "subject": f"Reminder: {work.title}",
            "htmlContent": html,
            "replyTo": {"email": settings.EMAIL_REPLY_TO},
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Brevo API email sent – messageId: {data.get('messageId')}")
            return data.get("messageId", "")

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        recipient = user.reminder_email or user.email
        html = "<h3>Your Daily Digest</h3><ul>"
        for w in works:
            html += f"<li>{w.title}</li>"
        html += "</ul>"
        payload = {
            "sender": self._parse_sender(),
            "to": [{"email": recipient}],
            "subject": "Your Daily Works Digest",
            "htmlContent": html,
            "replyTo": {"email": settings.EMAIL_REPLY_TO},
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Brevo API digest sent – messageId: {data.get('messageId')}")
            return data.get("messageId", "")


# ---------------------------------------------------------------------------
# Brevo – SMTP relay (smtp-relay.brevo.com)
# Uses Python's built-in smtplib – no extra dependencies required.
# ---------------------------------------------------------------------------
class BrevoSmtpEmailService(EmailService):
    """Send emails via Brevo's SMTP relay server."""

    def _send_smtp(self, to_email: str, subject: str, html: str) -> str:
        """Synchronous SMTP send (runs quickly for a single email)."""
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Reply-To"] = settings.EMAIL_REPLY_TO
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.BREVO_SMTP_HOST, settings.BREVO_SMTP_PORT) as server:
            server.starttls()
            server.login(settings.BREVO_SMTP_LOGIN, settings.BREVO_SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
            logger.info(f"Brevo SMTP email sent to {to_email}")
        return "smtp-sent"

    async def send_reminder(self, user: User, work: Work, scheduled_for: Any) -> str:
        recipient = user.reminder_email or user.email
        html = f"<p>Reminder: <strong>{work.title}</strong> is due.</p>"
        return self._send_smtp(recipient, f"Reminder: {work.title}", html)

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        recipient = user.reminder_email or user.email
        html = "<h3>Your Daily Digest</h3><ul>"
        for w in works:
            html += f"<li>{w.title}</li>"
        html += "</ul>"
        return self._send_smtp(recipient, "Your Daily Works Digest", html)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
def get_email_service() -> EmailService:
    provider = settings.EMAIL_PROVIDER.lower()
    if provider == "resend":
        return ResendEmailService()
    elif provider == "brevo-api":
        return BrevoApiEmailService()
    elif provider == "brevo-smtp":
        return BrevoSmtpEmailService()
    return ConsoleEmailService()
