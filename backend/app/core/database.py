import json
import logging
import re
import urllib.request
from collections.abc import Generator

from pydantic import BaseModel
from supabase import Client as SupabaseClient
from supabase import create_client

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

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


def get_supabase() -> SupabaseClient | None:
    """
    Safely retrieves the singleton Supabase client, returning None if unconfigured.
    """
    try:
        return get_supabase_client()
    except Exception:
        return None


def get_youtube_title(youtube_id: str) -> str:
    """
    Fetches the video title dynamically using YouTube's oEmbed endpoint.
    Falls back to regex HTML parsing, then to a default string.
    """
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={youtube_id}&format=json"
        req = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            title = data.get("title")
            if title:
                return title
    except Exception as e:
        logger.warning(
            f"Failed to fetch YouTube title via oEmbed for {youtube_id}: {e}"
        )

    try:
        url = f"https://www.youtube.com/watch?v={youtube_id}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode("utf-8", errors="ignore")
            match = re.search(r"<title>(.*?)</title>", html)
            if match:
                return match.group(1).replace(" - YouTube", "").strip()
    except Exception as e:
        logger.warning(f"Failed to scrape YouTube title via HTML for {youtube_id}: {e}")

    return f"YouTube Video {youtube_id}"


def seed_rick_astley_chunks(client: SupabaseClient):
    """
    Seeds mock transcript chunks for the Rick Astley demo video
    if none exist, ensuring it always has queryable vector embeddings.
    """
    try:
        vid_res = (
            client.table("videos")
            .select("id")
            .eq("youtube_id", "dQw4w9WgXcQ")
            .execute()
        )
        if not vid_res.data:
            logger.warning(
                "Failed to seed mock chunks for Rick Astley: Video not found in database."
            )
            return
        video_id = vid_res.data[0]["id"]

        check = (
            client.table("video_chunks")
            .select("id")
            .eq("video_id", video_id)
            .limit(1)
            .execute()
        )
        if not check.data:
            logger.info("Autoseeding mock chunks for Rick Astley demo video...")
            mock_chunks = [
                {
                    "video_id": video_id,
                    "content": "We're no strangers to love. You know the rules and so do I. A full commitment's what I'm thinking of. You wouldn't get this from any other guy.",
                    "embedding": [0.01] * 768,
                    "start_time": 0.0,
                    "end_time": 18.0,
                    "chunk_type": "transcript",
                    "metadata": {},
                },
                {
                    "video_id": video_id,
                    "content": "Never gonna give you up, never gonna let you down. Never gonna run around and desert you. Never gonna make you cry, never gonna say goodbye. Never gonna tell a lie and hurt you.",
                    "embedding": [0.02] * 768,
                    "start_time": 18.0,
                    "end_time": 35.0,
                    "chunk_type": "transcript",
                    "metadata": {},
                },
            ]
            for ch in mock_chunks:
                client.table("video_chunks").insert(ch).execute()
            logger.info("Successfully seeded mock chunks for Rick Astley.")
    except Exception as e:
        logger.warning(f"Failed to seed mock chunks for Rick Astley: {e}")


async def verify_db_connection() -> bool:
    """
    Verifies that the Supabase database connection is established and reachable.
    Seeds default catalog videos if they do not exist.
    """
    try:
        client = get_supabase_client()
        res = client.table("videos").select("count", count="exact").limit(1).execute()
        logger.info(f"Database connection verified. Ingested video count: {res.count}")

        # Seed default catalog videos
        default_videos = [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "youtube_id": "-9bo8HlSxwQ",
                "title": "Lecture 0 - CS50's Introduction to Programming with Python",
                "status": "pending",
                "user_id": "00000000-0000-0000-0000-000000000000",
            },
            {
                "id": "00000000-0000-0000-0000-000000000002",
                "youtube_id": "dQw4w9WgXcQ",
                "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
                "status": "completed",
                "user_id": "00000000-0000-0000-0000-000000000000",
            },
        ]
        for vid in default_videos:
            try:
                # Fetch dynamically from YouTube to ensure accuracy
                title = get_youtube_title(vid["youtube_id"])
                if title:
                    vid["title"] = title

                check = (
                    client.table("videos")
                    .select("id")
                    .eq("youtube_id", vid["youtube_id"])
                    .execute()
                )
                if not check.data:
                    client.table("videos").insert(vid).execute()
                    logger.info(f"Seeded default video: {vid['youtube_id']}")
                else:
                    video_id = check.data[0]["id"]
                    client.table("videos").update({"title": vid["title"]}).eq(
                        "id", video_id
                    ).execute()
                    logger.info(
                        f"Ensured correct title for default video: {vid['youtube_id']}"
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to check or seed default video {vid['youtube_id']}: {e}"
                )

        # Seed mock chunks for Rick Astley if they are missing
        seed_rick_astley_chunks(client)

        return True
    except Exception as e:
        logger.error(f"CRITICAL: Database connection verification failed: {e}")
        return False


def close_db_connection():
    """
    Cleans up database connection singletons and resources upon shutdown.
    """
    global _supabase_client
    if _supabase_client is not None:
        logger.info("Cleaning up Supabase database client session singleton.")
        _supabase_client = None


def start_default_videos_ingestion():
    """
    Spawns a daemon thread to process and embed default catalog videos asynchronously
    if their chunks are not already present in the database.
    """

    def run_ingestion():
        try:
            db = get_supabase_client()

            for yt_id in ["-9bo8HlSxwQ", "dQw4w9WgXcQ"]:
                # Fetch video_id from database by youtube_id to avoid UUID mismatch issues
                vid_res = (
                    db.table("videos").select("id").eq("youtube_id", yt_id).execute()
                )
                if not vid_res.data:
                    logger.warning(
                        f"Autoseeding: Default video {yt_id} not found in database."
                    )
                    continue

                video_id = vid_res.data[0]["id"]

                # Check if chunks already exist (minimum of 5 chunks required to be considered complete)
                chunks_res = (
                    db.table("video_chunks")
                    .select("id")
                    .eq("video_id", video_id)
                    .limit(5)
                    .execute()
                )
                if len(chunks_res.data) < 5:
                    logger.info(
                        f"Autoseeding: Chunks not found or incomplete ({len(chunks_res.data)} chunks). Ingesting video {yt_id} ({video_id})..."
                    )
                    # Clear any partial chunks to avoid duplicates
                    db.table("video_chunks").delete().eq("video_id", video_id).execute()

                    db.table("videos").update({"status": "pending"}).eq(
                        "id", video_id
                    ).execute()

                    # Dynamic import to avoid circular dependencies
                    from app.api.v1.webhook import process_video_task

                    process_video_task(
                        video_id=video_id,
                        step="transcribe",
                        offset=0.0,
                        db=db,
                        settings=settings,
                        background_tasks=None,
                        backend_url=settings.BACKEND_URL or "http://localhost:8000",
                        gemini_api_key=settings.GEMINI_API_KEY,
                    )
                    db.table("videos").update({"status": "completed"}).eq(
                        "id", video_id
                    ).execute()
                    logger.info(
                        f"Autoseeding: Video {yt_id} ingestion completed successfully."
                    )
                else:
                    logger.info(
                        f"Autoseeding: Chunks already exist for video {yt_id} ({video_id}). Skipping ingestion."
                    )
                    db.table("videos").update({"status": "completed"}).eq(
                        "id", video_id
                    ).execute()
        except Exception as e:
            logger.error(f"Autoseeding background ingestion error: {e}")

    import threading

    threading.Thread(target=run_ingestion, daemon=True).start()


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
