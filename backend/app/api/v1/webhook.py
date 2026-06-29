import os
import sys
import tempfile

import cv2
import numpy as np
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from qstash import Receiver
from qstash.errors import SignatureError
from supabase import Client as SupabaseClient
from youtube_transcript_api import YouTubeTranscriptApi

from app.core.config import Settings, get_settings
from app.core.database import get_supabase
from app.services.frame_extractor import (
    analyze_frame_with_gemini,
    calculate_ssim,
    download_video_segment,
    extract_frames_from_video,
)
from app.services.transcription import (
    download_audio_segment,
    get_embedding,
    time_aware_chunker,
    transcribe_audio_with_gemini,
)

router = APIRouter()


async def verify_qstash_signature(
    request: Request,
    signature: str = Header(None),
    settings: Settings = Depends(get_settings),
):
    if settings.ENVIRONMENT == "local" and not settings.QSTASH_CURRENT_SIGNING_KEY:
        # Bypass signature verification in local development if key is empty
        return

    if not signature:
        raise HTTPException(status_code=401, detail="Signature missing")

    body = await request.body()
    try:
        receiver = Receiver(
            current_signing_key=settings.QSTASH_CURRENT_SIGNING_KEY,
            next_signing_key=settings.QSTASH_NEXT_SIGNING_KEY,
        )
        receiver.verify(signature=signature, body=body.decode("utf-8"))
    except SignatureError as e:
        raise HTTPException(status_code=401, detail=f"Invalid signature: {e}") from e


