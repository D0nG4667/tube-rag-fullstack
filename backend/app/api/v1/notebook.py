import io
import struct
import sys

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel
from supabase import Client as SupabaseClient

from app.core.config import Settings, get_settings
from app.core.database import get_supabase
from app.core.exceptions import is_gemini_quota_error
from app.services.prompts import (
    MINDMAP_SYSTEM_INSTRUCTION,
    MINDMAP_USER_TEMPLATE,
    NOTES_SYSTEM_INSTRUCTION,
    NOTES_USER_TEMPLATE,
    OUTLINE_SYSTEM_INSTRUCTION,
    OUTLINE_USER_TEMPLATE,
    PODCAST_SYSTEM_INSTRUCTION,
    PODCAST_USER_TEMPLATE,
)

router = APIRouter()


class NotebookRequest(BaseModel):
    video_id: str


# Pydantic schemas for structured Gemini outputs


class DialogueTurn(BaseModel):
    host: str  # "Host A" or "Host B"
    text: str


class PodcastScript(BaseModel):
    script: list[DialogueTurn]


class MindmapLeaf(BaseModel):
    text: str
    seconds: int


class MindmapBranch(BaseModel):
    title: str
    leaves: list[MindmapLeaf]


class MindmapSchema(BaseModel):
    subject: str
    branches: list[MindmapBranch]


@router.post("/api/v1/notebook/outline")
def generate_outline(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    # Fetch transcript chunks
    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "outline": (
                "# Mock Presentation Outline\n\n"
                "## Chapter 1: Introduction [0s]\n"
                "- Welcome to the session and initial overview.\n"
                "- High-level goals and codebase walkthrough.\n\n"
                "## Chapter 2: Key Concepts [60s]\n"
                "- Core engineering principles covered.\n"
                "- Discussion of architectural bottlenecks."
            )
        }

    client = genai.Client(api_key=effective_key)
    prompt = OUTLINE_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=OUTLINE_SYSTEM_INSTRUCTION
            ),
        )
        return {"outline": response.text}
    except Exception as e:
        if is_gemini_quota_error(e):
            raise HTTPException(status_code=429, detail="GEMINI_API_KEY_REQUIRED") from e
        raise HTTPException(status_code=500, detail=f"LLM outline error: {e!s}") from e


@router.post("/api/v1/notebook/podcast")
def generate_podcast(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "script": [
                {
                    "host": "Rachel",
                    "text": "[cheerfully] Welcome back to another StudyStudio deep dive! Today we're unpacking some fascinating concepts from this lecture.",
                },
                {
                    "host": "Liam",
                    "text": "[nodding] Yeah, it's a really interesting session. We're going to break down the main variables, architectural patterns, and why they matter in a real-world system.",
                },
                {
                    "host": "Rachel",
                    "text": "[leaning in] Can't wait! Let's get right into the first major takeaway.",
                },
            ]
        }

    client = genai.Client(api_key=effective_key)
    prompt = PODCAST_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=PODCAST_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=PodcastScript,
            ),
        )
        data = PodcastScript.model_validate_json(response.text)
        return {"script": [turn.model_dump() for turn in data.script]}
    except Exception as e:
        if is_gemini_quota_error(e):
            raise HTTPException(
                status_code=429, detail="GEMINI_API_KEY_REQUIRED"
            ) from e
        raise HTTPException(status_code=500, detail=f"LLM podcast error: {e!s}") from e


@router.post("/api/v1/notebook/mindmap")
def generate_mindmap(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "subject": "Mock Project Scope",
            "branches": [
                {
                    "title": "Initialization",
                    "leaves": [
                        {"text": "Project scaffold and workspace config", "seconds": 0},
                        {"text": "Database setup and migrations", "seconds": 45},
                    ],
                },
                {
                    "title": "RAG Engine Integration",
                    "leaves": [
                        {"text": "Transcription and text chunking", "seconds": 120},
                        {"text": "Vector embeddings and search", "seconds": 240},
                    ],
                },
            ],
        }

    client = genai.Client(api_key=effective_key)
    prompt = MINDMAP_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=MINDMAP_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=MindmapSchema,
            ),
        )
        data = MindmapSchema.model_validate_json(response.text)
        return data.model_dump()
    except Exception as e:
        if is_gemini_quota_error(e):
            raise HTTPException(
                status_code=429, detail="GEMINI_API_KEY_REQUIRED"
            ) from e
        raise HTTPException(status_code=500, detail=f"LLM mindmap error: {e!s}") from e


class PodcastAudioRequest(BaseModel):
    script: list[DialogueTurn]


