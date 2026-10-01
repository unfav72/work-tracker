from app.db.session import Base

# Import all models here so Alembic can find them
from app.models.user import User
from app.models.work import Category, Work, Subtask, WorkLog, ReminderJob
