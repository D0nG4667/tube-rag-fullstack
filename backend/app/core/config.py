from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    BACKEND_URL: str = "http://localhost:8000"
    SENTRY_DSN: str = ""
    YOUTUBE_PROXY: str = ""
    SUPADATA_API_KEY: str = ""

    @field_validator("*", mode="before")
    @classmethod
    def strip_quotes(cls, v):
        if isinstance(v, str):
            return v.strip("\"'")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
