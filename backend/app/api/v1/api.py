from fastapi import APIRouter
from app.api.v1.endpoints import auth, works, logs, stats, webhooks, reminders

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(works.router, prefix="/works", tags=["works"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])


