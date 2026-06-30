import re

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from supabase import Client as SupabaseClient

from app.core.config import Settings, get_settings
from app.core.database import get_supabase, get_youtube_title
from app.core.helpers import dispatch_ingest_task, resolve_backend_url
from app.schemas import IngestRequest, ManualIngestRequest
from app.services.transcription import (
    get_embedding,
    parse_manual_transcript,
    time_aware_chunker,
)

router = APIRouter()


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
    x_gemini_api_key: str | None = Header(None),
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
        title = get_youtube_title(yt_id)
        video_data = {
            "youtube_id": yt_id,
            "title": title,
            "status": "pending",
            "current_offset": 0.0,
            "user_id": "00000000-0000-0000-0000-000000000000",  # Stub user_id for test isolation
        }
        ins_res = db.table("videos").insert(video_data).execute()
        video = ins_res.data[0]

    # Construct base URL dynamically if BACKEND_URL is localhost/loopback or empty
    backend_url = resolve_backend_url(request, settings)

    dispatch_ingest_task(
        video_id=video["id"],
        step="transcribe",
        offset=0.0,
        db=db,
        settings=settings,
        background_tasks=background_tasks,
        backend_url=backend_url,
        gemini_api_key=x_gemini_api_key,
    )
    return {"video_id": video["id"], "status": video["status"]}


@router.delete("/api/v1/videos/{video_id}")
def delete_video(
    video_id: str,
    db: SupabaseClient | None = Depends(get_supabase),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    # Prevent deletion of default catalog videos by direct ID/YouTube ID match
    if video_id in [
        "dQw4w9WgXcQ",
        "-9bo8HlSxwQ",
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
    ]:
        raise HTTPException(
            status_code=400, detail="Default catalog videos cannot be deleted."
        )

    # Also query the DB by UUID or youtube_id to fetch the record just in case
    try:
        video_res = (
            db.table("videos")
            .select("youtube_id")
            .or_(f"id.eq.{video_id},youtube_id.eq.{video_id}")
            .execute()
        )
        if video_res.data:
            yt_id = video_res.data[0]["youtube_id"]
            if yt_id in ["dQw4w9WgXcQ", "-9bo8HlSxwQ"]:
                raise HTTPException(
                    status_code=400, detail="Default catalog videos cannot be deleted."
                )
    except Exception:
        # Ignore DB errors (like invalid UUID format) and let it fall through
        pass

    # Delete from Supabase. Cascade delete will wipe all chunks and joins.
    db.table("videos").delete().eq("id", video_id).execute()
    return {"status": "success", "message": f"Video {video_id} deleted successfully"}


@router.post("/api/v1/ingest/manual")
def ingest_manual_transcript(
    req: ManualIngestRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
    x_gemini_api_key: str | None = Header(None),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    # Fetch video record
    res = db.table("videos").select("*").eq("id", req.video_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Video record not found")
    video = res.data[0]

    # Delete any existing chunks to avoid duplication
    db.table("video_chunks").delete().eq("video_id", req.video_id).execute()

    parsed_items = parse_manual_transcript(
        req.transcript_text, duration=video.get("duration", 0.0)
    )
    if not parsed_items:
        raise HTTPException(
            status_code=400, detail="Could not parse any content from transcript text"
        )

    chunks = time_aware_chunker(parsed_items)

    # Embed and store chunks
    for ch in chunks:
        embedding = get_embedding(ch["content"], api_key=x_gemini_api_key)
        db.table("video_chunks").insert(
            {
                "video_id": req.video_id,
                "content": ch["content"],
                "embedding": embedding,
                "start_time": ch["start_time"],
                "end_time": ch["end_time"],
                "chunk_type": "transcript",
                "metadata": {},
            }
        ).execute()

    # Update status to processing_frames
    db.table("videos").update(
        {"status": "processing_frames", "current_offset": 0.0}
    ).eq("id", req.video_id).execute()

    # Construct base URL dynamically if BACKEND_URL is localhost/loopback or empty
    backend_url = resolve_backend_url(request, settings)

    # Trigger frames extraction webhook/task
    dispatch_ingest_task(
        video_id=req.video_id,
        step="extract_frames",
        offset=0.0,
        db=db,
        settings=settings,
        background_tasks=background_tasks,
        backend_url=backend_url,
        gemini_api_key=x_gemini_api_key,
    )

    return {"status": "ok"}
