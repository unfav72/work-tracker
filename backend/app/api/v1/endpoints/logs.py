from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List
from datetime import date, datetime

from app.db.session import get_db
from app.models.work import Work, WorkLog
from app.models.user import User
from app.schemas.log import WorkLogCreate, WorkLogUpdate, WorkLogResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=WorkLogResponse)
def create_or_update_work_log(
    log_in: WorkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Verify the work belongs to the user
    work = db.query(Work).filter(Work.id == log_in.work_id, Work.user_id == current_user.id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
        
    log = db.query(WorkLog).filter(WorkLog.work_id == log_in.work_id, WorkLog.date == log_in.date).first()
    if log:
        log.status = log_in.status
        if log_in.status == "done":
            log.completed_at = datetime.utcnow()
        elif log_in.status == "pending":
            log.completed_at = None
    else:
        log = WorkLog(
            work_id=log_in.work_id,
            date=log_in.date,
            status=log_in.status,
            completed_at=datetime.utcnow() if log_in.status == "done" else None
        )
        db.add(log)
        
    db.commit()
    db.refresh(log)
    return log

@router.get("/today", response_model=List[WorkLogResponse])
def get_today_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    today = date.today()
    # Find logs for today for works owned by the user
    logs = db.query(WorkLog).join(Work).filter(
        Work.user_id == current_user.id,
        WorkLog.date == today
    ).all()
    return logs
