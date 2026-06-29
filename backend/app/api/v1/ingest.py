import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from qstash import Client as QStashClient
from supabase import create_client, Client as SupabaseClient
from app.core.config import settings

router = APIRouter()

class IngestRequest(BaseModel):
    url: str

def get_supabase() -> SupabaseClient:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def extract_youtube_id(url: str) -> str:
    pattern = r"(?:v=|\/embed\/|\/10\/|\/vi\/|youtu\.be\/|\/v\/|\/e\/|watch\?v=)([^#\&\?]*)"
    match = re.search(pattern, url)
    if match and len(match.group(1)) == 11:
        return match.group(1)
    raise ValueError("Invalid YouTube URL")

@router.post("/api/v1/ingest", status_code=202)
def ingest_video(req: IngestRequest, db: SupabaseClient = Depends(get_supabase)):
    try:
        yt_id = extract_youtube_id(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
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
            "user_id": "00000000-0000-0000-0000-000000000000"  # Stub user_id for test isolation
        }
        ins_res = db.table("videos").insert(video_data).execute()
        video = ins_res.data[0]

    # Publish to QStash
    if settings.QSTASH_TOKEN:
        q_client = QStashClient(token=settings.QSTASH_TOKEN)
        q_client.publish_json(
            url=f"{settings.BACKEND_URL}/api/v1/internal/process-video",
            body={
                "video_id": video["id"],
                "step": "transcribe",
                "offset": 0.0
            }
        )
    return {"video_id": video["id"], "status": video["status"]}
