import os
import sys
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.work import Work
from app.api.v1.endpoints.works import schedule_reminder_for_work

db = SessionLocal()
try:
    work = db.query(Work).first()
    if work:
        print(f"Testing on work: {work.title}")
        # Change date to future for testing
        work.start_date = datetime.now().date()
        work.time_of_day = "23:59" # Definitely in the future today
        db.commit()
        
        schedule_reminder_for_work(db, work)
        print("Function completed without throwing uncaught exceptions.")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
