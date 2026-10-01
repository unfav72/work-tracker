import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.tasks.scheduler import process_reminder_jobs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def start_worker():
    logger.info("Starting DailyWorks Worker Scheduler...")
    scheduler = AsyncIOScheduler()
    # Run every minute
    scheduler.add_job(process_reminder_jobs, 'cron', minute='*')
    scheduler.start()
    
    try:
        # Keep the worker running
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == "__main__":
    asyncio.run(start_worker())
