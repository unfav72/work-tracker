from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List
import uuid

from app.db.session import get_db
from app.models.work import Work, ReminderJob
from app.models.user import User
from app.schemas.work import WorkCreate, WorkUpdate, WorkResponse
from app.api.deps import get_current_user
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

def schedule_reminder_for_work(db: Session, work: Work):
    try:
        # Remove any existing pending jobs
        db.query(ReminderJob).filter(
            ReminderJob.work_id == work.id, 
            ReminderJob.status == "queued"
        ).delete()
        
        if not work.reminder_enabled or not work.time_of_day or not work.start_date or work.is_archived:
            db.commit()
            return
            
        time_parts = work.time_of_day.split(":")
        if len(time_parts) != 2:
            return
            
        hours, minutes = int(time_parts[0]), int(time_parts[1])
        dt_naive = datetime(work.start_date.year, work.start_date.month, work.start_date.day, hours, minutes)
        
        # Convert local time to UTC properly
        dt_local = dt_naive.astimezone()
        dt_utc = dt_local.astimezone(timezone.utc)
        
        offset = work.reminder_offset_minutes or 0
        scheduled_for = dt_utc - timedelta(minutes=offset)
        
        # Only schedule if in the future or up to 5 minutes in the past
        if scheduled_for >= (datetime.now(timezone.utc) - timedelta(minutes=5)):
            job = ReminderJob(
                work_id=work.id,
                user_id=work.user_id,
                scheduled_for=scheduled_for,
                idempotency_key=f"{work.id}-{scheduled_for.isoformat()}"
            )
            db.add(job)
            db.commit()
    except Exception as e:
        logger.error(f"Error scheduling reminder: {e}")


router = APIRouter()

@router.post("/", response_model=WorkResponse)
def create_work(
    work_in: WorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    work = Work(
        **work_in.model_dump(),
        user_id=current_user.id
    )
    db.add(work)
    db.commit()
    db.refresh(work)
    
    schedule_reminder_for_work(db, work)
    
    return work

@router.get("/", response_model=List[WorkResponse])
def read_works(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    works = db.query(Work).filter(Work.user_id == current_user.id, Work.is_archived == False).offset(skip).limit(limit).all()
    return works

@router.get("/{id}", response_model=WorkResponse)
def read_work(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    work = db.query(Work).filter(Work.id == id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work

@router.patch("/{id}", response_model=WorkResponse)
def update_work(
    id: str,
    work_in: WorkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    work = db.query(Work).filter(Work.id == id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    update_data = work_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(work, field, value)
        
    db.add(work)
    db.commit()
    db.refresh(work)
    
    schedule_reminder_for_work(db, work)
    
    return work

@router.post("/{id}/archive", response_model=WorkResponse)
def archive_work(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    work = db.query(Work).filter(Work.id == id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    work.is_archived = True
    db.add(work)
    db.commit()
    db.refresh(work)
    return work
