import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    QSTASH_TOKEN: str = os.getenv("QSTASH_TOKEN", "")
    QSTASH_CURRENT_SIGNING_KEY: str = os.getenv("QSTASH_CURRENT_SIGNING_KEY", "")
    QSTASH_NEXT_SIGNING_KEY: str = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

settings = Settings()
