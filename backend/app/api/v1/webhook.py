import os
import sys
import tempfile

import cv2
import numpy as np
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from qstash import Receiver
from qstash.errors import SignatureError
from supabase import Client as SupabaseClient
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig

from app.core.config import Settings, get_settings
from app.core.database import get_supabase
from app.core.helpers import dispatch_ingest_task, logger, resolve_backend_url
from app.services.frame_extractor import (
    analyze_frame_with_gemini,
    calculate_ssim,
    download_video_segment,
    extract_frames_from_video,
)
from app.services.transcription import (
    download_audio_segment,
    fetch_transcript_from_supadata,
    get_embedding,
    time_aware_chunker,
    transcribe_audio_with_gemini,
)

router = APIRouter()


async def verify_qstash_signature(
    request: Request,
    settings: Settings = Depends(get_settings),
):
    if settings.ENVIRONMENT == "local" and not settings.QSTASH_CURRENT_SIGNING_KEY:
        # Bypass signature verification in local development if key is empty
        return

    signature = request.headers.get("Upstash-Signature") or request.headers.get(
        "signature"
    )
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
    gemini_api_key: str | None = None,
) -> dict:
    """
    Executes the video ingestion and processing task step-by-step.
    Supports recursive scheduling via either QStash or local BackgroundTasks.
    """
    base_url = (backend_url or settings.BACKEND_URL or "").rstrip("/")

    # Fetch video record
    res = db.table("videos").select("*").eq("id", video_id).execute()
    if not res.data:
        raise ValueError("Video not found")
    video = res.data[0]
    yt_url = f"https://www.youtube.com/watch?v={video['youtube_id']}"

    if step == "transcribe":

        def save_transcript_and_advance(raw_items_list):
            chunks = time_aware_chunker(raw_items_list)
            # Embed & store chunk-by-chunk
            for ch in chunks:
                embedding = get_embedding(ch["content"], api_key=gemini_api_key)
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
                    gemini_api_key,
                )
            elif settings.QSTASH_TOKEN:
                from qstash import QStash

                q_client = QStash(token=settings.QSTASH_TOKEN)
                q_client.message.publish_json(
                    url=f"{base_url}/api/v1/internal/process-video",
                    body={
                        "video_id": video_id,
                        "step": "extract_frames",
                        "offset": 0.0,
                        "gemini_api_key": gemini_api_key,
                    },
                )

        # Tier 1: Try native transcript first
        try:
            if settings.YOUTUBE_PROXY:
                proxy_config = GenericProxyConfig(
                    http_url=settings.YOUTUBE_PROXY,
                    https_url=settings.YOUTUBE_PROXY,
                )
                api = YouTubeTranscriptApi(proxy_config=proxy_config)
            else:
                api = YouTubeTranscriptApi()

            raw_items = list(api.fetch(video["youtube_id"]))
            save_transcript_and_advance(raw_items)
            return {"status": "ok"}
        except Exception as e:
            print(f"Native transcript failed: {e}. Attempting Supadata...")

        # Tier 2: Try Supadata transcript
        if settings.SUPADATA_API_KEY:
            try:
                raw_items = fetch_transcript_from_supadata(
                    video["youtube_id"], settings.SUPADATA_API_KEY
                )
                save_transcript_and_advance(raw_items)
                return {"status": "ok"}
            except Exception as e_supa:
                print(
                    f"Supadata transcript failed: {e_supa}. Falling back to Gemini transcription..."
                )
        else:
            print(
                "Supadata API key not configured. Falling back to Gemini transcription..."
            )

        # Tier 3: Fallback to audio segment extraction + Gemini transcription
        try:
            # Generate platform-safe temp path
            tmp_audio = os.path.join(
                tempfile.gettempdir(), f"audio_{video_id}_{offset}.m4a"
            )
            try:
                download_audio_segment(
                    yt_url,
                    offset,
                    offset + 600.0,
                    tmp_audio,
                    youtube_proxy=settings.YOUTUBE_PROXY,
                )
                transcript_text = transcribe_audio_with_gemini(
                    tmp_audio, api_key=gemini_api_key
                )

                # Embed and insert single chunk
                embedding = get_embedding(transcript_text, api_key=gemini_api_key)
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

                dispatch_ingest_task(
                    video_id=video_id,
                    step="transcribe",
                    offset=offset + 600.0,
                    db=db,
                    settings=settings,
                    background_tasks=background_tasks,
                    backend_url=base_url,
                    gemini_api_key=gemini_api_key,
                )
            else:
                db.table("videos").update(
                    {"status": "processing_frames", "current_offset": 0.0}
                ).eq("id", video_id).execute()

                dispatch_ingest_task(
                    video_id=video_id,
                    step="extract_frames",
                    offset=0.0,
                    db=db,
                    settings=settings,
                    background_tasks=background_tasks,
                    backend_url=base_url,
                    gemini_api_key=gemini_api_key,
                )
        except Exception as e_fallback:
            logger.error(f"Fallback transcription failed: {e_fallback}", exc_info=True)
            db.table("videos").update({"status": "failed"}).eq("id", video_id).execute()
            raise e_fallback

    elif step == "extract_frames":
        tmp_video = os.path.join(
            tempfile.gettempdir(), f"video_{video_id}_{offset}.mp4"
        )
        try:
            try:
                download_video_segment(
                    yt_url,
                    offset,
                    offset + 600.0,
                    tmp_video,
                    youtube_proxy=settings.YOUTUBE_PROXY,
                )
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
                    slide_analysis = analyze_frame_with_gemini(
                        frame_bytes, api_key=gemini_api_key
                    )
                    if not slide_analysis or not slide_analysis.is_slide:
                        continue

                    storage_path = f"{video_id}/{offset + timestamp}.webp"
                    storage_url = f"https://mock.storage/{storage_path}"

                    # Upload to Supabase Storage if configured and not in test mode
                    if not ("pytest" in sys.modules or not settings.SUPABASE_URL):
                        try:
                            db.storage.from_("video-frames").upload(
                                path=storage_path,
                                file=frame_bytes,
                                file_options={"content-type": "image/webp"},
                            )
                            storage_url = db.storage.from_(
                                "video-frames"
                            ).get_public_url(storage_path)
                        except Exception as e:
                            logger.error(
                                f"Failed to upload to storage: {e}", exc_info=True
                            )

                    db.table("video_chunks").insert(
                        {
                            "video_id": video_id,
                            "content": f"Slide: {slide_analysis.slide_title or ''}\nOCR Text: {slide_analysis.ocr_text}\nVisual Description: {slide_analysis.visual_description}",
                            "embedding": get_embedding(
                                slide_analysis.ocr_text, api_key=gemini_api_key
                            ),
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
            except Exception as e:
                # If frame extraction fails, check if we already have transcript chunks.
                # If so, we can proceed to completed so the RAG workspace is still active!
                # Otherwise, we mark the video as failed.
                logger.error(f"Frame extraction segment failed: {e}", exc_info=True)
                chunks_res = (
                    db.table("video_chunks")
                    .select("id")
                    .eq("video_id", video_id)
                    .eq("chunk_type", "transcript")
                    .execute()
                )
                if chunks_res.data:
                    logger.warning(
                        "Transcript chunks exist. Completing video without further visual frames."
                    )
                    duration = video.get("duration") or 3600.0
                    db.table("videos").update(
                        {"status": "completed", "current_offset": duration}
                    ).eq("id", video_id).execute()
                    return {"status": "ok"}
                else:
                    db.table("videos").update({"status": "failed"}).eq(
                        "id", video_id
                    ).execute()
                    raise e
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

            dispatch_ingest_task(
                video_id=video_id,
                step="extract_frames",
                offset=offset + 600.0,
                db=db,
                settings=settings,
                background_tasks=background_tasks,
                backend_url=base_url,
                gemini_api_key=gemini_api_key,
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
    gemini_api_key = req_data.get("gemini_api_key")

    # Ingest / webhook requests can infer backend_url
    backend_url = resolve_backend_url(request, settings)

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
            gemini_api_key=gemini_api_key,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
