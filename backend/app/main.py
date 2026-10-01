import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.config import settings
from app.api.v1.api import api_router
from app.tasks.scheduler import process_reminder_jobs

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup: launch the background scheduler ──
    scheduler = AsyncIOScheduler()
    scheduler.add_job(process_reminder_jobs, "cron", minute="*")
    scheduler.start()
    logger.info("Background scheduler started (runs every minute)")
    yield
    # ── Shutdown: clean up ──
    scheduler.shutdown()
    logger.info("Background scheduler stopped")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": "Welcome to Daily toing API"}

