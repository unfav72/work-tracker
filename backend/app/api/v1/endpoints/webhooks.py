from fastapi import APIRouter, Request, HTTPException
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/email")
async def resend_webhook(request: Request):
    """
    Webhook endpoint to receive events from Resend (e.g. delivered, bounced)
    """
    try:
        payload = await request.json()
        logger.info(f"Received webhook: {payload}")
        
        # In a real scenario, you'd verify the Resend signature here.
        # Then you'd find the ReminderJob with the matching provider_message_id
        # and update its status.
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