def process_video_task(
    video_id: str,
    step: str,
    offset: float,
    db: SupabaseClient,
    settings: Settings,
    background_tasks: BackgroundTasks | None = None,
    backend_url: str | None = None,
) -> dict:
    """
    Executes the video ingestion and processing task step-by-step.
    Supports recursive scheduling via either QStash or local BackgroundTasks.
    """
    # Fetch video record
    res = db.table("videos").select("*").eq("id", video_id).execute()
    if not res.data:
        raise ValueError("Video not found")
    video = res.data[0]
    yt_url = f"https://www.youtube.com/watch?v={video['youtube_id']}"

    if step == "transcribe":
        try:
            # Check native transcript first
            raw_items = list(YouTubeTranscriptApi().fetch(video["youtube_id"]))
            chunks = time_aware_chunker(raw_items)

            # Embed & store chunk-by-chunk
            for ch in chunks:
                embedding = get_embedding(ch["content"])
                db.table("video_chunks").insert(
                    {
                        "video_id": video_id,
                        "content": ch["content"],
                        "embedding": embedding,
                        "start_time": ch["start_time"],
                        "end_time": ch["end_time"],
                        "chunk_type": "transcript",
                        "metadata": {},
                    }
                ).execute()

            # Progress status to frame extraction and publish first segment
            db.table("videos").update(
                {"status": "processing_frames", "current_offset": 0.0}
            ).eq("id", video_id).execute()

            # Schedule frame extraction
            if (
                settings.ENVIRONMENT == "local"
                and "pytest" not in sys.modules
                and background_tasks
            ):
                background_tasks.add_task(
                    process_video_task,
                    video_id,
                    "extract_frames",
                    0.0,
                    db,
                    settings,
                    background_tasks,
                    backend_url,
                )
            elif settings.QSTASH_TOKEN:
                from qstash import QStash

                q_client = QStash(token=settings.QSTASH_TOKEN)
                q_client.message.publish_json(
                    url=f"{backend_url or settings.BACKEND_URL}/api/v1/internal/process-video",
                    body={
                        "video_id": video_id,
                        "step": "extract_frames",
                        "offset": 0.0,
                    },
                )

        except Exception as e:
            # Fallback to audio segment extraction + Gemini transcription
            print(
                f"Native transcript failed: {e}. Falling back to Gemini transcription..."
            )

            # Generate platform-safe temp path
            tmp_audio = os.path.join(
                tempfile.gettempdir(), f"audio_{video_id}_{offset}.m4a"
            )
            try:
                download_audio_segment(yt_url, offset, offset + 600.0, tmp_audio)
                transcript_text = transcribe_audio_with_gemini(tmp_audio)

                # Embed and insert single chunk
                embedding = get_embedding(transcript_text)
                db.table("video_chunks").insert(
                    {
                        "video_id": video_id,
                        "content": transcript_text,
                        "embedding": embedding,
                        "start_time": offset,
                        "end_time": offset + 600.0,
                        "chunk_type": "transcript",
                        "metadata": {},
                    }
                ).execute()

            finally:
                if os.path.exists(tmp_audio):
                    try:
                        os.remove(tmp_audio)
                    except Exception:
                        pass

            # Schedule next transcription segment or advance stage
            duration = video.get("duration") or 3600.0
            if offset + 600.0 < duration:
                # Keep status as transcribing but record progress
                db.table("videos").update(
                    {"status": "transcribing", "current_offset": offset + 600.0}
                ).eq("id", video_id).execute()

                if (
                    settings.ENVIRONMENT == "local"
                    and "pytest" not in sys.modules
                    and background_tasks
                ):
                    background_tasks.add_task(
                        process_video_task,
                        video_id,
                        "transcribe",
                        offset + 600.0,
                        db,
                        settings,
                        background_tasks,
                        backend_url,
                    )
                elif settings.QSTASH_TOKEN:
                    from qstash import QStash

                    q_client = QStash(token=settings.QSTASH_TOKEN)
                    q_client.message.publish_json(
                        url=f"{backend_url or settings.BACKEND_URL}/api/v1/internal/process-video",
                        body={
                            "video_id": video_id,
                            "step": "transcribe",
                            "offset": offset + 600.0,
                        },
                    )
            else:
                db.table("videos").update(
                    {"status": "processing_frames", "current_offset": 0.0}
                ).eq("id", video_id).execute()

                if (
                    settings.ENVIRONMENT == "local"
                    and "pytest" not in sys.modules
                    and background_tasks
                ):
                    background_tasks.add_task(
                        process_video_task,
                        video_id,
                        "extract_frames",
                        0.0,
                        db,
                        settings,
                        background_tasks,
                        backend_url,
                    )
                elif settings.QSTASH_TOKEN:
                    from qstash import QStash

                    q_client = QStash(token=settings.QSTASH_TOKEN)
                    q_client.message.publish_json(
                        url=f"{backend_url or settings.BACKEND_URL}/api/v1/internal/process-video",
                        body={
                            "video_id": video_id,
                            "step": "extract_frames",
                            "offset": 0.0,
                        },
                    )

    elif step == "extract_frames":
        tmp_video = os.path.join(
            tempfile.gettempdir(), f"video_{video_id}_{offset}.mp4"
        )
        try:
            download_video_segment(yt_url, offset, offset + 600.0, tmp_video)
            frames = extract_frames_from_video(tmp_video, interval_sec=10.0)

            prev_img = None
            for timestamp, frame_bytes in frames:
                # Decode frame bytes to CV image for SSIM calculation
                nparr = np.frombuffer(frame_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    continue

                if prev_img is not None:
                    sim = calculate_ssim(img, prev_img)
                    if sim >= 0.90:
                        # Skip duplicate frame
                        continue

                # Run vision model and store
                slide_analysis = analyze_frame_with_gemini(frame_bytes)

                # Default storage path and URL
                storage_path = f"frames/{video_id}/{offset + timestamp}.webp"
                storage_url = f"https://mock.storage/{storage_path}"

                # Upload to Supabase Storage if configured and not in test mode
                if not ("pytest" in sys.modules or not settings.SUPABASE_URL):
                    try:
                        db.storage.from_("video-frames").upload(
                            path=storage_path,
                            file=frame_bytes,
                            file_options={"content-type": "image/webp"},
                        )
                        storage_url = db.storage.from_("video-frames").get_public_url(
                            storage_path
                        )
                    except Exception as e:
                        print(f"Failed to upload to storage: {e}")

                db.table("video_chunks").insert(
                    {
                        "video_id": video_id,
                        "content": f"Slide: {slide_analysis.slide_title or ''}\nOCR Text: {slide_analysis.ocr_text}\nVisual Description: {slide_analysis.visual_description}",
                        "embedding": get_embedding(slide_analysis.ocr_text),
                        "start_time": offset + timestamp,
                        "end_time": offset + timestamp + 10.0,
                        "chunk_type": "visual_frame",
                        "image_url": storage_url,
                        "metadata": {
                            "slide_title": slide_analysis.slide_title,
                            "code_snippets": slide_analysis.code_snippets,
                        },
                    }
                ).execute()

                prev_img = img

        finally:
            if os.path.exists(tmp_video):
                try:
                    os.remove(tmp_video)
                except Exception:
                    pass

        # Schedule next video segment or mark completed
        duration = video.get("duration") or 3600.0
        if offset + 600.0 < duration:
            db.table("videos").update(
                {"status": "processing_frames", "current_offset": offset + 600.0}
            ).eq("id", video_id).execute()

            if (
                settings.ENVIRONMENT == "local"
                and "pytest" not in sys.modules
                and background_tasks
            ):
                background_tasks.add_task(
                    process_video_task,
                    video_id,
                    "extract_frames",
                    offset + 600.0,
                    db,
                    settings,
                    background_tasks,
                    backend_url,
                )
            elif settings.QSTASH_TOKEN:
                from qstash import QStash

                q_client = QStash(token=settings.QSTASH_TOKEN)
                q_client.message.publish_json(
                    url=f"{backend_url or settings.BACKEND_URL}/api/v1/internal/process-video",
                    body={
                        "video_id": video_id,
                        "step": "extract_frames",
                        "offset": offset + 600.0,
                    },
                )
        else:
            db.table("videos").update(
                {"status": "completed", "current_offset": duration}
            ).eq("id", video_id).execute()

    return {"status": "ok"}


@router.post("/api/v1/internal/process-video")
async def process_video_webhook(
    req_data: dict,
    request: Request,
    background_tasks: BackgroundTasks,
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
    sig_verify=Depends(verify_qstash_signature),
):
    video_id = req_data.get("video_id")
    step = req_data.get("step")
    offset = req_data.get("offset", 0.0)

    # Ingest / webhook requests can infer backend_url
    backend_url = settings.BACKEND_URL
    if not backend_url or "localhost" in backend_url or "127.0.0.1" in backend_url or "::1" in backend_url:
        forwarded_proto = request.headers.get("x-forwarded-proto", "http")
        forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.base_url.netloc
        if forwarded_host:
            backend_url = f"{forwarded_proto}://{forwarded_host}"
        else:
            backend_url = str(request.base_url).rstrip("/")

    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    try:
        res = process_video_task(
            video_id=video_id,
            step=step,
            offset=offset,
            db=db,
            settings=settings,
            background_tasks=background_tasks,
            backend_url=backend_url,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
