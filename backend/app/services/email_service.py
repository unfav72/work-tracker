import httpx
import smtplib
import asyncio
import logging
import re
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Any
from app.core.config import settings
from app.models.user import User
from app.models.work import Work

logger = logging.getLogger(__name__)


def _extract_email(from_str: str) -> str:
    """Extract just the email address from 'Name <email>' format."""
    match = re.search(r'<(.+?)>', from_str)
    if match:
        return match.group(1).strip()
    return from_str.strip()


def _build_reminder_html(work_title: str) -> str:
    """Build a styled HTML email for a reminder."""
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px;">⏰</span>
            <h2 style="margin: 8px 0 0; color: #f1f5f9; font-size: 20px;">Reminder</h2>
        </div>
        <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #94a3b8;">It's time for:</p>
            <h3 style="margin: 8px 0 0; color: #818cf8; font-size: 22px;">{work_title}</h3>
        </div>
        <p style="text-align: center; margin-top: 24px; color: #64748b; font-size: 13px;">
            — Daily Toing
        </p>
    </div>
    """


def _build_digest_html(works: List[Any]) -> str:
    """Build a styled HTML email for the daily digest."""
    items = "".join(
        f'<li style="padding: 10px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); color: #e2e8f0;">{w.title}</li>'
        for w in works
    )
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px;">📋</span>
            <h2 style="margin: 8px 0 0; color: #f1f5f9; font-size: 20px;">Your Daily Digest</h2>
        </div>
        <p style="color: #94a3b8; text-align: center;">You have <strong style="color: #818cf8;">{len(works)}</strong> works today:</p>
        <ul style="list-style: none; padding: 0; margin: 16px 0; background: rgba(99, 102, 241, 0.05); border-radius: 12px; padding: 12px 20px;">
            {items}
        </ul>
        <p style="text-align: center; margin-top: 24px; color: #64748b; font-size: 13px;">
            — Daily Toing
        </p>
    </div>
    """


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
        recipient = user.reminder_email or user.email
        html = _build_reminder_html(work.title)
        payload = {
            "from": settings.EMAIL_FROM,
            "to": recipient,
            "subject": f"Reminder: {work.title}",
            "html": html,
            "reply_to": settings.EMAIL_REPLY_TO
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Resend email sent to {recipient} – id: {data.get('id')}")
            return data.get("id", "")

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        recipient = user.reminder_email or user.email
        html = _build_digest_html(works)
        payload = {
            "from": settings.EMAIL_FROM,
            "to": recipient,
            "subject": "Your Daily Works Digest",
            "html": html,
            "reply_to": settings.EMAIL_REPLY_TO
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Resend digest sent to {recipient} – id: {data.get('id')}")
            return data.get("id", "")


# ---------------------------------------------------------------------------
# Brevo (Sendinblue) – HTTP API v3
# Docs: https://developers.brevo.com/reference/sendtransacemail
# ---------------------------------------------------------------------------
class BrevoApiEmailService(EmailService):
    """Send emails via Brevo's transactional email REST API."""

    def __init__(self):
        self.api_key = settings.BREVO_API_KEY
        if not self.api_key:
            raise ValueError("BREVO_API_KEY is not configured. Set it in your .env file.")
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
        html = _build_reminder_html(work.title)
        payload = {
            "sender": self._parse_sender(),
            "to": [{"email": recipient}],
            "subject": f"Reminder: {work.title}",
            "htmlContent": html,
            "replyTo": {"email": settings.EMAIL_REPLY_TO},
        }
        logger.info(f"Sending Brevo API email to {recipient} (sender: {self._parse_sender()})")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            if response.status_code != 201:
                logger.error(f"Brevo API error {response.status_code}: {response.text}")
            response.raise_for_status()
            data = response.json()
            logger.info(f"Brevo API email sent – messageId: {data.get('messageId')}")
            return data.get("messageId", "")

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        recipient = user.reminder_email or user.email
        html = _build_digest_html(works)
        payload = {
            "sender": self._parse_sender(),
            "to": [{"email": recipient}],
            "subject": "Your Daily Works Digest",
            "htmlContent": html,
            "replyTo": {"email": settings.EMAIL_REPLY_TO},
        }
        logger.info(f"Sending Brevo API digest to {recipient}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            if response.status_code != 201:
                logger.error(f"Brevo API error {response.status_code}: {response.text}")
            response.raise_for_status()
            data = response.json()
            logger.info(f"Brevo API digest sent – messageId: {data.get('messageId')}")
            return data.get("messageId", "")


# ---------------------------------------------------------------------------
# Brevo – SMTP relay (smtp-relay.brevo.com)
# Uses Python's built-in smtplib – runs in a thread executor to avoid
# blocking the async event loop.
# ---------------------------------------------------------------------------
class BrevoSmtpEmailService(EmailService):
    """Send emails via Brevo's SMTP relay server."""

    def _send_smtp(self, to_email: str, subject: str, html: str) -> str:
        """Synchronous SMTP send — should be called via run_in_executor."""
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Reply-To"] = settings.EMAIL_REPLY_TO
        msg.attach(MIMEText(html, "html"))

        # sendmail() requires just the email address, not 'Name <email>' format
        sender_email = _extract_email(settings.EMAIL_FROM)

        logger.info(f"Connecting to SMTP {settings.BREVO_SMTP_HOST}:{settings.BREVO_SMTP_PORT}")
        with smtplib.SMTP(settings.BREVO_SMTP_HOST, settings.BREVO_SMTP_PORT, timeout=30) as server:
            server.starttls()
            server.login(settings.BREVO_SMTP_LOGIN, settings.BREVO_SMTP_PASSWORD)
            server.sendmail(sender_email, to_email, msg.as_string())
            logger.info(f"Brevo SMTP email sent to {to_email}")
        return "smtp-sent"

    async def send_reminder(self, user: User, work: Work, scheduled_for: Any) -> str:
        recipient = user.reminder_email or user.email
        html = _build_reminder_html(work.title)
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._send_smtp, recipient, f"Reminder: {work.title}", html
        )

    async def send_daily_digest(self, user: User, works: List[Work]) -> str:
        recipient = user.reminder_email or user.email
        html = _build_digest_html(works)
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._send_smtp, recipient, "Your Daily Works Digest", html
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
def get_email_service() -> EmailService:
    provider = settings.EMAIL_PROVIDER.lower()
    logger.info(f"Creating email service for provider: {provider}")
    if provider == "resend":
        return ResendEmailService()
    elif provider == "brevo-api":
        return BrevoApiEmailService()
    elif provider == "brevo-smtp":
        return BrevoSmtpEmailService()
    logger.warning(f"Unknown or default email provider '{provider}', falling back to ConsoleEmailService")
    return ConsoleEmailService()
