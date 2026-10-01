from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List
import uuid

from app.db.session import get_db
from app.models.work import Work
from app.models.user import User
from app.schemas.work import WorkCreate, WorkUpdate, WorkResponse
from app.api.deps import get_current_user

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
