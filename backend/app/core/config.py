import logging
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("tuberag.config")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Support loading from .env in backend/ or root folder
        env_file=(".env", "../.env"),
        env_ignore_empty=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "local"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    DATABASE_URL: str = ""
    QSTASH_TOKEN: str = ""
    QSTASH_CURRENT_SIGNING_KEY: str = ""
    QSTASH_NEXT_SIGNING_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ALLOW_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,https://tube-rag.gabcares.xyz"
    )
    BACKEND_URL: str = "http://localhost:8000"
    SENTRY_DSN: str = ""
    YOUTUBE_PROXY: str = ""
    SUPADATA_API_KEY: str = ""

    @property
    def allow_origins_list(self) -> list[str]:
        cleaned = self.ALLOW_ORIGINS.strip("[]\"' ")
        return [x.strip() for x in cleaned.split(",") if x.strip()]

    @field_validator("*", mode="before")
    @classmethod
    def strip_quotes(cls, v):
        if isinstance(v, str):
            return v.strip("\"'")
        return v

    @model_validator(mode="after")
    def validate_configuration(self) -> "Settings":
        # Check Gemini API Key
        key = self.GEMINI_API_KEY
        if key:
            masked = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "***"
            logger.info(f"Loaded GEMINI_API_KEY={masked} (length {len(key)})")
        else:
            logger.warning(
                "GEMINI_API_KEY is not configured. Server RAG will run in mock fallback unless client key is provided."
            )

        # Check Supadata
        if not self.SUPADATA_API_KEY:
            logger.warning(
                "SUPADATA_API_KEY is not configured. Fallback tier will bypass Supadata."
            )

        # Check QStash
        if not self.QSTASH_TOKEN:
            logger.warning(
                "QSTASH_TOKEN is not configured. Ingestion will run in local BackgroundTasks mode."
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
