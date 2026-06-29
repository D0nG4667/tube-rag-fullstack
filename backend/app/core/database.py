import logging
from collections.abc import Generator

from pydantic import BaseModel
from supabase import Client as SupabaseClient
from supabase import create_client

from app.core.config import settings

logger = logging.getLogger("tuberag.database")

# Single global reusable Supabase client instance
_supabase_client: SupabaseClient | None = None


def get_supabase_client() -> SupabaseClient:
    """
    Returns the singleton Supabase client instance, initializing it if necessary.
    """
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be configured in environment settings"
            )
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client


def get_db() -> Generator[SupabaseClient, None, None]:
    """
    FastAPI dependency that yields the Supabase client.
    """
    try:
        yield get_supabase_client()
    except Exception as e:
        logger.error(f"Database dependency session error: {e}")
        raise


async def verify_db_connection() -> bool:
    """
    Verifies that the Supabase database connection is established and reachable.
    """
    try:
        client = get_supabase_client()
        # Query a simple metadata select or run a basic query to verify connection
        res = client.table("videos").select("count", count="exact").limit(1).execute()
        logger.info(f"Database connection verified. Ingested video count: {res.count}")
        return True
    except Exception as e:
        logger.error(f"CRITICAL: Database connection verification failed: {e}")
        return False


# Pydantic Schemas / Database Models


class VideoDB(BaseModel):
    id: str
    youtube_id: str
    title: str
    status: str


class VideoChunkDB(BaseModel):
    chunk_id: str
    video_id: str
    start_time: float
    end_time: float
    content: str
    chunk_type: str
    image_url: str | None = None
    metadata: dict | None = None
