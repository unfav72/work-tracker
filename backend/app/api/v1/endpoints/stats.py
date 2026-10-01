from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Any, Dict
from datetime import date, timedelta

from app.db.session import get_db
from app.models.work import Work, WorkLog
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/summary", response_model=Dict[str, Any])
def get_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Basic summary: total works, completed today, completion rate
    total_works = db.query(Work).filter(Work.user_id == current_user.id, Work.is_archived == False).count()
    
    today = date.today()
    completed_today = db.query(WorkLog).join(Work).filter(
        Work.user_id == current_user.id,
        WorkLog.date == today,
        WorkLog.status == "done"
    ).count()
    
    return {
        "total_active_works": total_works,
        "completed_today": completed_today
    }
