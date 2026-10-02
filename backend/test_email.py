import asyncio
import os
import sys
from dotenv import load_dotenv

# Load the .env file explicitly
load_dotenv()

# Set up the python path so it can import from app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.email_service import get_email_service
from app.models.user import User
from app.models.work import Work
from datetime import datetime

async def test():
    print(f"Testing Email Provider: {settings.EMAIL_PROVIDER}")
    print(f"From Address: {settings.EMAIL_FROM}")
    
    # Create dummy data for the test
    dummy_user = User(email="chinnarocky272@gmail.com")
    dummy_work = Work(title="Test Reminder Job")
    
    service = get_email_service()
    print(f"Using Service Class: {service.__class__.__name__}")
    
    try:
        msg_id = await service.send_reminder(dummy_user, dummy_work, datetime.now())
        print(f"✅ SUCCESS! Email sent. Message ID: {msg_id}")
    except Exception as e:
        print(f"❌ ERROR: Failed to send email.")
        print(f"Details: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response Body: {e.response.text}")

if __name__ == "__main__":
    asyncio.run(test())
