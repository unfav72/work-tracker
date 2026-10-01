import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Daily toing"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_please_change_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dailyworks.db") # Default to sqlite for local dev
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "console")  # console | resend | brevo-api | brevo-smtp
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "DailyWorks <reminders@yourdomain.com>")
    EMAIL_REPLY_TO: str = os.getenv("EMAIL_REPLY_TO", "support@yourdomain.com")
    # Brevo (Sendinblue) settings
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_SMTP_HOST: str = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
    BREVO_SMTP_PORT: int = int(os.getenv("BREVO_SMTP_PORT", "587"))
    BREVO_SMTP_LOGIN: str = os.getenv("BREVO_SMTP_LOGIN", "")
    BREVO_SMTP_PASSWORD: str = os.getenv("BREVO_SMTP_PASSWORD", "")
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "http://localhost:5173")
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra='ignore')

settings = Settings()
