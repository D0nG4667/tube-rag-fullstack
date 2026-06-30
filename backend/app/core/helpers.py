import logging
import sys

from fastapi import BackgroundTasks, Request
from supabase import Client as SupabaseClient

from app.core.config import Settings

# Standard Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("tuberag")


def resolve_backend_url(request: Request, settings: Settings) -> str:
    """
    Construct base URL dynamically if BACKEND_URL is localhost/loopback or empty.
    """
    backend_url = settings.BACKEND_URL
    if (
        not backend_url
        or "localhost" in backend_url
        or "127.0.0.1" in backend_url
        or "::1" in backend_url
    ):
        forwarded_proto = request.headers.get("x-forwarded-proto", "http")
        forwarded_host = (
            request.headers.get("x-forwarded-host")
            or request.headers.get("host")
            or request.base_url.netloc
        )
        if forwarded_host:
            backend_url = f"{forwarded_proto}://{forwarded_host}"
        else:
            backend_url = str(request.base_url)
    return backend_url.rstrip("/")


def dispatch_ingest_task(
    video_id: str,
    step: str,
    offset: float,
    db: SupabaseClient,
    settings: Settings,
    background_tasks: BackgroundTasks | None,
    backend_url: str,
    gemini_api_key: str | None,
) -> None:
    """
    Routes the ingestion task to QStash in production or Local BackgroundTasks in development.
    """
    if settings.ENVIRONMENT == "local" and "pytest" not in sys.modules:
        if background_tasks:
            from app.api.v1.webhook import process_video_task

            background_tasks.add_task(
                process_video_task,
                video_id=video_id,
                step=step,
                offset=offset,
                db=db,
                settings=settings,
                background_tasks=background_tasks,
                backend_url=backend_url,
                gemini_api_key=gemini_api_key,
            )
    elif settings.QSTASH_TOKEN:
        from qstash import QStash

        q_client = QStash(token=settings.QSTASH_TOKEN)
        q_client.message.publish_json(
            url=f"{backend_url}/api/v1/internal/process-video",
            body={
                "video_id": video_id,
                "step": step,
                "offset": offset,
                "gemini_api_key": gemini_api_key,
            },
        )
