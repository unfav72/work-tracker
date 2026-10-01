import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Daily toing"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_please_change_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dailyworks.db") # Default to sqlite for local dev
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "console")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "DailyWorks <reminders@yourdomain.com>")
    EMAIL_REPLY_TO: str = os.getenv("EMAIL_REPLY_TO", "support@yourdomain.com")
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "http://localhost:5173")
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra='ignore')

settings = Settings()
