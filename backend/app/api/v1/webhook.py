import os
import sys
import tempfile
from fastapi import APIRouter, Header, HTTPException, Request, Depends
from supabase import Client as SupabaseClient
from qstash import Receiver
from qstash.errors import SignatureError
from app.core.config import Settings, get_settings
from app.api.v1.ingest import get_supabase
from app.services.transcription import (
    time_aware_chunker, 
    download_audio_segment, 
    transcribe_audio_with_gemini,
    get_embedding
)
from youtube_transcript_api import YouTubeTranscriptApi

router = APIRouter()

async def verify_qstash_signature(request: Request, signature: str = Header(None), settings: Settings = Depends(get_settings)):
    if settings.ENVIRONMENT == "local" and not settings.QSTASH_CURRENT_SIGNING_KEY:
        # Bypass signature verification in local development if key is empty
        return
    
    if not signature:
        raise HTTPException(status_code=401, detail="Signature missing")
        
    body = await request.body()
    try:
        receiver = Receiver(
            current_signing_key=settings.QSTASH_CURRENT_SIGNING_KEY,
            next_signing_key=settings.QSTASH_NEXT_SIGNING_KEY
        )
        receiver.verify(
            signature=signature,
            body=body.decode("utf-8")
        )
    except SignatureError as e:
        raise HTTPException(status_code=401, detail=f"Invalid signature: {e}")

@router.post("/api/v1/internal/process-video")
async def process_video_webhook(
    req_data: dict,
    request: Request,
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
    sig_verify = Depends(verify_qstash_signature)
):
    video_id = req_data.get("video_id")
    step = req_data.get("step")
    offset = req_data.get("offset", 0.0)

    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    # Fetch video record
    res = db.table("videos").select("*").eq("id", video_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Video not found")
    video = res.data[0]
    yt_url = f"https://www.youtube.com/watch?v={video['youtube_id']}"

    if step == "transcribe":
        try:
            # Check native transcript first (using instance-based fetch for youtube-transcript-api v1.x)
            raw_items = list(YouTubeTranscriptApi().fetch(video["youtube_id"]))
            chunks = time_aware_chunker(raw_items)
            
            # Embed & store chunk-by-chunk
            for ch in chunks:
                embedding = get_embedding(ch["content"])
                db.table("video_chunks").insert({
                    "video_id": video_id,
                    "content": ch["content"],
                    "embedding": embedding,
                    "start_time": ch["start_time"],
                    "end_time": ch["end_time"],
                    "chunk_type": "transcript",
                    "metadata": {}
                }).execute()
            
            # Progress status to frame extraction
            db.table("videos").update({
                "status": "processing_frames", 
                "current_offset": 0.0
            }).eq("id", video_id).execute()
            
        except Exception as e:
            # Fallback to audio segment extraction + Gemini transcription
            print(f"Native transcript failed: {e}. Falling back to Gemini transcription...")
            
            # Generate platform-safe temp path
            tmp_audio = os.path.join(tempfile.gettempdir(), f"audio_{video_id}_{offset}.m4a")
            try:
                download_audio_segment(yt_url, offset, offset + 600.0, tmp_audio)
                transcript_text = transcribe_audio_with_gemini(tmp_audio)
                
                # Embed and insert single chunk
                embedding = get_embedding(transcript_text)
                db.table("video_chunks").insert({
                    "video_id": video_id,
                    "content": transcript_text,
                    "embedding": embedding,
                    "start_time": offset,
                    "end_time": offset + 600.0,
                    "chunk_type": "transcript",
                    "metadata": {}
                }).execute()
                
            finally:
                if os.path.exists(tmp_audio):
                    try:
                        os.remove(tmp_audio)
                    except Exception:
                        pass

            # Schedule next transcription segment or advance stage
            duration = video.get("duration") or 3600.0
            if offset + 600.0 < duration:
                # Schedule next segment in queue
                if settings.QSTASH_TOKEN:
                    from qstash import QStash
                    q_client = QStash(token=settings.QSTASH_TOKEN)
                    q_client.message.publish_json(
                        url=f"{settings.BACKEND_URL}/api/v1/internal/process-video",
                        body={
                            "video_id": video_id,
                            "step": "transcribe",
                            "offset": offset + 600.0
                        }
                    )
                # Keep status as transcribing but record current offset progress
                db.table("videos").update({
                    "status": "transcribing",
                    "current_offset": offset + 600.0
                }).eq("id", video_id).execute()
            else:
                db.table("videos").update({
                    "status": "processing_frames",
                    "current_offset": 0.0
                }).eq("id", video_id).execute()

    return {"status": "ok"}
