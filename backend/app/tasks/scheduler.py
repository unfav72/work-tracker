import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.work import ReminderJob, Work
from app.models.user import User
from app.services.email_service import get_email_service
from datetime import datetime, timezone
import asyncio

logger = logging.getLogger(__name__)

async def process_reminder_jobs():
    logger.info("Processing reminder jobs...")
    db: Session = SessionLocal()
    try:
        # Find jobs due now that are still queued
        now = datetime.now(timezone.utc)
        
        # PostgreSQL supports FOR UPDATE SKIP LOCKED
        # SQLite does not, so we handle a simpler query for local dev
        from app.core.config import settings
        if settings.DATABASE_URL.startswith("sqlite"):
            jobs = db.query(ReminderJob).filter(
                ReminderJob.status == "queued",
                ReminderJob.scheduled_for <= now
            ).all()
        else:
            jobs = db.query(ReminderJob).filter(
                ReminderJob.status == "queued",
                ReminderJob.scheduled_for <= now
            ).with_for_update(skip_locked=True).all()

        email_service = get_email_service()
        
        for job in jobs:
            try:
                work = db.query(Work).get(job.work_id)
                user = db.query(User).get(job.user_id)
                if not work or not user:
                    job.status = "failed"
                    job.error = "Work or User not found"
                    continue
                
                # Check if work is archived
                if work.is_archived:
                    job.status = "skipped"
                    continue
                    
                msg_id = await email_service.send_reminder(user, work, job.scheduled_for)
                job.status = "sent"
                job.provider_message_id = msg_id
                job.sent_at = datetime.now(timezone.utc)
            except Exception as e:
                logger.error(f"Error sending reminder {job.id}: {e}")
                job.attempts += 1
                if job.attempts >= 3:
                    job.status = "failed"
                job.error = str(e)
            
            db.commit()
            
    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        db.close()
