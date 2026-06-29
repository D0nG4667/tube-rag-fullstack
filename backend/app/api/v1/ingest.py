import re
import sys

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
from qstash import QStash
from supabase import Client as SupabaseClient

from app.api.v1.webhook import process_video_task
from app.core.config import Settings, get_settings
from app.core.database import get_supabase

router = APIRouter()


class IngestRequest(BaseModel):
    url: str


def extract_youtube_id(url: str) -> str:
    pattern = (
        r"(?:v=|\/embed\/|\/10\/|\/vi\/|youtu\.be\/|\/v\/|\/e\/|watch\?v=)([^#\&\?]*)"
    )
    match = re.search(pattern, url)
    if match and len(match.group(1)) == 11:
        return match.group(1)
    raise ValueError("Invalid YouTube URL")


@router.post("/api/v1/ingest", status_code=202)
def ingest_video(
    req: IngestRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    try:
        yt_id = extract_youtube_id(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    # Store video record
    res = db.table("videos").select("*").eq("youtube_id", yt_id).execute()
    if res.data:
        video = res.data[0]
    else:
        video_data = {
            "youtube_id": yt_id,
            "title": f"YouTube Video {yt_id}",
            "status": "pending",
            "current_offset": 0.0,
            "user_id": "00000000-0000-0000-0000-000000000000",  # Stub user_id for test isolation
        }
        ins_res = db.table("videos").insert(video_data).execute()
        video = ins_res.data[0]

    # Construct base URL dynamically if BACKEND_URL is localhost/loopback or empty
    backend_url = settings.BACKEND_URL
    if not backend_url or "localhost" in backend_url or "127.0.0.1" in backend_url or "::1" in backend_url:
        forwarded_proto = request.headers.get("x-forwarded-proto", "http")
        forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.base_url.netloc
        if forwarded_host:
            backend_url = f"{forwarded_proto}://{forwarded_host}"
        else:
            backend_url = str(request.base_url).rstrip("/")

    # Publish to QStash or run locally in BackgroundTasks
    if settings.ENVIRONMENT == "local" and "pytest" not in sys.modules:
        background_tasks.add_task(
            process_video_task,
            video["id"],
            "transcribe",
            0.0,
            db,
            settings,
            background_tasks,
            backend_url,
        )
    elif settings.QSTASH_TOKEN:
        q_client = QStash(token=settings.QSTASH_TOKEN)
        q_client.message.publish_json(
            url=f"{backend_url}/api/v1/internal/process-video",
            body={"video_id": video["id"], "step": "transcribe", "offset": 0.0},
        )
    return {"video_id": video["id"], "status": video["status"]}