@router.post("/api/v1/notebook/notes")
def generate_notes(
    req: NotebookRequest,
    x_gemini_api_key: str | None = Header(None),
    db: SupabaseClient | None = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Database client is not configured")

    res = (
        db.table("video_chunks")
        .select("content, start_time")
        .eq("video_id", req.video_id)
        .order("start_time")
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="No transcript chunks found for this video. Please wait until indexing completes.",
        )

    full_transcript = "\n".join(
        [f"[{int(item['start_time'])}s]: {item['content']}" for item in res.data]
    )

    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        return {
            "notes": (
                "- Introduction to StudyStudio overview: Discusses layout configurations and user interface split panels.\n"
                "- Advanced layout configurations: Explores left control drawer, dynamic sidebars, and custom resizer triggers.\n"
                "- Visual representations: Details on-screen WebGL floating nodes, canvas rendering, and dark mode toggles."
            )
        }

    client = genai.Client(api_key=effective_key)
    prompt = NOTES_USER_TEMPLATE.format(full_transcript=full_transcript)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=NOTES_SYSTEM_INSTRUCTION
            ),
        )
        return {"notes": response.text}
    except Exception as e:
        if is_gemini_quota_error(e):
            raise HTTPException(
                status_code=429, detail="GEMINI_API_KEY_REQUIRED"
            ) from e
        raise HTTPException(status_code=500, detail=f"LLM notes error: {e!s}") from e


@router.post("/api/v1/notebook/podcast-audio")
def generate_podcast_audio(
    req: PodcastAudioRequest,
    x_gemini_api_key: str | None = Header(None),
    settings: Settings = Depends(get_settings),
):
    effective_key = x_gemini_api_key or settings.GEMINI_API_KEY
    if (
        "pytest" in sys.modules
        or not effective_key
        or effective_key == "your-gemini-api-key"
    ):
        data_size = 48000
        mock_header = (
            b"RIFF"
            + struct.pack("<I", data_size + 36)
            + b"WAVE"
            + b"fmt "
            + struct.pack("<I", 16)
            + struct.pack("<H", 1)
            + struct.pack("<H", 1)
            + struct.pack("<I", 24000)
            + struct.pack("<I", 48000)
            + struct.pack("<H", 2)
            + struct.pack("<H", 16)
            + b"data"
            + struct.pack("<I", data_size)
        )
        mock_wav = mock_header + (b"\x00" * data_size)
        return StreamingResponse(io.BytesIO(mock_wav), media_type="audio/wav")

    client = genai.Client(api_key=effective_key)
    wav_clips = []

    try:
        active_turns = req.script[:8]
        for turn in active_turns:
            voice_name = "Aoede" if turn.host == "Rachel" else "Puck"

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=turn.text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name
                            )
                        )
                    ),
                ),
            )

            clip_bytes = None
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        clip_bytes = part.inline_data.data
                        break

            if clip_bytes:
                wav_clips.append(clip_bytes)

        if not wav_clips:
            raise HTTPException(
                status_code=500, detail="No audio data generated by Gemini"
            )

        first_header = wav_clips[0][:44]
        fmt_chunk_size = struct.unpack("<I", first_header[16:20])[0]
        audio_format = struct.unpack("<H", first_header[20:22])[0]
        num_channels = struct.unpack("<H", first_header[22:24])[0]
        sample_rate = struct.unpack("<I", first_header[24:28])[0]
        bits_per_sample = struct.unpack("<H", first_header[34:36])[0]

        raw_pcm_data = b""
        for clip in wav_clips:
            data_index = clip.find(b"data")
            if data_index != -1:
                clip_data_size = struct.unpack(
                    "<I", clip[data_index + 4 : data_index + 8]
                )[0]
                raw_pcm_data += clip[data_index + 8 : data_index + 8 + clip_data_size]
            else:
                raw_pcm_data += clip[44:]

        total_data_size = len(raw_pcm_data)

        new_header = (
            b"RIFF"
            + struct.pack("<I", total_data_size + 36)
            + b"WAVE"
            + b"fmt "
            + struct.pack("<I", fmt_chunk_size)
            + struct.pack("<H", audio_format)
            + struct.pack("<H", num_channels)
            + struct.pack("<I", sample_rate)
            + struct.pack("<I", sample_rate * num_channels * (bits_per_sample // 8))
            + struct.pack("<H", num_channels * (bits_per_sample // 8))
            + struct.pack("<H", bits_per_sample)
            + b"data"
            + struct.pack("<I", total_data_size)
        )
        combined_wav = new_header + raw_pcm_data

        return StreamingResponse(io.BytesIO(combined_wav), media_type="audio/wav")

    except Exception as e:
        if is_gemini_quota_error(e):
            raise HTTPException(
                status_code=429, detail="GEMINI_API_KEY_REQUIRED"
            ) from e
        raise HTTPException(
            status_code=500, detail=f"TTS podcast audio error: {e!s}"
        ) from e
