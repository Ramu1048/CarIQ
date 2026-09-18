"""
CarIQ Backend — Application Configuration
Uses pydantic-settings to load from environment variables / .env file
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "CarIQ Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://cariq_user:cariq_password@localhost:5432/cariq_db"
    SYNC_DATABASE_URL: str = "postgresql://cariq_user:cariq_password@localhost:5432/cariq_db"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    REDIS_ENABLED: bool = True

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-secret-in-production-32-chars-min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── AI ────────────────────────────────────────────────────────────────────
    AI_PROVIDER: str = "mock"          # gemini | openai | mock
    AI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = None

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # ── Payment ───────────────────────────────────────────────────────────────
    PAYMENT_PROVIDER: str = "mock"     # mock | razorpay | stripe
    PAYMENT_KEY: Optional[str] = None
    PAYMENT_SECRET: Optional[str] = None

    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None

    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # ── Email ─────────────────────────────────────────────────────────────────
    EMAIL_PROVIDER: str = "mock"       # mock | sendgrid | smtp
    EMAIL_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@cariq.in"
    EMAIL_FROM_NAME: str = "CarIQ"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # ── Caching ───────────────────────────────────────────────────────────────
    CACHE_TTL_SECONDS: int = 300
    VEHICLE_CACHE_TTL: int = 600

    # ── Logging ───────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def resolve_ai_settings(self) -> "Settings":
        """Auto-resolve AI provider if specific keys are set."""
        if self.AI_PROVIDER == "mock":
            if self.GEMINI_API_KEY:
                self.AI_PROVIDER = "gemini"
                self.AI_API_KEY = self.GEMINI_API_KEY
                self.AI_MODEL = self.GEMINI_MODEL
            elif self.OPENAI_API_KEY:
                self.AI_PROVIDER = "openai"
                self.AI_API_KEY = self.OPENAI_API_KEY
                self.AI_MODEL = self.OPENAI_MODEL
        return self

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
